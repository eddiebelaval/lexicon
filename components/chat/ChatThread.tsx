'use client';

import { useRef, useEffect } from 'react';
import type { Message, Citation } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { Sparkles } from 'lucide-react';

interface ChatThreadProps {
  messages: Message[];
  isStreaming?: boolean;
  streamingContent?: string;
  onCitationClick?: (citation: Citation) => void;
}

/**
 * Container for chat messages
 * - Auto-scrolls to bottom on new messages
 * - Shows streaming message in progress
 * - Handles empty state
 *
 * Usage:
 * <ChatThread
 *   messages={messages}
 *   isStreaming={isStreaming}
 *   streamingContent={currentStreamContent}
 *   onCitationClick={(citation) => showCitationDetails(citation)}
 * />
 */
export function ChatThread({
  messages,
  isStreaming = false,
  streamingContent = '',
  onCitationClick,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or streaming updates
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, streamingContent]);

  // Empty state
  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-vhs/20 border border-vhs/40 mb-4">
            <Sparkles className="w-8 h-8 text-vhs" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Start a conversation
          </h3>
          <p className="text-gray-400">
            Ask questions about your story universe. I can search your knowledge graph and the web to help you explore your world.
          </p>
          <div className="mt-6 space-y-2">
            <button className="block w-full text-left px-4 py-3 rounded-lg bg-surface-elevated border border-panel-border hover:border-vhs/40 hover:bg-surface-tertiary transition-all duration-200 text-sm text-gray-300">
              &quot;Tell me about the main characters&quot;
            </button>
            <button className="block w-full text-left px-4 py-3 rounded-lg bg-surface-elevated border border-panel-border hover:border-vhs/40 hover:bg-surface-tertiary transition-all duration-200 text-sm text-gray-300">
              &quot;What are the key locations in my story?&quot;
            </button>
            <button className="block w-full text-left px-4 py-3 rounded-lg bg-surface-elevated border border-panel-border hover:border-vhs/40 hover:bg-surface-tertiary transition-all duration-200 text-sm text-gray-300">
              &quot;Show me relationships between characters&quot;
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6"
    >
      <div className="max-w-4xl mx-auto">
        {/* Existing messages */}
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onCitationClick={onCitationClick}
          />
        ))}

        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <div className="flex gap-3 mb-6 justify-start">
            {/* Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-vhs/20 border border-vhs/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-vhs animate-pulse" />
            </div>

            <div className="flex flex-col gap-2 max-w-[80%] items-start">
              {/* Message bubble */}
              <div className="rounded-lg px-4 py-3 bg-surface-secondary text-white border border-vhs/20">
                <p className="whitespace-pre-wrap">{streamingContent}</p>
                {/* Typing indicator */}
                <span className="inline-flex items-center gap-1 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-vhs animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-vhs animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-vhs animate-pulse" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} className="h-px" />
      </div>
    </div>
  );
}
