'use client';

import { useState } from 'react';
import type { Message, Citation } from '@/types/chat';
import { CitationChip } from './CitationChip';
import { ChevronDown, ChevronUp, User, Sparkles, Wrench } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  onCitationClick?: (citation: Citation) => void;
}

/**
 * Chat message bubble
 * - User messages: right-aligned, simpler styling
 * - Assistant messages: left-aligned, with citations and tool calls
 * - Supports inline citations with clickable chips
 * - Collapsible tool call section
 *
 * Usage:
 * <ChatMessage
 *   message={message}
 *   onCitationClick={(citation) => showCitationDetails(citation)}
 * />
 */
export function ChatMessage({ message, onCitationClick }: ChatMessageProps) {
  const [showToolCalls, setShowToolCalls] = useState(false);
  const isUser = message.role === 'user';

  // Parse content and inject citation chips
  const renderContentWithCitations = () => {
    if (!message.citations || message.citations.length === 0) {
      return <p className="whitespace-pre-wrap">{message.content}</p>;
    }

    // Simple implementation: show content with citation chips at the end
    // For production, you'd want to parse citation markers in the content
    const citations = Array.isArray(message.citations) ? message.citations : [];

    return (
      <div>
        <p className="whitespace-pre-wrap">{message.content}</p>
        {citations.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {citations.map((citation, index) => (
              <CitationChip
                key={citation.id}
                citation={citation}
                index={index}
                onClick={onCitationClick}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex gap-3 mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-vhs/20 border border-vhs/40 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-vhs" />
        </div>
      )}

      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message bubble */}
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser
              ? 'bg-surface-elevated text-white border border-panel-border'
              : 'bg-surface-secondary text-white border border-vhs/20'
          }`}
        >
          {renderContentWithCitations()}
        </div>

        {/* Tool calls section (assistant only) */}
        {!isUser && Array.isArray(message.toolCalls) && message.toolCalls.length > 0 && (
          <div className="w-full">
            <button
              onClick={() => setShowToolCalls(!showToolCalls)}
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-vhs transition-colors"
            >
              <Wrench className="w-3 h-3" />
              <span>{message.toolCalls.length} tool call{message.toolCalls.length !== 1 ? 's' : ''}</span>
              {showToolCalls ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {showToolCalls && (
              <div className="mt-2 space-y-2 animate-slide-up">
                {message.toolCalls.map((toolCall) => (
                  <div
                    key={toolCall.id}
                    className="bg-surface-primary border border-panel-border rounded-md p-3 text-xs"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-vhs">{toolCall.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          toolCall.status === 'success'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                            : toolCall.status === 'error'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                        }`}
                      >
                        {toolCall.status}
                      </span>
                    </div>
                    <div className="text-gray-400 font-mono">
                      <div className="mb-1">Input:</div>
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(toolCall.input, null, 2)}
                      </pre>
                      {toolCall.result !== undefined && (
                        <div>
                          <div className="mt-2 mb-1">Result:</div>
                          <pre className="text-xs overflow-x-auto">
                            {typeof toolCall.result === 'string'
                              ? toolCall.result
                              : JSON.stringify(toolCall.result, null, 2)}
                          </pre>
                        </div>
                      )}
                      {toolCall.error && (
                        <div className="mt-2 text-red-400">{toolCall.error}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Citations list (assistant only) */}
        {!isUser && Array.isArray(message.citations) && message.citations.length > 0 && (
          <div className="w-full mt-1">
            <div className="text-xs text-gray-500">Sources:</div>
            <div className="mt-1 space-y-1">
              {message.citations.map((citation, index) => (
                <button
                  key={citation.id}
                  onClick={() => onCitationClick?.(citation)}
                  className="flex items-start gap-2 text-xs text-gray-400 hover:text-vhs transition-colors w-full text-left"
                >
                  <span className="flex-shrink-0 text-vhs font-mono">[{index + 1}]</span>
                  <span className="flex-1 line-clamp-1">{citation.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-gray-500 px-1">
          {new Date(message.createdAt).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      {/* Avatar (user) */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-elevated border border-panel-border flex items-center justify-center">
          <User className="w-4 h-4 text-gray-400" />
        </div>
      )}
    </div>
  );
}
