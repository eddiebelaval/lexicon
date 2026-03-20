'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/shell';
import { useProduction } from '@/components/production/production-context';
import {
  BookOpen,
  Search,
  User,
  Loader2,
  FileText,
  Globe,
  ChevronDown,
} from 'lucide-react';
import type { CastContract } from '@/types';

export default function KnowledgePage() {
  const { production, loading: prodLoading } = useProduction();
  const [cast, setCast] = useState<CastContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [enriching, setEnriching] = useState<string | null>(null);
  const [enrichmentData, setEnrichmentData] = useState<Record<string, EnrichmentProfile>>({});

  const fetchCast = useCallback(async () => {
    if (!production) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cast-contracts?productionId=${production.id}&limit=100`);
      const data = await res.json();
      if (data.success) {
        setCast(data.data.items || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [production]);

  useEffect(() => {
    fetchCast();
  }, [fetchCast]);

  const filteredCast = cast.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.castName?.toLowerCase().includes(q) ||
      c.notes?.toLowerCase().includes(q) ||
      c.contractStatus?.toLowerCase().includes(q)
    );
  });

  const handleEnrich = async (castName: string, castId: string) => {
    if (!castName) return;
    setEnriching(castId);
    try {
      const res = await fetch('/api/enrichment/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ castName }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setEnrichmentData(prev => ({ ...prev, [castId]: data.data }));
      }
    } catch {
      // Silently fail
    } finally {
      setEnriching(null);
    }
  };

  if (prodLoading) {
    return (
      <div>
        <PageHeader title="Knowledge Base" description="Production knowledge base and reference materials" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin" size={20} style={{ color: 'var(--text-tertiary)' }} />
        </div>
      </div>
    );
  }

  if (!production) {
    return (
      <div>
        <PageHeader title="Knowledge Base" description="Production knowledge base and reference materials" />
        <div className="text-center py-20" style={{ color: 'var(--text-tertiary)' }}>
          <p>No production found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description={`Show bible for ${production.name}`}
      />

      <div style={{ padding: '0 24px 24px' }}>
        {/* Search */}
        <div style={{
          position: 'relative',
          marginBottom: '20px',
        }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search cast, notes, status..."
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              outline: 'none',
            }}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin" size={20} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        ) : filteredCast.length === 0 ? (
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
              <BookOpen size={24} style={{ color: 'var(--accent)' }} />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {searchQuery ? 'No results found.' : 'No cast data yet. Import cast to build your show bible.'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '12px',
          }}>
            {filteredCast.map(member => {
              const isExpanded = expandedId === member.id;
              const enrichment = enrichmentData[member.id];
              const isEnriching = enriching === member.id;

              return (
                <div
                  key={member.id}
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Card header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : member.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--accent-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <User size={16} style={{ color: 'var(--accent)' }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {member.castName || 'Unknown'}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {member.contractStatus?.replace('_', ' ')}
                        {member.shootDone && ' / shot'}
                        {member.interviewDone && ' / interviewed'}
                      </p>
                    </div>

                    <ChevronDown
                      size={14}
                      style={{
                        color: 'var(--text-muted)',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform var(--dur-fast) var(--ease-out)',
                      }}
                    />
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{
                      padding: '0 16px 16px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}>
                      {/* Notes */}
                      {member.notes && (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '6px',
                          }}>
                            <FileText size={12} style={{ color: 'var(--text-tertiary)' }} />
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Notes
                            </span>
                          </div>
                          <p style={{
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                          }}>
                            {member.notes}
                          </p>
                        </div>
                      )}

                      {/* Enrichment data */}
                      {enrichment && (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '8px',
                          }}>
                            <Globe size={12} style={{ color: 'var(--accent)' }} />
                            <span style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Web Research
                            </span>
                          </div>

                          {enrichment.bio && (
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '8px' }}>
                              {enrichment.bio}
                            </p>
                          )}

                          {enrichment.location && (
                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                              Location: {enrichment.location}
                            </p>
                          )}

                          {enrichment.showHistory && enrichment.showHistory.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Show History:</p>
                              {enrichment.showHistory.map((sh: { show: string; seasons: string[] }, i: number) => (
                                <p key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                                  {sh.show} ({sh.seasons.join(', ')})
                                </p>
                              ))}
                            </div>
                          )}

                          {enrichment.socialMedia && Object.keys(enrichment.socialMedia).length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                              {Object.entries(enrichment.socialMedia).map(([platform, handle]) => (
                                handle && (
                                  <span key={platform} style={{
                                    fontSize: '11px',
                                    padding: '2px 8px',
                                    borderRadius: '8px',
                                    background: 'var(--accent-muted)',
                                    color: 'var(--accent-text)',
                                  }}>
                                    {platform}: {handle as string}
                                  </span>
                                )
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Enrich button */}
                      {!enrichment && member.castName && (
                        <button
                          onClick={() => handleEnrich(member.castName!, member.id)}
                          disabled={isEnriching}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border)',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '12px',
                            cursor: 'pointer',
                            marginTop: '12px',
                            opacity: isEnriching ? 0.7 : 1,
                          }}
                        >
                          {isEnriching ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Globe size={12} />
                          )}
                          {isEnriching ? 'Researching...' : 'Research on Web'}
                        </button>
                      )}
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

// Type for enrichment profile (matches CastProfile from lib/enrichment/types)
interface EnrichmentProfile {
  bio: string | null;
  location: string | null;
  showHistory: { show: string; seasons: string[] }[];
  socialMedia: Record<string, string>;
  // Other fields exist but these are what we display
  [key: string]: unknown;
}
