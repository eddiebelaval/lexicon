'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCog,
  Camera,
  Film,
  ClipboardList,
  MessageSquare,
  Tv,
  BookOpen,
  GitBranch,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: string;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/production' },
      { icon: Calendar, label: 'Calendar', href: '/production/calendar' },
      { icon: Users, label: 'Cast', href: '/production/cast' },
      { icon: UserCog, label: 'Crew', href: '/production/crew' },
      { icon: Camera, label: 'Gear', href: '/production/gear' },
      { icon: Film, label: 'Post', href: '/production/post' },
      { icon: ClipboardList, label: 'Call Sheet', href: '/production/call-sheet' },
      { icon: MessageSquare, label: 'Team', href: '/production/team' },
      { icon: Tv, label: 'Episodes', href: '/production/episodes' },
    ],
  },
  {
    label: 'Explore',
    items: [
      { icon: BookOpen, label: 'Knowledge', href: '/production/knowledge' },
      { icon: GitBranch, label: 'Graph', href: '/production/graph' },
    ],
  },
  {
    label: null,
    items: [
      { icon: Settings, label: 'Settings', href: '/production/settings' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(href: string): boolean {
    if (href === '/production') return pathname === '/production';
    return pathname.startsWith(href);
  }

  return (
    <aside
      className="sidebar"
      style={{ width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)' }}
    >
      {/* Header */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-show-info">
            <div className="sidebar-show-name">Diaries</div>
            <div className="sidebar-show-season">Season 8</div>
          </div>
        )}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="sidebar-group">
            {group.label && !collapsed && (
              <div className="sidebar-group-label">{group.label}</div>
            )}
            {gi > 0 && <div className="sidebar-divider" />}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-item ${active ? 'sidebar-item--active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="sidebar-item-icon" />
                  {!collapsed && (
                    <>
                      <span className="sidebar-item-label">{item.label}</span>
                      {item.badge && (
                        <span className="sidebar-item-badge">{item.badge}</span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-lexi-status">
            <span className="sidebar-lexi-dot" />
            <span className="sidebar-lexi-label">Lexi Online</span>
          </div>
        )}
      </div>
    </aside>
  );
}
