'use client';

/**
 * Onboarding Chat — Full-screen conversational UI
 *
 * Lexi IS the onboarding. She asks questions, the user responds
 * with structured inputs (choice buttons, text, file upload).
 * Messages scroll naturally like a chat. Input widgets appear
 * inline at the bottom of the conversation.
 */

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, ArrowRight, Loader2, Rocket, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrewRole } from '@/types';
import {
  initConversation,
  advanceToNextState,
  processUserInput,
  processFileImport,
  saveState,
  loadState,
  clearState,
  STATE_DEFINITIONS,
  CREW_ROLE_OPTIONS,
  type OnboardingState,
  type OnboardingMessage,
  type ChoiceOption,
} from '@/lib/onboarding/engine';

// ============================================
// Shared Init Helper
// ============================================

function initAndAdvance(
  setState: (s: OnboardingState) => void,
  setIsTyping: (b: boolean) => void,
) {
  const initial = initConversation();
  setState(initial);
  setIsTyping(true);
  setTimeout(() => {
    const advanced = advanceToNextState(initial);
    setState(advanced);
    saveState(advanced);
    setIsTyping(false);
  }, 1200);
}

// ============================================
// Main Component
// ============================================

export function OnboardingChat() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    const saved = loadState();
    if (saved && saved.messages.length > 0) {
      setState(saved);
    } else {
      initAndAdvance(setState, setIsTyping);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [state?.messages.length, isTyping]);

  // Handle user input and advance state
  const handleInput = useCallback((input: string | Record<string, unknown>) => {
    if (!state) return;

    const updated = processUserInput(state, input);
    setState(updated);
    saveState(updated);

    // Check if the new state auto-advances (inputType: 'none')
    const nextDef = STATE_DEFINITIONS[updated.currentStateId];
    if (nextDef && nextDef.inputType === 'none' && updated.currentStateId !== 'complete' && updated.currentStateId !== 'launching') {
      setIsTyping(true);
      setTimeout(() => {
        const advanced = advanceToNextState(updated);
        setState(advanced);
        saveState(advanced);
        setIsTyping(false);
      }, 600);
    }
  }, [state]);

  // Handle file upload — dynamic import xlsx to avoid bundling it eagerly
  const handleFileUpload = useCallback(async (file: File) => {
    if (!state) return;
    setFileUploading(true);

    try {
      const buffer = await file.arrayBuffer();
      const { parseSpreadsheet } = await import('@/lib/import/xlsx-parser');
      const importData = parseSpreadsheet(buffer, file.name);
      const updated = processFileImport(state, importData);
      setState(updated);
      saveState(updated);
    } catch (err) {
      const errorMsg: OnboardingMessage = {
        id: `msg-error-${Date.now()}`,
        sender: 'lexi',
        content: `That file didn't work. ${err instanceof Error ? err.message : 'Try a different file — .xlsx or .csv.'}`,
        timestamp: Date.now(),
        inputType: 'file',
      };
      setState({
        ...state,
        messages: [...state.messages, errorMsg],
      });
    } finally {
      setFileUploading(false);
    }
  }, [state]);

  // Handle launch — sends updated.data (not stale state.data)
  const handleLaunch = useCallback(async () => {
    if (!state) return;

    const updated = processUserInput(state, 'launch');
    setState(updated);
    setLaunching(true);
    setLaunchError(null);

    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated.data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || `Launch failed (${res.status})`);
      }

      const result = await res.json() as { productionId: string; universeId: string };

      const completed = advanceToNextState(updated);
      setState(completed);
      clearState();

      setTimeout(() => {
        router.push(`/universe/${result.universeId}/production`);
      }, 1500);
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : 'Something went wrong');
      setLaunching(false);
    }
  }, [state, router]);

  // Reset onboarding
  const handleReset = useCallback(() => {
    clearState();
    initAndAdvance(setState, setIsTyping);
  }, []);

  if (!state) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-primary">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  // Determine current input state — findLast avoids copying + reversing
  const lastLexiMsg = state.messages.findLast((m) => m.sender === 'lexi');
  const currentInputType = lastLexiMsg?.inputType || 'none';
  const currentChoices = lastLexiMsg?.choices;

  return (
    <div className="flex flex-col h-screen bg-surface-primary">
      {/* Header */}
      <header className="shrink-0 border-b border-panel-border bg-surface-secondary px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <h1 className="text-base font-medium text-gray-200">Lexi</h1>
            <p className="text-xs text-gray-500">Production Setup</p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Start over
          </button>
        </div>
      </header>

      {/* Chat messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
      >
        <div className="max-w-2xl mx-auto space-y-4">
          {state.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-vhs-900 flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-vhs-400">L</span>
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-surface-secondary border border-panel-border">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-panel-border bg-surface-secondary px-4 py-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          {/* Choice buttons — data_import has special handling for upload */}
          {currentInputType === 'choice' && currentChoices && !isTyping && (
            state.currentStateId === 'data_import' ? (
              <ChoiceButtons
                choices={currentChoices}
                onSelect={(value) => {
                  if (value === 'upload') {
                    fileInputRef.current?.click();
                  } else {
                    handleInput(value);
                  }
                }}
              />
            ) : (
              <ChoiceButtons
                choices={currentChoices}
                onSelect={(value) => handleInput(value)}
              />
            )
          )}

          {/* Confirm buttons */}
          {currentInputType === 'confirm' && currentChoices && !isTyping && (
            <ChoiceButtons
              choices={currentChoices}
              onSelect={(value) => handleInput(value)}
            />
          )}

          {/* Text input */}
          {currentInputType === 'text' && !isTyping && (
            <TextInput onSubmit={(value) => handleInput(value)} />
          )}

          {/* Date range input */}
          {currentInputType === 'date_range' && !isTyping && (
            <DateRangeInput onSubmit={(dates) => handleInput(dates)} />
          )}

          {/* File upload when in file input mode (error retry) */}
          {currentInputType === 'file' && !isTyping && (
            <FileUploadArea
              onFile={handleFileUpload}
              isUploading={fileUploading}
              fileInputRef={fileInputRef}
            />
          )}

          {/* Cast entry */}
          {currentInputType === 'cast_entry' && !isTyping && (
            <CastEntryInput
              onSubmit={(entry) => handleInput(entry)}
              showDone={state.data.cast.length > 0}
            />
          )}

          {/* Crew entry */}
          {currentInputType === 'crew_entry' && !isTyping && (
            <CrewEntryInput
              onSubmit={(entry) => handleInput(entry)}
              showSkip={true}
            />
          )}

          {/* Launch button */}
          {currentInputType === 'launch' && !isTyping && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleLaunch}
                disabled={launching}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-medium transition-colors',
                  launching
                    ? 'bg-surface-tertiary text-gray-600 cursor-not-allowed'
                    : 'bg-vhs-400 text-white hover:bg-vhs-500'
                )}
              >
                {launching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting up your production...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    Launch Production
                  </>
                )}
              </button>
              {launchError && (
                <p className="text-sm text-red-400 text-center">{launchError}</p>
              )}
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Message Bubble (memoized — messages are append-only)
// ============================================

