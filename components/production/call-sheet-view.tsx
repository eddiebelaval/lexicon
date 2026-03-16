'use client';

/**
 * Call Sheet View — Printable daily call sheet for a production
 *
 * Date picker at top (defaults to today), fetches call sheet data,
 * renders as a clean printable document with scenes, cast, and crew.
 */

import { useState, useEffect, useCallback } from 'react';
import { Printer, Loader2, AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduction } from '@/components/production/production-context';
import type { CallSheet } from '@/lib/call-sheet';

interface CallSheetViewProps {
  productionId: string;
}

/** Format YYYY-MM-DD as a human-readable date */
function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Get today as YYYY-MM-DD */
function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function CallSheetView({ productionId }: CallSheetViewProps) {
  const { production } = useProduction();
  const [date, setDate] = useState(todayString);
  const [callSheet, setCallSheet] = useState<CallSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCallSheet = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/call-sheet?productionId=${productionId}&date=${date}`
      );
      const data = await res.json();

      if (data.success) {
        setCallSheet(data.data);
      } else {
        setError(data.error?.message || 'Failed to load call sheet');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load call sheet');
    } finally {
      setLoading(false);
    }
  }, [productionId, date]);

  useEffect(() => {
    fetchCallSheet();
  }, [fetchCallSheet]);

  return (
    <div className="space-y-6">
      {/* Controls — hidden when printing */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <label htmlFor="call-sheet-date" className="text-sm font-medium text-gray-400">
            Date
          </label>
          <input
            id="call-sheet-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-panel-border bg-surface-secondary px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-vhs-400/50"
          />
        </div>

        <button
          onClick={() => window.print()}
          disabled={loading || !callSheet || callSheet.entries.length === 0}
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            'bg-vhs-400 text-black hover:bg-vhs-300',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <Printer className="h-4 w-4" />
          Print
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          <span className="ml-2 text-sm text-gray-500">Loading call sheet...</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && callSheet && callSheet.entries.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <FileText className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">No scenes scheduled for {formatDate(date)}</p>
        </div>
      )}

      {/* Call Sheet Document */}
      {!loading && !error && callSheet && callSheet.entries.length > 0 && (
        <div className="rounded-lg border border-panel-border bg-surface-secondary p-8 print:border-none print:p-0 print:bg-white print:text-black">
          {/* Header */}
          <div className="mb-8 text-center border-b border-panel-border pb-6 print:border-black">
            <h2 className="text-2xl font-bold tracking-tight print:text-black">
              CALL SHEET
            </h2>
            <p className="mt-1 text-lg font-semibold text-gray-200 print:text-black">
              {callSheet.productionName}
              {production?.season && (
                <span className="ml-2 font-normal text-gray-400 print:text-gray-600">
                  {production.season}
                </span>
              )}
            </p>
            <p className="mt-1 text-sm text-gray-400 print:text-gray-600">
              {formatDate(callSheet.date)}
            </p>
          </div>

          {/* Scenes */}
          <div className="space-y-8">
            {callSheet.entries.map((entry, idx) => (
              <div
                key={entry.scene.id}
                className={cn(
                  'space-y-4',
                  idx > 0 && 'border-t border-panel-border pt-8 print:border-gray-300'
                )}
              >
                {/* Scene header */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <h3 className="text-lg font-semibold print:text-black">
                      {entry.scene.sceneNumber && (
                        <span className="mr-2 text-vhs-400 print:text-gray-700">
                          #{entry.scene.sceneNumber}
                        </span>
                      )}
                      {entry.scene.title}
                    </h3>
                    {entry.scene.description && (
                      <p className="mt-1 text-sm text-gray-400 print:text-gray-600">
                        {entry.scene.description}
                      </p>
                    )}
                  </div>
                  {entry.scene.scheduledTime && (
                    <span className="text-sm font-medium text-gray-300 print:text-black">
                      {entry.scene.scheduledTime}
                    </span>
                  )}
                </div>

                {/* Location */}
                {entry.scene.location && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-300 print:text-gray-700">
                      Location:{' '}
                    </span>
                    <span className="text-gray-400 print:text-black">
                      {entry.scene.location}
                      {entry.scene.locationDetails && ` — ${entry.scene.locationDetails}`}
                    </span>
                  </div>
                )}

                {/* Cast */}
                {entry.castNames.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-300 print:text-gray-700">
                      Cast:{' '}
                    </span>
                    <span className="text-gray-400 print:text-black">
                      {entry.castNames.join(', ')}
                    </span>
                  </div>
                )}

                {/* Crew Assignments Table */}
                {entry.crewAssignments.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-300 print:text-gray-700">
                      Crew
                    </p>
                    <table className="w-full text-sm border border-panel-border print:border-gray-300">
                      <thead>
                        <tr className="bg-surface-primary print:bg-gray-100">
                          <th className="px-3 py-2 text-left font-medium text-gray-400 print:text-gray-700 border-b border-panel-border print:border-gray-300">
                            Name
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-400 print:text-gray-700 border-b border-panel-border print:border-gray-300">
                            Role
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-400 print:text-gray-700 border-b border-panel-border print:border-gray-300">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.crewAssignments.map((crew, i) => (
                          <tr
                            key={i}
                            className={cn(
                              i % 2 === 0
                                ? 'bg-surface-secondary print:bg-white'
                                : 'bg-surface-primary/50 print:bg-gray-50'
                            )}
                          >
                            <td className="px-3 py-2 text-gray-200 print:text-black border-b border-panel-border/50 print:border-gray-200">
                              {crew.crewName}
                            </td>
                            <td className="px-3 py-2 text-gray-400 print:text-gray-700 capitalize border-b border-panel-border/50 print:border-gray-200">
                              {crew.role}
                            </td>
                            <td className="px-3 py-2 text-gray-500 print:text-gray-600 border-b border-panel-border/50 print:border-gray-200">
                              {crew.notes || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Equipment Notes */}
                {entry.scene.equipmentNotes && (
                  <div className="text-sm rounded-md bg-surface-primary/50 px-3 py-2 print:bg-gray-50 print:border print:border-gray-300">
                    <span className="font-medium text-gray-300 print:text-gray-700">
                      Equipment:{' '}
                    </span>
                    <span className="text-gray-400 print:text-black">
                      {entry.scene.equipmentNotes}
                    </span>
                  </div>
                )}

                {/* Self-shot badge */}
                {entry.scene.isSelfShot && (
                  <span className="inline-block rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400 print:bg-amber-100 print:text-amber-800">
                    SELF-SHOT
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* General Notes */}
          {callSheet.generalNotes && (
            <div className="mt-8 border-t border-panel-border pt-6 print:border-gray-300">
              <p className="text-sm font-medium text-gray-300 print:text-gray-700 mb-1">
                General Notes
              </p>
              <p className="text-sm text-gray-400 print:text-black whitespace-pre-wrap">
                {callSheet.generalNotes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
