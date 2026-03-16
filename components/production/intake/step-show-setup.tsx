'use client';

import type { ShowSetupData } from './intake-types';

interface ShowSetupStepProps {
  data: ShowSetupData;
  onChange: (data: ShowSetupData) => void;
}

const inputClass =
  'w-full px-3 py-2 bg-surface-tertiary border border-panel-border rounded-md text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-vhs-400/50';

export function ShowSetupStep({ data, onChange }: ShowSetupStepProps) {
  function update(field: keyof ShowSetupData, value: string) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-gray-100">
          Tell us about your production
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          This information helps Lexi understand your show.
        </p>
      </div>

      <div className="space-y-4">
        {/* Show Name */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Show Name <span className="text-vhs-400">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. Diaries"
            className={inputClass}
          />
        </div>

        {/* Season */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Season
          </label>
          <input
            type="text"
            value={data.season}
            onChange={(e) => update('season', e.target.value)}
            placeholder="e.g. Season 8"
            className={inputClass}
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={data.startDate}
              onChange={(e) => update('startDate', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              End Date
            </label>
            <input
              type="date"
              value={data.endDate}
              onChange={(e) => update('endDate', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">
            Notes
          </label>
          <textarea
            value={data.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Anything Lexi should know about this production..."
            rows={3}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
