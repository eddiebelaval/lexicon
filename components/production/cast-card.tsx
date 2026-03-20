'use client';

import { getCastDisplayName } from '@/lib/cast-utils';
import { CONTRACT_STATUS_CONFIG } from '@/lib/production-config';
import type { CastContract } from '@/types';

interface CastCardProps {
  contract: CastContract;
  onSelect?: (contract: CastContract) => void;
}

export function CastCard({ contract, onSelect }: CastCardProps) {
  const name = getCastDisplayName(contract);
  const statusConfig = CONTRACT_STATUS_CONFIG[contract.contractStatus] ?? {
    label: contract.contractStatus, bg: 'bg-gray-800/50', text: 'text-gray-400',
  };

  // Completion: 4 checkpoints
  const checkpoints = [
    { label: 'Shoot', done: contract.shootDone },
    { label: 'Interview', done: contract.interviewDone },
    { label: 'Pickup', done: contract.pickupDone },
    { label: 'Payment', done: contract.paymentDone },
  ];
  const completedCount = checkpoints.filter(c => c.done).length;
  const completionPct = Math.round((completedCount / 4) * 100);

  // Ring color based on completion
  const ringColor = completionPct === 100
    ? 'var(--healthy)'
    : completionPct >= 50
      ? 'var(--warning)'
      : completionPct > 0
        ? 'var(--accent)'
        : 'var(--border-strong)';

  // Conic gradient for the completion ring
  const ringGradient = `conic-gradient(${ringColor} ${completionPct * 3.6}deg, var(--border) ${completionPct * 3.6}deg)`;

  // Initials from name
  const initials = name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <button
      className="cast-card"
      onClick={() => onSelect?.(contract)}
      type="button"
    >
      {/* Avatar / Photo placeholder with completion ring */}
      <div className="cast-card-avatar-ring" style={{ background: ringGradient }}>
        <div className="cast-card-avatar">
          <span className="cast-card-initials">{initials}</span>
        </div>
      </div>

      {/* Name */}
      <div className="cast-card-name">{name}</div>

      {/* Status pill */}
      <div className={`cast-card-status ${statusConfig.bg} ${statusConfig.text}`}>
        {statusConfig.label}
      </div>

      {/* Completion checkpoints */}
      <div className="cast-card-checkpoints">
        {checkpoints.map((cp) => (
          <div
            key={cp.label}
            className={`cast-card-checkpoint ${cp.done ? 'cast-card-checkpoint--done' : ''}`}
            title={`${cp.label}: ${cp.done ? 'Done' : 'Pending'}`}
          >
            {cp.done ? (
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3.5 8 6.5 11 12.5 5" />
              </svg>
            ) : (
              <span className="cast-card-checkpoint-dot" />
            )}
          </div>
        ))}
      </div>

      {/* Completion text */}
      <div className="cast-card-completion">{completedCount}/4</div>
    </button>
  );
}
