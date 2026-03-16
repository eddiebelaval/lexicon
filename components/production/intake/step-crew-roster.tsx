'use client';

import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrewRole } from '@/types';
import type { CrewMemberDraft } from './intake-types';

interface CrewRosterStepProps {
  crew: CrewMemberDraft[];
  onChange: (crew: CrewMemberDraft[]) => void;
}

const CREW_ROLE_OPTIONS: { value: CrewRole; label: string }[] = [
  { value: 'staff', label: 'Staff' },
  { value: 'ac', label: 'AC' },
  { value: 'producer', label: 'Producer' },
  { value: 'fixer', label: 'Fixer' },
  { value: 'editor', label: 'Editor' },
  { value: 'coordinator', label: 'Coordinator' },
];

const inputClass =
  'w-full px-3 py-2 bg-surface-tertiary border border-panel-border rounded-md text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-vhs-400/50';

const selectClass =
  'w-full px-3 py-2 bg-surface-tertiary border border-panel-border rounded-md text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-vhs-400/50';

export function CrewRosterStep({ crew, onChange }: CrewRosterStepProps) {
  function addMember() {
    const member: CrewMemberDraft = {
      tempId: crypto.randomUUID(),
      name: '',
      role: 'staff',
      contactEmail: '',
      contactPhone: '',
    };
    onChange([...crew, member]);
  }

  function removeMember(tempId: string) {
    onChange(crew.filter((m) => m.tempId !== tempId));
  }

  function updateMember(
    tempId: string,
    field: keyof Omit<CrewMemberDraft, 'tempId'>,
    value: string
  ) {
    onChange(
      crew.map((m) =>
        m.tempId === tempId ? { ...m, [field]: value } : m
      )
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-medium text-gray-100">
            Who&apos;s on your crew?
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Add your crew and ACs.
          </p>
        </div>
        <button
          type="button"
          onClick={addMember}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md shrink-0',
            'bg-vhs-400/10 text-vhs-400 hover:bg-vhs-400/20 transition-colors'
          )}
        >
          <Plus className="h-4 w-4" />
          Add Crew Member
        </button>
      </div>

      {crew.length === 0 ? (
        <div className="rounded-md border border-dashed border-panel-border bg-surface-secondary px-6 py-10 text-center">
          <p className="text-sm text-gray-500">
            No crew members yet. Add your crew to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {crew.map((member) => (
            <div
              key={member.tempId}
              className="group relative rounded-md border border-panel-border bg-surface-secondary p-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-start">
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => updateMember(member.tempId, 'name', e.target.value)}
                  placeholder="Name"
                  className={inputClass}
                />
                <select
                  value={member.role}
                  onChange={(e) => updateMember(member.tempId, 'role', e.target.value)}
                  className={selectClass}
                >
                  {CREW_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  type="email"
                  value={member.contactEmail}
                  onChange={(e) => updateMember(member.tempId, 'contactEmail', e.target.value)}
                  placeholder="Email"
                  className={inputClass}
                />
                <input
                  type="tel"
                  value={member.contactPhone}
                  onChange={(e) => updateMember(member.tempId, 'contactPhone', e.target.value)}
                  placeholder="Phone"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeMember(member.tempId)}
                  className="p-2 text-gray-600 hover:text-red-400 transition-colors rounded-md hover:bg-surface-tertiary"
                  aria-label="Remove crew member"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
