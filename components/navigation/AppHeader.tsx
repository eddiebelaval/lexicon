'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Home, LayoutDashboard, MessageSquare, Network, Settings } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { useViewerContext } from '@/lib/hooks/use-viewer-context';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  universeId?: string;
  showSearch?: boolean;
  searchComponent?: React.ReactNode;
  rightActions?: React.ReactNode;
}

/**
 * Shared navigation header for all pages
 *
 * Provides consistent navigation across:
 * - Home (/)
 * - Dashboard (/dashboard)
 * - Universe Graph (/universe/[id])
 * - Universe Chat (/universe/[id]/chat)
 */
export function AppHeader({
  universeId,
  showSearch = false,
  searchComponent,
  rightActions
}: AppHeaderProps) {
  const pathname = usePathname();
  const { userId, loading } = useViewerContext();

  // Determine active page
  const isHome = pathname === '/';
  const isDashboard = pathname === '/dashboard';
  const isUniverse = Boolean(universeId && pathname === `/universe/${universeId}`);
  const isChat = Boolean(universeId && pathname === `/universe/${universeId}/chat`);

  return (
    <header
      className="border-b border-[#1a1a1a] sticky top-0 z-50"
      style={{
        backgroundColor: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-full px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <BookOpen className="w-5 h-5 text-[#38bdf8] group-hover:text-[#5ccfff] transition-colors" />
            <span className="text-lg font-semibold text-white">Lexicon</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            <NavLink href="/" active={isHome} icon={<Home className="w-4 h-4" />}>
              Home
            </NavLink>
            <NavLink href="/dashboard" active={isDashboard} icon={<LayoutDashboard className="w-4 h-4" />}>
              Dashboard
            </NavLink>
            {universeId && (
              <>
                <NavLink
                  href={`/universe/${universeId}`}
                  active={isUniverse}
                  icon={<Network className="w-4 h-4" />}
                >
                  Graph
                </NavLink>
                <NavLink
                  href={`/universe/${universeId}/chat`}
                  active={isChat}
                  icon={<MessageSquare className="w-4 h-4" />}
                >
                  Chat
                </NavLink>
              </>
            )}
          </nav>

          {/* Search Area (optional) */}
          {showSearch && searchComponent && (
            <div className="flex-1 max-w-2xl">
              {searchComponent}
            </div>
          )}

          {/* Spacer when no search */}
          {!showSearch && <div className="flex-1" />}

          {/* Right Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {rightActions}
            {userId ? (
              <>
                <NotificationBell userId={userId} />
                <Link
                  href="/settings/notifications"
                  className="p-2 hover:bg-[#1f1f1f] rounded-lg text-[#888] hover:text-white transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </Link>
              </>
            ) : !loading ? (
              <span className="px-2.5 py-1 rounded-full border border-[#2a2a2a] text-xs text-[#777]">
                Public Beta
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

interface NavLinkProps {
  href: string;
  active?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function NavLink({ href, active, icon, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
        active
          ? "bg-[#38bdf8]/20 text-[#38bdf8]"
          : "text-[#888] hover:text-white hover:bg-[#1f1f1f]"
      )}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

/**
 * Mobile navigation drawer for smaller screens
 */
export function MobileNav({ universeId }: { universeId?: string }) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#1a1a1a] px-2 py-2 z-50">
      <div className="flex items-center justify-around">
        <MobileNavLink
          href="/"
          active={pathname === '/'}
          icon={<Home className="w-5 h-5" />}
          label="Home"
        />
        <MobileNavLink
          href="/dashboard"
          active={pathname === '/dashboard'}
          icon={<LayoutDashboard className="w-5 h-5" />}
          label="Dashboard"
        />
        {universeId && (
          <>
            <MobileNavLink
              href={`/universe/${universeId}`}
              active={pathname === `/universe/${universeId}`}
              icon={<Network className="w-5 h-5" />}
              label="Graph"
            />
            <MobileNavLink
              href={`/universe/${universeId}/chat`}
              active={pathname === `/universe/${universeId}/chat`}
              icon={<MessageSquare className="w-5 h-5" />}
              label="Chat"
            />
          </>
        )}
      </div>
    </nav>
  );
}

interface MobileNavLinkProps {
  href: string;
  active?: boolean;
  icon: React.ReactNode;
  label: string;
}

function MobileNavLink({ href, active, icon, label }: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
        active
          ? "text-[#38bdf8]"
          : "text-[#666] hover:text-white"
      )}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Link>
  );
}
