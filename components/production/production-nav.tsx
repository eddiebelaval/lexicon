'use client';

/**
 * Production Navigation — Scrollable tab bar for production views
 *
 * Renders at the top of the production layout with tabs:
 * Dashboard | Calendar | Cast | Crew | Gear | Post | Call Sheet | Team
 *
 * Mobile: icon-only tabs in a horizontally scrollable container
 * Desktop (md+): icon + label
 * Active tab auto-scrolls into view.
 */

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Users, UserCog, FileText, Send, Camera, Film } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductionNavProps {
  universeId: string;
}

const tabs = [
  { label: 'Dashboard', href: '', icon: LayoutDashboard },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Cast', href: '/cast', icon: Users },
  { label: 'Crew', href: '/crew', icon: UserCog },
  { label: 'Gear', href: '/gear', icon: Camera },
  { label: 'Post', href: '/post', icon: Film },
  { label: 'Call Sheet', href: '/call-sheet', icon: FileText },
  { label: 'Team', href: '/team', icon: Send },
] as const;

export function ProductionNav({ universeId }: ProductionNavProps) {
  const pathname = usePathname();
  const basePath = `/universe/${universeId}/production`;
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [pathname]);

  return (
    <nav className="border-b border-panel-border">
      <div className="flex items-center overflow-x-auto scrollbar-hide -mb-px px-3 sm:px-4">
        {tabs.map((tab) => {
          const href = `${basePath}${tab.href}`;
          const isActive =
            tab.href === ''
              ? pathname === basePath || pathname === `${basePath}/`
              : pathname.startsWith(href);

          return (
            <Link
              key={tab.label}
              ref={isActive ? activeRef : undefined}
              href={href}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap',
                isActive
                  ? 'text-vhs-400 border-vhs-400'
                  : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-600'
              )}
            >
              <tab.icon className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
