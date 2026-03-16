'use client';

/**
 * Production Navigation — Tab bar for production views
 *
 * Renders at the top of the production layout with tabs:
 * Dashboard | Calendar | Cast | Crew
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Users, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductionNavProps {
  universeId: string;
}

const tabs = [
  { label: 'Dashboard', href: '', icon: LayoutDashboard },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Cast', href: '/cast', icon: Users },
  { label: 'Crew', href: '/crew', icon: UserCog },
] as const;

export function ProductionNav({ universeId }: ProductionNavProps) {
  const pathname = usePathname();
  const basePath = `/universe/${universeId}/production`;

  return (
    <nav className="flex items-center gap-1 px-4">
      {tabs.map((tab) => {
        const href = `${basePath}${tab.href}`;
        const isActive =
          tab.href === ''
            ? pathname === basePath || pathname === `${basePath}/`
            : pathname.startsWith(href);

        return (
          <Link
            key={tab.label}
            href={href}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
              isActive
                ? 'text-vhs-400 border-vhs-400'
                : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-600'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
