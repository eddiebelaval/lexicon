'use client';

import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/shell';
import { useProduction } from '@/components/production/production-context';
import { Network, Users, AlertCircle, Loader2 } from 'lucide-react';

interface CastNode {
  id: string;
  name: string;
  status: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function GraphPage() {
  const { production, loading: prodLoading } = useProduction();
  const [castMembers, setCastMembers] = useState<CastNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Fetch cast for this production
  useEffect(() => {
    if (!production) return;

    async function fetchCast() {
      try {
        const res = await fetch(`/api/cast-contracts?productionId=${production!.id}&limit=50`);
        const data = await res.json();

        if (data.success && data.data?.items) {
          const nodes: CastNode[] = data.data.items.map((c: { id: string; castName: string; contractStatus: string }, i: number) => {
            const angle = (i / data.data.items.length) * Math.PI * 2;
            const radius = 120 + Math.random() * 60;
            return {
              id: c.id,
              name: c.castName || `Cast ${i + 1}`,
              status: c.contractStatus || 'pending',
              x: 300 + Math.cos(angle) * radius,
              y: 250 + Math.sin(angle) * radius,
              vx: (Math.random() - 0.5) * 0.3,
              vy: (Math.random() - 0.5) * 0.3,
            };
          });
          setCastMembers(nodes);
        }
      } catch {
        setError('Failed to load cast data');
      } finally {
        setLoading(false);
      }
    }

    fetchCast();
  }, [production]);

  // Simple canvas animation for cast nodes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || castMembers.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const nodes = castMembers.map(n => ({
      ...n,
      x: centerX + (n.x - 300) * (rect.width / 600),
      y: centerY + (n.y - 250) * (rect.height / 500),
    }));

    const statusColors: Record<string, string> = {
      signed: '#22c55e',
      pending: '#f59e0b',
      offer_sent: '#3b82f6',
      declined: '#ef4444',
      dnc: '#6b7280',
      email_sent: '#8b5cf6',
    };

    function draw() {
      ctx!.clearRect(0, 0, rect.width, rect.height);

      // Draw connections (lines between nearby nodes)
      ctx!.strokeStyle = 'rgba(205, 107, 90, 0.08)';
      ctx!.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            ctx!.globalAlpha = 1 - dist / 200;
            ctx!.beginPath();
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(nodes[j].x, nodes[j].y);
            ctx!.stroke();
          }
        }
      }
      ctx!.globalAlpha = 1;

      // Draw nodes
      for (const node of nodes) {
        // Gentle drift
        node.x += node.vx;
        node.y += node.vy;

        // Boundary bounce
        if (node.x < 60 || node.x > rect.width - 60) node.vx *= -1;
        if (node.y < 60 || node.y > rect.height - 60) node.vy *= -1;

        // Center gravity
        node.vx += (centerX - node.x) * 0.0001;
        node.vy += (centerY - node.y) * 0.0001;

        const color = statusColors[node.status] || '#CD6B5A';

        // Glow
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, 20, 0, Math.PI * 2);
        ctx!.fillStyle = color + '18';
        ctx!.fill();

        // Node circle
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, 8, 0, Math.PI * 2);
        ctx!.fillStyle = color;
        ctx!.fill();

        // Label
        ctx!.font = '12px Outfit, system-ui, sans-serif';
        ctx!.fillStyle = '#ede9e3';
        ctx!.textAlign = 'center';
        ctx!.fillText(node.name, node.x, node.y + 24);
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [castMembers]);

  if (prodLoading) {
    return (
      <div>
        <PageHeader title="Cast Relationships" description="Visual map of production entities" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin" size={20} style={{ color: 'var(--text-tertiary)' }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Cast Relationships" description="Visual map of production entities" />

      {/* Neo4j status banner */}
      <div style={{
        margin: '0 24px 16px',
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--warning-soft)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '13px',
        color: 'var(--text-secondary)',
      }}>
        <AlertCircle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
        <span>
          Knowledge graph (Neo4j) is hibernated. Showing cast preview from production data.
          Full relationship mapping will be available when the graph database is provisioned.
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin" size={20} style={{ color: 'var(--text-tertiary)' }} />
        </div>
      ) : error ? (
        <div className="text-center py-20" style={{ color: 'var(--text-tertiary)' }}>
          <p>{error}</p>
        </div>
      ) : castMembers.length === 0 ? (
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
            <Users size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            No cast members yet. Import cast from Excel or add them manually.
          </p>
        </div>
      ) : (
        <div style={{ padding: '0 24px 24px' }}>
          {/* Canvas visualization */}
          <div style={{
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '400px', display: 'block' }}
            />

            {/* Legend */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              display: 'flex',
              gap: '12px',
              fontSize: '11px',
              color: 'var(--text-tertiary)',
            }}>
              {[
                { label: 'Signed', color: '#22c55e' },
                { label: 'Pending', color: '#f59e0b' },
                { label: 'Offer Sent', color: '#3b82f6' },
                { label: 'Declined', color: '#ef4444' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: item.color,
                  }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Stats bar */}
          <div style={{
            display: 'flex',
            gap: '24px',
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            fontSize: '13px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Network size={14} style={{ color: 'var(--accent)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                {castMembers.length} cast members
              </span>
            </div>
            <div style={{ color: 'var(--text-tertiary)' }}>
              {castMembers.filter(c => c.status === 'signed').length} signed
            </div>
            <div style={{ color: 'var(--text-tertiary)' }}>
              {castMembers.filter(c => c.status === 'pending').length} pending
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
