'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/shell';
import { ChatThread } from '@/components/chat/ChatThread';
import { ChatInput } from '@/components/chat/ChatInput';
import { useProduction } from '@/components/production/production-context';
import type { Message } from '@/types/chat';
import { MessageSquare, Trash2 } from 'lucide-react';

export default function ChatPage() {
  const { production, loading: prodLoading } = useProduction();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming || !production) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: conversationId || 'temp',
      role: 'user',
      content,
      citations: [],
      toolCalls: [],
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setStreamingContent('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          universeId: production.universeId,
          conversationId,
          message: content.trim(),
          mode: 'production',
          productionId: production.id,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let newConversationId = conversationId;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;

              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'text' && parsed.data?.content) {
                  assistantContent += parsed.data.content;
                  setStreamingContent(assistantContent);
                } else if (parsed.type === 'done' && parsed.data?.message) {
                  newConversationId = parsed.data.message.conversationId;
                  setConversationId(newConversationId);
                }
              } catch {
                // Skip malformed SSE lines
              }
            }
          }
        }
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        conversationId: newConversationId || 'temp',
        role: 'assistant',
        content: assistantContent,
        citations: [],
        toolCalls: [],
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;

      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        conversationId: conversationId || 'temp',
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        citations: [],
        toolCalls: [],
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortRef.current = null;
    }
  }, [production, conversationId, isStreaming]);

  const handleClearChat = () => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setConversationId(undefined);
    setIsStreaming(false);
    setStreamingContent('');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  if (prodLoading) {
    return (
      <div>
        <PageHeader title="Chat" description="Talk to Lexi about your production" />
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse" style={{ color: 'var(--text-tertiary)' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!production) {
    return (
      <div>
        <PageHeader title="Chat" description="Talk to Lexi about your production" />
        <div className="text-center py-20" style={{ color: 'var(--text-tertiary)' }}>
          <p>No production found. Create one to start chatting with Lexi.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      <PageHeader
        title="Chat"
        description={`Talk to Lexi about ${production.name}`}
        actions={
          messages.length > 0 ? (
            <button
              onClick={handleClearChat}
              className="page-header-lexi-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Trash2 size={14} />
              New Chat
            </button>
          ) : undefined
        }
      />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 && !isStreaming ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '40px 20px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--accent-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <MessageSquare size={24} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
                Ask Lexi anything about your production
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', maxWidth: '400px' }}>
                Schedule conflicts, cast status, crew availability, delivery deadlines, or anything else about {production.name}.
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', justifyContent: 'center' }}>
              {[
                'Who still needs to sign contracts?',
                'What shoots are coming up this week?',
                'Give me a status update',
              ].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => handleSendMessage(suggestion)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'border-color var(--dur-fast) var(--ease-out)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <ChatThread
              messages={messages}
              isStreaming={isStreaming}
              streamingContent={isStreaming ? streamingContent : undefined}
            />
          </div>
        )}

        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '12px 16px',
          background: 'var(--bg-card)',
        }}>
          <ChatInput
            onSend={handleSendMessage}
            disabled={isStreaming}
            placeholder={`Ask Lexi about ${production.name}...`}
          />
        </div>
      </div>
    </div>
  );
}
