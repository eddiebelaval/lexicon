'use client';

/**
 * Cast Row — Single row in the cast board table
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContractStatusBadge } from '@/components/production/contract-status-badge';
import type { CompletionField } from '@/lib/production-config';
import type { CastContract } from '@/types/production';

interface CastRowProps {
  contract: CastContract;
  onToggle: (id: string, field: CompletionField, value: boolean) => void;
}

function CompletionCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded border transition-colors',
        checked
          ? 'bg-vhs-400 border-vhs-400 text-white'
          : 'bg-surface-tertiary border-panel-border text-transparent hover:border-gray-500'
      )}
    >
      <Check className="h-3.5 w-3.5" />
    </button>
  );
}

export function CastRow({ contract, onToggle }: CastRowProps) {
  return (
    <tr className="border-b border-panel-border hover:bg-surface-secondary/50 transition-colors">
      <td className="px-4 py-3 text-sm font-mono text-gray-300">
        {contract.castEntityId}
      </td>
      <td className="px-4 py-3">
        <ContractStatusBadge status={contract.contractStatus} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-400 capitalize">
        {contract.paymentType ?? '--'}
      </td>
      <td className="px-4 py-3">
        <CompletionCheckbox
          checked={contract.shootDone}
          onChange={() => onToggle(contract.id, 'shootDone', !contract.shootDone)}
        />
      </td>
      <td className="px-4 py-3">
        <CompletionCheckbox
          checked={contract.interviewDone}
          onChange={() => onToggle(contract.id, 'interviewDone', !contract.interviewDone)}
        />
      </td>
      <td className="px-4 py-3">
        <CompletionCheckbox
          checked={contract.pickupDone}
          onChange={() => onToggle(contract.id, 'pickupDone', !contract.pickupDone)}
        />
      </td>
      <td className="px-4 py-3">
        <CompletionCheckbox
          checked={contract.paymentDone}
          onChange={() => onToggle(contract.id, 'paymentDone', !contract.paymentDone)}
        />
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
        {contract.notes ?? ''}
      </td>
    </tr>
  );
}
