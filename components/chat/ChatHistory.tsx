'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Trash2, Plus } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt: Date;
  messageCount: number;
}

interface ChatHistoryProps {
  universeId: string;
  activeConversationId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}

/**
 * List of past conversations
 * - Sorted by most recent
 * - Shows title and date
 * - Delete option on hover
 *
 * Features:
 * - Auto-fetch on mount
 * - Optimistic updates for delete
 * - Loading and empty states
 * - VHS orange for active conversation
 *
 * @example
 * <ChatHistory
 *   universeId="universe-123"
 *   activeConversationId="conv-456"
 *   onSelect={(id) => router.push(`/chat/${id}`)}
 *   onNew={() => router.push('/chat/new')}
 * />
 */
export function ChatHistory({
  universeId,
  activeConversationId,
  onSelect,
  onNew,
}: ChatHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, [universeId]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/chat/conversations?universeId=${universeId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Delete this conversation?')) return;

    try {
      setDeletingId(id);
      const response = await fetch(`/api/chat/conversations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      // Optimistic update
      setConversations((prev) => prev.filter((conv) => conv.id !== id));
    } catch (err) {
      console.error('Error deleting conversation:', err);
      alert('Failed to delete conversation');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vhs"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-400">
        {error}
        <button
          onClick={fetchConversations}
          className="ml-2 underline hover:text-red-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-3 border-b border-sidebar-border">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-vhs hover:bg-vhs-500 text-white rounded-md transition-colors font-medium text-sm shadow-vhs-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <MessageSquare className="w-12 h-12 text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">
              No conversations yet
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Start a new chat to begin
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const isHovered = conv.id === hoveredId;
              const isDeleting = conv.id === deletingId;

              return (
                <div
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  onMouseEnter={() => setHoveredId(conv.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`
                    group relative px-3 py-2.5 rounded-md cursor-pointer
                    transition-all duration-150
                    ${
                      isActive
                        ? 'bg-sidebar-active text-white border-l-2 border-vhs'
                        : 'hover:bg-sidebar-hover text-gray-300 border-l-2 border-transparent'
                    }
                    ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
                  `}
                  role="button"
                  tabIndex={0}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
                        <h3
                          className={`text-sm font-medium truncate ${
                            isActive ? 'text-white' : 'text-gray-200'
                          }`}
                        >
                          {conv.title}
                        </h3>
                      </div>
                      {conv.lastMessage && (
                        <p className="text-xs text-gray-500 truncate pl-5">
                          {conv.lastMessage}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 pl-5">
                        <span className="text-xs text-gray-600">
                          {formatDate(conv.updatedAt)}
                        </span>
                        <span className="text-xs text-gray-600">
                          {conv.messageCount} msg{conv.messageCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Delete button - shows on hover */}
                    {isHovered && (
                      <button
                        onClick={(e) => handleDelete(conv.id, e)}
                        className="p-1.5 hover:bg-red-500/20 rounded transition-colors flex-shrink-0"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
