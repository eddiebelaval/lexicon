'use client';

import { useState } from 'react';
import type { Message, Citation } from '@/types/chat';
import { ChatThread } from './ChatThread';
import { ChatInput } from './ChatInput';
import { CitationDetail } from './CitationDetail';

interface ChatContainerProps {
  conversationId?: string;
  universeId: string;
  initialMessages?: Message[];
  onSendMessage?: (message: string) => Promise<void>;
}

/**
 * Complete chat interface container
 * - Manages chat state (messages, streaming)
 * - Handles message sending and streaming
 * - Citation detail sidebar/modal
 *
 * This is a complete example showing how to compose the chat components.
 * In production, you'd integrate with your actual API.
 *
 * Usage:
 * <ChatContainer
 *   universeId="universe-123"
 *   conversationId="conv-456"
 *   initialMessages={messages}
 *   onSendMessage={async (msg) => await sendToAPI(msg)}
 * />
 */
export function ChatContainer({
  conversationId,
  universeId,
  initialMessages = [],
  onSendMessage,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  const handleSendMessage = async (content: string) => {
    // Add user message immediately
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: conversationId || 'temp',
      role: 'user',
      content,
      citations: [],
      toolCalls: [],
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    setStreamingContent('');

    try {
      if (onSendMessage) {
        // Use custom handler if provided
        await onSendMessage(content);
      } else {
        // Default implementation: call your API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            universeId,
            message: content,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let accumulatedContent = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === 'text') {
                    accumulatedContent += data.data.content;
                    setStreamingContent(accumulatedContent);
                  } else if (data.type === 'done') {
                    // Add complete message
                    setMessages((prev) => [...prev, data.data.message]);
                    setIsStreaming(false);
                    setStreamingContent('');
                  } else if (data.type === 'error') {
                    console.error('Stream error:', data.data);
                    setIsStreaming(false);
                  }
                } catch (e) {
                  console.error('Failed to parse stream data:', e);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const handleCitationClick = (citation: Citation) => {
    setSelectedCitation(citation);
  };

  return (
    <div className="flex flex-col h-full bg-surface-primary">
      {/* Chat thread */}
      <div className="flex-1 overflow-hidden">
        <ChatThread
          messages={messages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          onCitationClick={handleCitationClick}
        />
      </div>

      {/* Citation detail overlay */}
      {selectedCitation && (
        <div className="absolute top-0 right-0 h-full w-96 bg-surface-primary border-l border-panel-border overflow-y-auto p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Citation Details</h3>
            <button
              onClick={() => setSelectedCitation(null)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close citation details"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <CitationDetail
            citation={selectedCitation}
            onClose={() => setSelectedCitation(null)}
          />
        </div>
      )}

      {/* Chat input */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={isStreaming}
        placeholder="Ask about your universe..."
      />
    </div>
  );
}
