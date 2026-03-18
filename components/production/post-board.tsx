'use client';

/**
 * Post-Production Board — Footage pipeline visibility
 *
 * Shows all footage assets with rich metadata:
 * scene, cast member, camera/card, AC notes, shot date.
 * Timeline view per cast member. Transition history per asset.
 * Filterable by cast member and pipeline stage.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Film, Clock, User, MapPin, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FootageEntry {
  id: string;
  name: string;
  currentStage: string;
  stageColor: string;
  owner: string;
  castMember: string;
  sceneTitle: string;
  camera: string;
  card: string;
  acNotes: string;
  location: string;
  shotDate: string;
  hoursInStage: number;
  createdAt: string;
  transitions: Array<{
    fromStage: string | null;
    toStage: string;
    by: string | null;
    reason: string | null;
    at: string;
  }>;
}

interface PostBoardProps {
  productionId: string;
}

function formatRelativeHours(hours: number): string {
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function PostBoard({ productionId }: PostBoardProps) {
  const [footage, setFootage] = useState<FootageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCast, setFilterCast] = useState<string>('');
  const [filterStage, setFilterStage] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchFootage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ productionId });
      const res = await fetch(`/api/footage-timeline?${params}`);
      if (!res.ok) throw new Error('Failed to fetch footage');
      const data = await res.json() as { data: FootageEntry[] };
      setFootage(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [productionId]);

  useEffect(() => {
    fetchFootage();
  }, [fetchFootage]);

  // Derived data
  const castMembers = useMemo(() => {
    const set = new Set<string>();
    for (const f of footage) {
      if (f.castMember) set.add(f.castMember);
    }
    return [...set].sort();
  }, [footage]);

  const stages = useMemo(() => {
    const set = new Set<string>();
    for (const f of footage) {
      set.add(f.currentStage);
    }
    return [...set];
  }, [footage]);

  const filtered = useMemo(() => {
    return footage.filter((f) => {
      if (filterCast && f.castMember !== filterCast) return false;
      if (filterStage && f.currentStage !== filterStage) return false;
      return true;
    });
  }, [footage, filterCast, filterStage]);

  // Pipeline summary counts
  const stageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of footage) {
      counts.set(f.currentStage, (counts.get(f.currentStage) || 0) + 1);
    }
    return counts;
  }, [footage]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-gray-500">Loading post-production board...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 text-sm">{error}</p>
        <button type="button" onClick={fetchFootage} className="mt-3 text-sm text-vhs-400 hover:text-vhs-300">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pipeline summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-gray-300">{footage.length} footage assets</span>
        <div className="flex items-center gap-2">
          {[...stageCounts.entries()].map(([stage, count]) => (
            <button
              key={stage}
              type="button"
              onClick={() => setFilterStage(filterStage === stage ? '' : stage)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                filterStage === stage
                  ? 'bg-vhs-900/50 border-vhs-400/30 text-vhs-400'
                  : 'bg-surface-secondary border-panel-border text-gray-400 hover:text-gray-200'
              )}
            >
              {stage} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-3.5 h-3.5 text-gray-500" />
        <select
          value={filterCast}
          onChange={(e) => setFilterCast(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-surface-tertiary border border-panel-border text-xs text-gray-300 focus:outline-none focus:border-vhs-800/40"
        >
          <option value="">All cast</option>
          {castMembers.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {(filterCast || filterStage) && (
          <button
            type="button"
            onClick={() => { setFilterCast(''); setFilterStage(''); }}
            className="text-xs text-gray-500 hover:text-gray-300"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Footage list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-panel-border rounded-xl">
          <Film className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {footage.length === 0
              ? 'No footage tracked yet. Tell Lexi to log footage via Telegram.'
              : 'No footage matches the current filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((f) => {
            const isExpanded = expandedIds.has(f.id);

            return (
              <div
                key={f.id}
                className="rounded-lg border border-panel-border bg-surface-secondary overflow-hidden"
              >
                {/* Main row */}
                <button
                  type="button"
                  onClick={() => toggleExpand(f.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-tertiary/50 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  )}

                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: f.stageColor }}
                  />

                  <span className="text-sm font-medium text-gray-200 flex-1 truncate">
                    {f.name}
                  </span>

                  <span className="text-xs text-gray-500 shrink-0">
                    {f.currentStage}
                  </span>

                  {f.castMember && (
                    <span className="text-xs text-gray-500 shrink-0 hidden sm:block">
                      {f.castMember}
                    </span>
                  )}

                  <span className="text-xs text-gray-600 shrink-0">
                    {formatRelativeHours(f.hoursInStage)}
                  </span>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-panel-border space-y-3">
                    {/* Metadata grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {f.castMember && (
                        <div>
                          <span className="text-gray-600">Cast</span>
                          <p className="text-gray-300">{f.castMember}</p>
                        </div>
                      )}
                      {f.sceneTitle && (
                        <div>
                          <span className="text-gray-600">Scene</span>
                          <p className="text-gray-300">{f.sceneTitle}</p>
                        </div>
                      )}
                      {f.shotDate && (
                        <div>
                          <span className="text-gray-600">Shot Date</span>
                          <p className="text-gray-300">{f.shotDate}</p>
                        </div>
                      )}
                      {f.camera && (
                        <div>
                          <span className="text-gray-600">Camera</span>
                          <p className="text-gray-300">{f.camera}</p>
                        </div>
                      )}
                      {f.card && (
                        <div>
                          <span className="text-gray-600">Card</span>
                          <p className="text-gray-300">{f.card}</p>
                        </div>
                      )}
                      {f.location && (
                        <div>
                          <span className="text-gray-600">Location</span>
                          <p className="text-gray-300">{f.location}</p>
                        </div>
                      )}
                      {f.owner && (
                        <div>
                          <span className="text-gray-600">Current Owner</span>
                          <p className="text-gray-300">{f.owner}</p>
                        </div>
                      )}
                    </div>

                    {/* AC Notes */}
                    {f.acNotes && (
                      <div className="text-xs">
                        <span className="text-gray-600">AC Notes</span>
                        <p className="text-gray-400 mt-0.5">{f.acNotes}</p>
                      </div>
                    )}

                    {/* Transition history */}
                    {f.transitions.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-600">History</span>
                        <div className="mt-1 space-y-1">
                          {f.transitions.map((t, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-600 shrink-0" />
                              <span>
                                {t.fromStage ? `${t.fromStage} → ` : ''}{t.toStage}
                              </span>
                              {t.by && <span className="text-gray-600">by {t.by}</span>}
                              <span className="text-gray-700 ml-auto">
                                {new Date(t.at).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
