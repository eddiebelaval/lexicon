'use client';

import { useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { CastCard } from './cast-card';
import { CastBoard } from './cast-board';
import type { CastContract } from '@/types';

interface CastCardGridProps {
  contracts: CastContract[];
  loading?: boolean;
  onSelect?: (contract: CastContract) => void;
}

export function CastCardGrid({ contracts, loading, onSelect }: CastCardGridProps) {
  const [view, setView] = useState<'grid' | 'table'>('grid');

  return (
    <div>
      {/* View toggle */}
      <div className="cast-view-toggle">
        <button
          className={`cast-view-btn ${view === 'grid' ? 'cast-view-btn--active' : ''}`}
          onClick={() => setView('grid')}
          title="Card view"
          type="button"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          className={`cast-view-btn ${view === 'table' ? 'cast-view-btn--active' : ''}`}
          onClick={() => setView('table')}
          title="Table view"
          type="button"
        >
          <List className="h-4 w-4" />
        </button>
      </div>

      {view === 'grid' ? (
        <div className="cast-card-grid">
          {contracts.map((contract) => (
            <CastCard
              key={contract.id}
              contract={contract}
              onSelect={onSelect}
            />
          ))}
          {contracts.length === 0 && !loading && (
            <div className="cast-empty">
              No cast members yet. Import your master spreadsheet to get started.
            </div>
          )}
        </div>
      ) : (
        <CastBoard />
      )}
    </div>
  );
}
