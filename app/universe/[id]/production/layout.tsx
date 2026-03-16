'use client';

/**
 * Production Layout — Shared wrapper for all production views
 *
 * Provides:
 * - ProductionProvider context (single fetch, shared by all child routes)
 * - Header with back link to universe + production name
 * - Tab navigation (Dashboard | Calendar | Cast | Crew)
 * - Lexi chat shortcut
 */

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { ProductionNav } from '@/components/production/production-nav';
import { ProductionProvider, useProduction } from '@/components/production/production-context';

function ProductionHeader({ universeId }: { universeId: string }) {
  const { production } = useProduction();

  return (
    <header className="border-b border-panel-border bg-surface-secondary">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/universe/${universeId}`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Universe
          </Link>
          <span className="text-gray-600">/</span>
          <h1 className="text-sm font-medium text-gray-200">
            {production?.name || 'Production'}
            {production?.season && (
              <span className="ml-2 text-gray-500">
                {production.season}
              </span>
            )}
          </h1>
        </div>

        <Link
          href={`/universe/${universeId}/chat?mode=production${production ? `&productionId=${production.id}` : ''}`}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-vhs-400 border border-vhs-400/30 rounded-md hover:bg-vhs-400/10 transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Ask Lexi
        </Link>
      </div>

      <ProductionNav universeId={universeId} />
    </header>
  );
}

export default function ProductionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const universeId = params.id as string;

  return (
    <ProductionProvider universeId={universeId}>
      <div className="min-h-screen bg-surface-primary text-gray-100">
        <ProductionHeader universeId={universeId} />
        <main className="p-6 max-w-7xl mx-auto">{children}</main>
      </div>
    </ProductionProvider>
  );
}