const MessageBubble = memo(function MessageBubble({ message }: { message: OnboardingMessage }) {
  const isLexi = message.sender === 'lexi';

  return (
    <div className={cn('flex items-start gap-3', !isLexi && 'justify-end')}>
      {isLexi && (
        <div className="w-8 h-8 rounded-full bg-vhs-900 flex items-center justify-center shrink-0">
          <span className="text-xs font-medium text-vhs-400">L</span>
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
          isLexi
            ? 'rounded-tl-sm bg-surface-secondary border border-panel-border text-gray-200'
            : 'rounded-tr-sm bg-vhs-900/50 border border-vhs-800/30 text-gray-200'
        )}
      >
        {message.content}
      </div>
    </div>
  );
});

// ============================================
// Choice Buttons
// ============================================

function ChoiceButtons({
  choices,
  onSelect,
}: {
  choices: ChoiceOption[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {choices.map((choice) => (
        <button
          key={choice.value}
          type="button"
          onClick={() => onSelect(choice.value)}
          className="w-full text-left px-4 py-3 rounded-xl border border-panel-border bg-surface-tertiary hover:bg-surface-elevated hover:border-vhs-800/40 transition-colors"
        >
          <span className="text-sm font-medium text-gray-200">{choice.label}</span>
          {choice.description && (
            <span className="block text-xs text-gray-500 mt-0.5">{choice.description}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================
// Text Input
// ============================================

function TextInput({ onSubmit }: { onSubmit: (value: string) => void }) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue('');
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Type your answer..."
        className="flex-1 px-4 py-3 rounded-xl bg-surface-tertiary border border-panel-border text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-vhs-800/40"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!value.trim()}
        className={cn(
          'p-3 rounded-xl transition-colors',
          value.trim()
            ? 'bg-vhs-400 text-white hover:bg-vhs-500'
            : 'bg-surface-tertiary text-gray-600'
        )}
      >
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ============================================
// Date Range Input
// ============================================

function DateRangeInput({ onSubmit }: { onSubmit: (dates: Record<string, string>) => void }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Start</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-tertiary border border-panel-border text-sm text-gray-200 focus:outline-none focus:border-vhs-800/40"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">End</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-tertiary border border-panel-border text-sm text-gray-200 focus:outline-none focus:border-vhs-800/40"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit({ startDate: '', endDate: '' })}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 border border-panel-border bg-surface-tertiary transition-colors"
        >
          Figure it out later
        </button>
        <button
          type="button"
          onClick={() => onSubmit({ startDate, endDate })}
          disabled={!startDate}
          className={cn(
            'flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
            startDate
              ? 'bg-vhs-400 text-white hover:bg-vhs-500'
              : 'bg-surface-tertiary text-gray-600'
          )}
        >
          Set dates
        </button>
      </div>
    </div>
  );
}

// ============================================
// File Upload Area
// ============================================

function FileUploadArea({
  onFile,
  isUploading,
  fileInputRef,
}: {
  onFile: (file: File) => void;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        'flex flex-col items-center gap-2 px-6 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
        isDragging
          ? 'border-vhs-400 bg-vhs-900/20'
          : 'border-panel-border bg-surface-tertiary hover:border-gray-600'
      )}
    >
      {isUploading ? (
        <Loader2 className="w-6 h-6 text-vhs-400 animate-spin" />
      ) : (
        <Upload className="w-6 h-6 text-gray-500" />
      )}
      <div className="text-center">
        <p className="text-sm text-gray-300">
          {isUploading ? 'Processing...' : 'Drop your spreadsheet here'}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          .xlsx, .xls, or .csv
        </p>
      </div>
    </div>
  );
}

// ============================================
// Cast Entry Input
// ============================================

function CastEntryInput({
  onSubmit,
  showDone,
}: {
  onSubmit: (entry: Record<string, unknown>) => void;
  showDone: boolean;
}) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), location: location.trim(), description: '' });
    setName('');
    setLocation('');
    setTimeout(() => nameRef.current?.focus(), 50);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Cast member name"
          className="flex-1 px-4 py-3 rounded-xl bg-surface-tertiary border border-panel-border text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-vhs-800/40"
        />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="City"
          className="w-32 sm:w-40 px-3 py-3 rounded-xl bg-surface-tertiary border border-panel-border text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-vhs-800/40"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim()}
          className={cn(
            'p-3 rounded-xl transition-colors',
            name.trim()
              ? 'bg-vhs-400 text-white hover:bg-vhs-500'
              : 'bg-surface-tertiary text-gray-600'
          )}
        >
          <UserPlus className="w-4 h-4" />
        </button>
      </div>
      {showDone && (
        <button
          type="button"
          onClick={() => onSubmit({ done: true })}
          className="w-full px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 border border-panel-border bg-surface-tertiary transition-colors"
        >
          That&apos;s everyone
        </button>
      )}
    </div>
  );
}

