'use client';

import { useState, useEffect } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatThread } from './ChatThread';
import { ChatInput } from './ChatInput';
import type { Message } from '@/types/chat';

interface ChatLayoutProps {
  universeId: string;
  initialQuery?: string;
}

/**
 * Main layout combining sidebar + chat area
 *
 * Features:
 * - State management for conversations and messages
 * - Streaming support for AI responses
 * - Connect to /api/chat for sending messages
 * - Mobile responsive with sidebar toggle
 *
 * Architecture:
 * - ChatSidebar: Navigation and history
 * - ChatThread: Message display with streaming
 * - ChatInput: Message composition with auto-focus
 *
 * @example
 * <ChatLayout universeId="universe-123" />
 */
export function ChatLayout({ universeId, initialQuery }: ChatLayoutProps) {
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [hasProcessedInitialQuery, setHasProcessedInitialQuery] = useState(false);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  // Handle initial query from URL
  useEffect(() => {
    if (initialQuery && !hasProcessedInitialQuery && !isLoading) {
      setHasProcessedInitialQuery(true);
      // Small delay to ensure component is mounted
      setTimeout(() => {
        handleSendMessage(initialQuery);
      }, 100);
    }
  }, [initialQuery, hasProcessedInitialQuery, isLoading]);

  const loadMessages = async (conversationId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/chat/conversations/${conversationId}`
      );

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      // API returns { success: true, data: { ...conversation, messages: [...] } }
      setMessages(data.data?.messages || data.conversation?.messages || data.messages || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(undefined);
    setMessages([]);
  };

  const handleConversationSelect = (conversationId: string) => {
    setActiveConversationId(conversationId);
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Create user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: activeConversationId || 'temp',
      role: 'user',
      content,
      citations: [],
      toolCalls: [],
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingContent('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          universeId,
          conversationId: activeConversationId,
          message: content,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                break;
              }

              try {
                const parsed = JSON.parse(data);

                // Handle text streaming events from the API
                // API sends: { type: 'text', data: { content: '...' } }
                if (parsed.type === 'text' && parsed.data?.content) {
                  assistantContent += parsed.data.content;
                  setStreamingContent(assistantContent);
                } else if (parsed.type === 'done' && parsed.data?.message) {
                  // Use the complete message from the server
                  setActiveConversationId(parsed.data.message.conversationId);
                } else if (parsed.type === 'error') {
                  console.error('Chat error:', parsed.data);
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }

      // Add complete assistant message
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        conversationId: activeConversationId || 'temp',
        role: 'assistant',
        content: assistantContent,
        citations: [],
        toolCalls: [],
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);

      // Add error message
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        conversationId: activeConversationId || 'temp',
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        citations: [],
        toolCalls: [],
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  return (
    <div className="flex h-screen bg-surface-primary">
      {/* Sidebar */}
      <ChatSidebar
        universeId={universeId}
        activeConversationId={activeConversationId}
        onConversationSelect={handleConversationSelect}
        onNewConversation={handleNewConversation}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto">
          <ChatThread
            messages={messages}
            isStreaming={isStreaming}
            streamingContent={isStreaming ? streamingContent : undefined}
          />
        </div>

        {/* Chat Input */}
        <div className="border-t border-panel-border bg-panel-bg">
          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading}
            placeholder="Ask about your universe..."
          />
        </div>
      </div>
    </div>
  );
}
