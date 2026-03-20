'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/shell';
import { useProduction } from '@/components/production/production-context';
import {
  Tv,
  Plus,
  Loader2,
  Calendar,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';
import type { Episode, EpisodeStatus } from '@/types';

const statusConfig: Record<EpisodeStatus, { label: string; color: string; bg: string }> = {
  planned: { label: 'Planned', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.12)' },
  in_production: { label: 'In Production', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  in_post: { label: 'In Post', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  delivered: { label: 'Delivered', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  aired: { label: 'Aired', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)' },
};

const statusOrder: EpisodeStatus[] = ['planned', 'in_production', 'in_post', 'delivered', 'aired'];

export default function EpisodesPage() {
  const { production, loading: prodLoading } = useProduction();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchEpisodes = useCallback(async () => {
    if (!production) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/episodes?productionId=${production.id}`);
      const data = await res.json();
      if (data.success) {
        setEpisodes(data.data.items || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [production]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  const handleStatusChange = async (episodeId: string, newStatus: EpisodeStatus) => {
    try {
      const res = await fetch(`/api/episodes/${episodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setEpisodes(prev =>
          prev.map(ep => ep.id === episodeId ? { ...ep, status: newStatus } : ep)
        );
      }
    } catch {
      // Silently fail
    }
  };

  if (prodLoading) {
    return (
      <div>
        <PageHeader title="Episodes" description="Track episodes from production through delivery" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin" size={20} style={{ color: 'var(--text-tertiary)' }} />
        </div>
      </div>
    );
  }

  if (!production) {
    return (
      <div>
        <PageHeader title="Episodes" description="Track episodes from production through delivery" />
        <div className="text-center py-20" style={{ color: 'var(--text-tertiary)' }}>
          <p>No production found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Episodes"
        description={`${episodes.length} episodes tracked`}
        actions={
          <button
            onClick={() => setShowAddForm(true)}
            className="page-header-lexi-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} />
            Add Episode
          </button>
        }
      />

      <div style={{ padding: '0 24px 24px' }}>
        {/* Status pipeline */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '20px',
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          fontSize: '12px',
        }}>
          {statusOrder.map((s, i) => {
            const count = episodes.filter(ep => ep.status === s).length;
            const cfg = statusConfig[s];
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {i > 0 && <ChevronRight size={12} style={{ color: 'var(--text-muted)', margin: '0 2px' }} />}
                <div style={{
                  padding: '3px 8px',
                  borderRadius: '10px',
                  background: count > 0 ? cfg.bg : 'transparent',
                  color: count > 0 ? cfg.color : 'var(--text-muted)',
                  fontWeight: count > 0 ? 500 : 400,
                }}>
                  {cfg.label} ({count})
                </div>
              </div>
            );
          })}
        </div>

        {/* Add episode form */}
        {showAddForm && (
          <AddEpisodeForm
            productionId={production.id}
            nextNumber={(episodes.length > 0 ? Math.max(...episodes.map(e => e.episodeNumber)) : 0) + 1}
            onCreated={() => { fetchEpisodes(); setShowAddForm(false); }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin" size={20} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        ) : episodes.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            gap: '16px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--accent-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Tv size={24} style={{ color: 'var(--accent)' }} />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              No episodes yet. Click &ldquo;Add Episode&rdquo; to start tracking.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {episodes.map(ep => {
              const cfg = statusConfig[ep.status];
              const isExpanded = expandedId === ep.id;

              return (
                <div
                  key={ep.id}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Episode row */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : ep.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronDown
                      size={14}
                      style={{
                        color: 'var(--text-muted)',
                        transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                        transition: 'transform var(--dur-fast) var(--ease-out)',
                      }}
                    />

                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      color: 'var(--text-tertiary)',
                      minWidth: '36px',
                    }}>
                      E{String(ep.episodeNumber).padStart(2, '0')}
                    </span>

                    <span style={{
                      flex: 1,
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      fontWeight: 500,
                    }}>
                      {ep.title || `Episode ${ep.episodeNumber}`}
                    </span>

                    {ep.airDate && (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        color: 'var(--text-tertiary)',
                      }}>
                        <Calendar size={12} />
                        {new Date(ep.airDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}

                    {/* Status badge */}
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: '10px',
                      background: cfg.bg,
                      color: cfg.color,
                      fontSize: '11px',
                      fontWeight: 500,
                    }}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{
                      padding: '0 16px 16px 58px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}>
                      {ep.description && (
                        <p style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          marginTop: '12px',
                          marginBottom: '12px',
                          lineHeight: 1.5,
                        }}>
                          {ep.description}
                        </p>
                      )}

                      {/* Status changer */}
                      <div style={{ marginTop: '12px' }}>
                        <p style={{
                          fontSize: '11px',
                          color: 'var(--text-tertiary)',
                          marginBottom: '8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          Update Status
                        </p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {statusOrder.map(s => {
                            const sc = statusConfig[s];
                            const isCurrent = ep.status === s;
                            return (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(ep.id, s)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '10px',
                                  border: isCurrent ? `1px solid ${sc.color}` : '1px solid var(--border)',
                                  background: isCurrent ? sc.bg : 'transparent',
                                  color: isCurrent ? sc.color : 'var(--text-tertiary)',
                                  fontSize: '11px',
                                  fontWeight: isCurrent ? 500 : 400,
                                  cursor: 'pointer',
                                }}
                              >
                                {sc.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add Episode Form ──────────────────────────

function AddEpisodeForm({
  productionId,
  nextNumber,
  onCreated,
  onCancel,
}: {
  productionId: string;
  nextNumber: number;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [epNumber, setEpNumber] = useState(nextNumber);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/episodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionId,
          episodeNumber: epNumber,
          title: title || null,
          status: 'planned',
        }),
      });
      if (res.ok) {
        onCreated();
      }
    } catch {
      // Silently fail
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      marginBottom: '16px',
      padding: '16px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--accent)',
      background: 'var(--bg-card)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
          New Episode
        </span>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', marginBottom: '12px' }}>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
            Number
          </label>
          <input
            type="number"
            value={epNumber}
            onChange={e => setEpNumber(parseInt(e.target.value) || 1)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: 'var(--font-mono)',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
            Title (optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Episode title..."
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: '14px',
            }}
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--accent)',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 500,
          border: 'none',
          cursor: 'pointer',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        {saving ? 'Creating...' : 'Create Episode'}
      </button>
    </div>
  );
}
