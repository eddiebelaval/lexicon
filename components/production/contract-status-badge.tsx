'use client';

/**
 * Contract Status Badge — Colored pill showing contract status
 */

import { cn } from '@/lib/utils';
import type { ContractStatus } from '@/types/production';

interface ContractStatusBadgeProps {
  status: ContractStatus;
}

const statusConfig: Record<ContractStatus, { bg: string; text: string; label: string }> = {
  signed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Signed' },
  pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pending' },
  offer_sent: { bg: 'bg-sky-500/20', text: 'text-sky-400', label: 'Offer Sent' },
  dnc: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'DNC' },
  email_sent: { bg: 'bg-violet-500/20', text: 'text-violet-400', label: 'Email Sent' },
  declined: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Declined' },
};

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.bg,
        config.text
      )}
    >
      {config.label}
    </span>
  );
}
