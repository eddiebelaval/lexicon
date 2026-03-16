'use client';

import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CastMemberDraft } from './intake-types';

interface CastRosterStepProps {
  cast: CastMemberDraft[];
  onChange: (cast: CastMemberDraft[]) => void;
}

const inputClass =
  'w-full px-3 py-2 bg-surface-tertiary border border-panel-border rounded-md text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-vhs-400/50';

export function CastRosterStep({ cast, onChange }: CastRosterStepProps) {
  function addMember() {
    const member: CastMemberDraft = {
      tempId: crypto.randomUUID(),
      name: '',
      aliases: '',
      description: '',
      location: '',
    };
    onChange([...cast, member]);
  }

  function removeMember(tempId: string) {
    onChange(cast.filter((m) => m.tempId !== tempId));
  }

  function updateMember(tempId: string, field: keyof Omit<CastMemberDraft, 'tempId'>, value: string) {
    onChange(
      cast.map((m) =>
        m.tempId === tempId ? { ...m, [field]: value } : m
      )
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-medium text-gray-100">
            Who&apos;s in your cast?
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Add your cast members. You can always add more later.
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
          Add Cast Member
        </button>
      </div>

      {cast.length === 0 ? (
        <div className="rounded-md border border-dashed border-panel-border bg-surface-secondary px-6 py-10 text-center">
          <p className="text-sm text-gray-500">
            No cast members yet. Add your cast to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {cast.map((member) => (
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
                <input
                  type="text"
                  value={member.aliases}
                  onChange={(e) => updateMember(member.tempId, 'aliases', e.target.value)}
                  placeholder="Aliases (comma-separated)"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={member.description}
                  onChange={(e) => updateMember(member.tempId, 'description', e.target.value)}
                  placeholder="Description"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={member.location}
                  onChange={(e) => updateMember(member.tempId, 'location', e.target.value)}
                  placeholder="Location"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeMember(member.tempId)}
                  className="p-2 text-gray-600 hover:text-red-400 transition-colors rounded-md hover:bg-surface-tertiary"
                  aria-label="Remove cast member"
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