// ============================================
// Crew Entry Input
// ============================================

function CrewEntryInput({
  onSubmit,
  showSkip,
}: {
  onSubmit: (entry: Record<string, unknown>) => void;
  showSkip: boolean;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<CrewRole>('ac');
  const [email, setEmail] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      role,
      contactEmail: email.trim(),
      contactPhone: '',
    });
    setName('');
    setEmail('');
    setRole('ac');
    setTimeout(() => nameRef.current?.focus(), 50);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Name"
          className="flex-1 px-3 py-3 rounded-xl bg-surface-tertiary border border-panel-border text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-vhs-800/40"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as CrewRole)}
          className="w-28 sm:w-36 px-2 py-3 rounded-xl bg-surface-tertiary border border-panel-border text-sm text-gray-200 focus:outline-none focus:border-vhs-800/40"
        >
          {CREW_ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim()}
          className={cn(
            'p-3 rounded-xl transition-colors',
            name.trim()
              ? 'bg-vhs-400 text-white hover:bg-vhs-500'
              : 'bg-surface-tertiary text-gray-600'
          )}
        >
          <UserPlus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Email (optional)"
          className="flex-1 px-3 py-2.5 rounded-xl bg-surface-tertiary border border-panel-border text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-vhs-800/40"
        />
      </div>
      {showSkip && (
        <button
          type="button"
          onClick={() => onSubmit({ skip: true })}
          className="w-full px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 border border-panel-border bg-surface-tertiary transition-colors"
        >
          {name ? "That's the team" : 'Skip crew for now'}
        </button>
      )}
    </div>
  );
}
