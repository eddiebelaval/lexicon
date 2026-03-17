'use client';

import Link from 'next/link';
import { BookOpen, Plus, Users, Link2, Globe2, MessageSquare, Network, Loader2 } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { DigestWidget } from '@/components/dashboard/digest-widget';
import { useViewerContext } from '@/lib/hooks/use-viewer-context';

/**
 * Dashboard - User's Universes
 *
 * Displays list of story universes the user has created.
 * Dark mode first, ID8Labs design language.
 */
export default function DashboardPage() {
  const { userId, universes, loading, isAuthenticated, source } = useViewerContext();

  const title = isAuthenticated ? 'Your Universes' : 'Public Universes';
  const subtitle = isAuthenticated
    ? 'Manage your story worlds and knowledge graphs'
    : 'Browse the universes available in this beta environment';
  const showCreate = isAuthenticated;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <BookOpen className="w-6 h-6 text-[#38bdf8] group-hover:text-[#5ccfff] transition-colors" />
            <span className="text-xl font-semibold text-white">Lexicon</span>
          </Link>
          <nav className="flex items-center gap-4">
            {userId ? <NotificationBell userId={userId} /> : null}
            <span className="text-sm text-[#666]">
              {isAuthenticated ? 'Dashboard' : 'Public Beta'}
            </span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Grid - Digest Widget + Stats */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Digest Widget - takes 1 column */}
          {userId ? (
            <DigestWidget userId={userId} />
          ) : (
            <div className="rounded-xl border border-[#252525] bg-[#141414] p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Private Beta Notes</h3>
              <p className="text-sm text-[#888] leading-relaxed">
                Digests, notifications, and per-user settings appear after sign-in is wired.
                The public beta surface is focused on universe access and Lexi production workflows.
              </p>
            </div>
          )}

          {/* Your Universes Section - takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white">{title}</h2>
                <p className="text-[#888] mt-1">{subtitle}</p>
              </div>
              {showCreate ? (
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#38bdf8] text-[#0a0a0a] font-medium text-sm hover:bg-[#5ccfff] hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all duration-200">
                  <Plus className="w-4 h-4" />
                  New Universe
                </button>
              ) : null}
            </div>

            {/* Universe Grid */}
            {loading ? (
              <div className="flex items-center justify-center min-h-[240px] rounded-xl border border-[#252525] bg-[#111111]">
                <Loader2 className="w-6 h-6 animate-spin text-[#666]" />
              </div>
            ) : universes.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {universes.map((universe) => (
                  <div
                    key={universe.id}
                    className="group bg-[#111111] hover:bg-[#151515] rounded-xl border border-[#1f1f1f] hover:border-[#2a2a2a] p-6 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-3 gap-3">
                      <h3 className="text-xl font-semibold text-white">
                        {universe.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full border border-[#2a2a2a] text-[11px] uppercase tracking-wide text-[#777]">
                        {universe.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <p className="text-sm text-[#777] mb-4 leading-relaxed">
                      {universe.description || 'No description yet.'}
                    </p>
                    <div className="flex gap-4 text-sm mb-4 flex-wrap">
                      <span className="flex items-center gap-1.5 text-[#8b5cf6]">
                        <Users className="w-3.5 h-3.5" />
                        {universe.entityCount} entities
                      </span>
                      <span className="flex items-center gap-1.5 text-[#10b981]">
                        <Link2 className="w-3.5 h-3.5" />
                        {universe.relationshipCount} links
                      </span>
                      <span className="flex items-center gap-1.5 text-[#f59e0b]">
                        <Globe2 className="w-3.5 h-3.5" />
                        {source === 'public' && !isAuthenticated ? 'beta access' : 'workspace'}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-[#1f1f1f]">
                      <Link
                        href={`/universe/${universe.id}/chat`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#38bdf8] text-[#0a0a0a] font-medium text-sm hover:bg-[#5ccfff] transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Chat
                      </Link>
                      <Link
                        href={`/universe/${universe.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1f1f1f] text-white font-medium text-sm hover:bg-[#2a2a2a] border border-[#333] transition-colors"
                      >
                        <Network className="w-4 h-4" />
                        Graph
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#0d0d0d] rounded-xl border border-dashed border-[#252525] p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
                <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-[#444]" />
                </div>
                <p className="text-[#888]">
                  {isAuthenticated
                    ? 'Create your first universe to start building.'
                    : 'No public universes are available in this beta environment yet.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
