'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface LexiDrawerProps {
  open: boolean;
  onClose: () => void;
  productionId?: string;
}

export function LexiDrawer({ open, onClose, productionId }: LexiDrawerProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  async function handleSend() {
    if (!message.trim()) return;
    const userMsg = message.trim();
    setMessage('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);

    // TODO: Call Lexi API with production context
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', text: 'Lexi is thinking...' },
    ]);
  }

  if (!open) return null;

  return (
    <div className="lexi-drawer">
      <div className="lexi-drawer-header">
        <div className="lexi-drawer-title">
          <span className="lexi-drawer-avatar">L</span>
          <span>Lexi</span>
        </div>
        <button className="lexi-drawer-close" onClick={onClose}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="lexi-drawer-messages">
        {messages.length === 0 && (
          <div className="lexi-drawer-empty">
            <p>Ask me anything about the production.</p>
            <p className="lexi-drawer-hint">
              Try: &quot;Who hasn&apos;t signed their contract?&quot; or &quot;What&apos;s shooting this week?&quot;
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`lexi-msg lexi-msg--${msg.role}`}>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="lexi-drawer-input">
        <textarea
          ref={inputRef}
          className="lexi-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask Lexi..."
          rows={1}
        />
        <button
          className="lexi-send-btn"
          onClick={handleSend}
          disabled={!message.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
