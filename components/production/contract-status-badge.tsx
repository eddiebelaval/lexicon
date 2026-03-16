'use client';

/**
 * Contract Status Badge — Colored pill showing contract status
 */

import { cn } from '@/lib/utils';
import { CONTRACT_STATUS_CONFIG } from '@/lib/production-config';
import type { ContractStatus } from '@/types/production';

interface ContractStatusBadgeProps {
  status: ContractStatus;
}

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  const config = CONTRACT_STATUS_CONFIG[status];

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
