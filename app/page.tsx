'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeroSearch } from '@/components/search/HeroSearch';
import { SuggestedQueries } from '@/components/search/SuggestedQueries';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { Network, Sparkles, BookOpen, ScrollText } from 'lucide-react';
import { useViewerContext } from '@/lib/hooks/use-viewer-context';

export default function HomePage() {
  const router = useRouter();
  const { userId, primaryUniverse, loading, source } = useViewerContext();

  const handleSearch = (query: string) => {
    if (!primaryUniverse) return;
    router.push(`/universe/${primaryUniverse.id}/chat?q=${encodeURIComponent(query)}`);
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* Minimal Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <BookOpen className="w-6 h-6 text-[#38bdf8] group-hover:text-[#5ccfff] transition-colors" />
          <span className="text-xl font-semibold text-white">Lexicon</span>
        </Link>
        <div className="flex items-center gap-3">
          {userId ? <NotificationBell userId={userId} /> : null}
          <Link
            href="/dashboard"
            className="
              px-4 py-2 rounded-xl
              text-sm font-medium text-[#999]
              bg-[#141414] hover:bg-[#1a1a1a]
              border border-[#252525] hover:border-[#333]
              transition-all duration-200
            "
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Hero Section - Search First */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
        {/* Headline */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-semibold text-white mb-4">
            What are you looking for?
          </h1>
          <p className="text-lg text-[#888] max-w-md mx-auto">
            {primaryUniverse
              ? `Search ${source === 'user' ? 'your' : 'the public'} universe like a wiki with AI-guided answers.`
              : 'Search unlocks once a universe is available in this beta environment.'}
          </p>
        </div>

        {/* Hero Search */}
        <div className="w-full">
          <HeroSearch
            onSearch={handleSearch}
            aiMode={true}
            disabled={!primaryUniverse}
            placeholder={
              primaryUniverse
                ? `Ask anything about ${primaryUniverse.name}...`
                : 'A public universe needs to be available before search can start...'
            }
          />
        </div>

        {/* Suggested Queries */}
        <div className="mt-8 w-full">
          <SuggestedQueries onSelect={handleSearch} disabled={!primaryUniverse} />
        </div>

        {!loading && primaryUniverse ? (
          <p className="mt-6 text-sm text-[#666]">
            Search opens in <span className="text-[#aaa]">{primaryUniverse.name}</span>.
          </p>
        ) : null}

        {!loading && !primaryUniverse ? (
          <p className="mt-6 text-sm text-[#666]">
            No public universe is available yet. Add one or sign in once auth wiring is live.
          </p>
        ) : null}
      </section>

      {/* Feature Cards - Compact */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-4">
          <FeatureCard
            icon={<Sparkles className="w-5 h-5" />}
            title="AI Search"
            description="Natural language queries with Claude-powered synthesis"
            accentColor="#38bdf8"
          />
          <FeatureCard
            icon={<Network className="w-5 h-5" />}
            title="Knowledge Graph"
            description="Entities and relationships visualized as an interactive network"
            accentColor="#8b5cf6"
          />
          <FeatureCard
            icon={<ScrollText className="w-5 h-5" />}
            title="Wiki View"
            description="Turn entities into readable reference pages with connected context"
            accentColor="#10b981"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 border-t border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#555]">Part of the ID8Labs Writer Ecosystem</p>
          <p className="text-xs text-[#555]">&copy; {new Date().getFullYear()} ID8Labs</p>
        </div>
      </footer>
    </main>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor: string;
}

function FeatureCard({ icon, title, description, accentColor }: FeatureCardProps) {
  return (
    <div
      className="
        group p-5 rounded-xl
        bg-[#111111] hover:bg-[#151515]
        border border-[#1f1f1f] hover:border-[#2a2a2a]
        transition-all duration-300
        hover:-translate-y-1
      "
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 border"
        style={{
          color: accentColor,
          backgroundColor: `${accentColor}15`,
          borderColor: `${accentColor}30`,
        }}
      >
        {icon}
      </div>
      <h3 className="text-base font-medium text-white mb-1">{title}</h3>
      <p className="text-sm text-[#777] leading-relaxed">{description}</p>
    </div>
  );
}
