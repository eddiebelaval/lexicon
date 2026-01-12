'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

interface NotificationBellProps {
  userId: string;
  className?: string;
}

/**
 * Notification Bell with Dropdown
 *
 * Features:
 * - Unread count badge
 * - Dropdown with recent notifications
 * - Mark as read / dismiss actions
 * - Click to navigate to action URL
 */
export function NotificationBell({ userId, className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        const res = await fetch(`/api/notifications/count?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    }

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // Every minute
    return () => clearInterval(interval);
  }, [userId]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    async function fetchNotifications() {
      setLoading(true);
      try {
        const res = await fetch(`/api/notifications?userId=${userId}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    }

    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, userId]);

  async function markAsRead(notificationId: string) {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, readAt: new Date() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  async function dismiss(notificationId: string) {
    try {
      await fetch(`/api/notifications/${notificationId}/dismiss`, { method: 'POST' });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  }

  async function markAllRead() {
    try {
      await fetch(`/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.readAt) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  }

  const typeStyles: Record<string, string> = {
    digest_ready: 'border-l-green-500',
    cast_news: 'border-l-blue-500',
    storyline_update: 'border-l-yellow-500',
    system: 'border-l-gray-500',
    enrichment_complete: 'border-l-purple-500',
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          'text-[#999] hover:text-white hover:bg-[#1a1a1a]',
          isOpen && 'bg-[#1a1a1a] text-white'
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 flex items-center justify-center',
              'min-w-[18px] h-[18px] px-1 rounded-full',
              'bg-red-500 text-white text-xs font-medium'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 z-50',
            'w-80 max-h-96 overflow-hidden',
            'bg-[#141414] border border-[#252525] rounded-xl shadow-xl'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#252525]">
            <h3 className="text-sm font-medium text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#38bdf8] hover:text-[#5ccfff] transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-72">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[#666]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-[#666] text-sm">
                No notifications yet
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={cn(
                      'relative px-4 py-3 border-b border-[#1f1f1f] last:border-b-0',
                      'hover:bg-[#1a1a1a] transition-colors cursor-pointer',
                      'border-l-2',
                      typeStyles[notification.type] || 'border-l-gray-500',
                      !notification.readAt && 'bg-[#1a1a1a]/50'
                    )}
                  >
                    <div
                      onClick={() => handleNotificationClick(notification)}
                      className="pr-8"
                    >
                      <div className="flex items-start justify-between">
                        <p
                          className={cn(
                            'text-sm font-medium',
                            notification.readAt ? 'text-[#999]' : 'text-white'
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.readAt && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-[#666] mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-[#555]">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                        {notification.actionUrl && (
                          <ExternalLink className="w-3 h-3 text-[#555]" />
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="absolute right-2 top-3 flex gap-1">
                      {!notification.readAt && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="p-1 rounded hover:bg-[#252525] text-[#666] hover:text-green-500 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismiss(notification.id);
                        }}
                        className="p-1 rounded hover:bg-[#252525] text-[#666] hover:text-red-500 transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-[#252525] bg-[#0f0f0f]">
              <a
                href="/settings/notifications"
                className="text-xs text-[#666] hover:text-[#999] transition-colors"
              >
                Notification settings
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString();
}

export default NotificationBell;
