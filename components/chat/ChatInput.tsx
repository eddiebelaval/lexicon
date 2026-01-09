'use client';

import { useState, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Chat input with send button
 * - Textarea that auto-expands (max 5 lines)
 * - Send on Enter (Shift+Enter for newline)
 * - Disabled state while streaming
 * - VHS orange accent on focus
 *
 * Usage:
 * <ChatInput
 *   onSend={(message) => handleSendMessage(message)}
 *   disabled={isStreaming}
 *   placeholder="Ask about your universe..."
 * />
 */
export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Ask a question...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleSend = () => {
    if (!value.trim() || disabled) return;

    onSend(value.trim());
    setValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-panel-border bg-surface-secondary px-4 py-4">
      <div className="max-w-4xl mx-auto flex gap-3 items-end">
        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`
              w-full resize-none rounded-lg px-4 py-3 pr-12
              bg-surface-primary text-white placeholder-gray-500
              border border-panel-border
              focus:outline-none focus:ring-2 focus:ring-vhs/50 focus:border-vhs
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              max-h-[120px] overflow-y-auto
            `}
            aria-label="Chat message input"
          />

          {/* Character count (optional, shown when approaching limit) */}
          {value.length > 1500 && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-500 pointer-events-none">
              {value.length}/2000
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className={`
            flex-shrink-0 w-12 h-12 rounded-lg
            flex items-center justify-center
            bg-vhs text-white
            hover:bg-vhs-500 hover:shadow-vhs-sm
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-vhs/50
          `}
          aria-label="Send message"
        >
          {disabled ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Hint text */}
      <div className="max-w-4xl mx-auto mt-2 text-xs text-gray-500 px-1">
        Press <kbd className="px-1.5 py-0.5 rounded bg-surface-primary border border-panel-border font-mono">Enter</kbd> to send,{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-surface-primary border border-panel-border font-mono">Shift+Enter</kbd> for new line
      </div>
    </div>
  );
}
