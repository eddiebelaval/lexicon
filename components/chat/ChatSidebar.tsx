'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Folder, Compass, Settings, ChevronLeft, ChevronRight, Home, Network, LayoutDashboard } from 'lucide-react';
import { ChatHistory } from './ChatHistory';
import { ProjectsTree } from './ProjectsTree';
import { DiscoverPanel } from './DiscoverPanel';

interface ChatSidebarProps {
  universeId: string;
  activeConversationId?: string;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
}

type SidebarTab = 'history' | 'projects' | 'discover';

/**
 * Main sidebar with tabs for different views
 * - Chat History (default)
 * - Projects (Universe → Scripts → Scenes)
 * - Discover (Recent entities, saved searches)
 *
 * Features:
 * - Collapsible on mobile
 * - Tab-based navigation
 * - VHS orange accent colors
 * - Smooth transitions
 *
 * @example
 * <ChatSidebar
 *   universeId="universe-123"
 *   activeConversationId="conv-456"
 *   onConversationSelect={(id) => console.log(id)}
 *   onNewConversation={() => console.log('new')}
 * />
 */
export function ChatSidebar({
  universeId,
  activeConversationId,
  onConversationSelect,
  onNewConversation,
}: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('history');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tabs = [
    { id: 'history' as const, label: 'Chats', icon: MessageSquare },
    { id: 'projects' as const, label: 'Projects', icon: Folder },
    { id: 'discover' as const, label: 'Discover', icon: Compass },
  ];

  return (
    <aside
      className={`
        relative h-full bg-sidebar-bg border-r border-sidebar-border
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-80'}
        flex flex-col
      `}
      aria-label="Chat sidebar"
    >
      {/* Header with Logo and Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border bg-panel-header">
        {!isCollapsed && (
          <Link href="/" className="text-lg font-semibold text-white hover:text-vhs transition-colors">
            Lexicon
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-sidebar-hover rounded-md transition-colors text-gray-400 hover:text-white"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Quick Navigation Links */}
      {!isCollapsed && (
        <div className="flex items-center gap-1 px-3 py-2 border-b border-sidebar-border bg-panel-header">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-sidebar-hover rounded-md transition-colors"
            title="Home"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-sidebar-hover rounded-md transition-colors"
            title="Dashboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href={`/universe/${universeId}`}
            className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-sidebar-hover rounded-md transition-colors"
            title="Graph View"
          >
            <Network className="w-3.5 h-3.5" />
            <span>Graph</span>
          </Link>
        </div>
      )}

      {/* Tabs */}
      {!isCollapsed && (
        <div className="flex border-b border-sidebar-border bg-panel-header">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-3
                  text-sm font-medium transition-all duration-200
                  border-b-2 relative
                  ${
                    isActive
                      ? 'text-vhs border-vhs bg-sidebar-active'
                      : 'text-gray-400 border-transparent hover:text-white hover:bg-sidebar-hover'
                  }
                `}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Collapsed tab icons */}
      {isCollapsed && (
        <div className="flex flex-col gap-1 p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsCollapsed(false);
                }}
                className={`
                  p-3 rounded-md transition-all duration-200
                  ${
                    isActive
                      ? 'text-vhs bg-sidebar-active'
                      : 'text-gray-400 hover:text-white hover:bg-sidebar-hover'
                  }
                `}
                aria-label={tab.label}
                title={tab.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'history' && (
            <ChatHistory
              universeId={universeId}
              activeConversationId={activeConversationId}
              onSelect={onConversationSelect}
              onNew={onNewConversation}
            />
          )}
          {activeTab === 'projects' && (
            <ProjectsTree universeId={universeId} />
          )}
          {activeTab === 'discover' && (
            <DiscoverPanel
              universeId={universeId}
              onEntityClick={(id) => console.log('Entity clicked:', id)}
            />
          )}
        </div>
      )}

      {/* Footer - Settings */}
      {!isCollapsed && (
        <div className="border-t border-sidebar-border p-3">
          <button
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-sidebar-hover rounded-md transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      )}
    </aside>
  );
}
