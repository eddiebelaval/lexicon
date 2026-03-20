'use client';

/**
 * Cast Row — Single row in the cast board table
 *
 * Completion checkboxes use optimistic toggle via onToggle prop.
 * Text/select fields use InlineEdit components that save directly via API.
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InlineEditText, InlineEditSelect } from '@/components/production/inline-edit';
import { CONTRACT_STATUS_CONFIG } from '@/lib/production-config';
import { getCastDisplayName } from '@/lib/cast-utils';
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

const contractStatusOptions = Object.entries(CONTRACT_STATUS_CONFIG).map(
  ([value, config]) => ({ value, label: config.label })
);

const paymentTypeOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'flat', label: 'Flat' },
];

async function saveField(contractId: string, field: string, value: string) {
  const res = await fetch(`/api/cast-contracts/${contractId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [field]: value }),
  });
  if (!res.ok) throw new Error('Failed to save');
}

export function CastRow({ contract, onToggle }: CastRowProps) {
  return (
    <tr className="border-b border-panel-border hover:bg-surface-secondary/50 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-gray-300">
        {getCastDisplayName(contract)}
      </td>
      <td className="px-4 py-3">
        <InlineEditSelect
          value={contract.contractStatus}
          options={contractStatusOptions}
          onSave={(value) => saveField(contract.id, 'contractStatus', value)}
        />
      </td>
      <td className="px-4 py-3 text-sm text-gray-400">
        <InlineEditSelect
          value={contract.paymentType ?? ''}
          options={paymentTypeOptions}
          onSave={(value) => saveField(contract.id, 'paymentType', value)}
        />
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
      <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px]">
        <InlineEditText
          value={contract.notes ?? ''}
          onSave={(value) => saveField(contract.id, 'notes', value)}
          placeholder="--"
        />
      </td>
    </tr>
  );
}
