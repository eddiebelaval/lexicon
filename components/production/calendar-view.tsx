'use client';

/**
 * Calendar View — Full production calendar with week/month toggle
 *
 * Fetches the production for the universe, then loads scenes for the
 * visible date range. Supports week and month view modes with
 * prev/next navigation and a "Today" shortcut.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  LayoutGrid,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CalendarDayCell } from '@/components/production/calendar-day-cell';
import { SceneCard } from '@/components/production/scene-card';
import { useProduction } from '@/components/production/production-context';
import type { ProdScene } from '@/types/production';

type ViewMode = 'week' | 'month';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function formatDateShort(date: Date): string {
  return date.toISOString().split('T')[0];
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Build the grid of dates for a month view.
 * Starts on the Sunday of the week containing the 1st and ends on
 * the Saturday of the week containing the last day of the month.
 */
function getMonthGrid(date: Date): Date[] {
  const first = startOfMonth(date);
  const last = endOfMonth(date);
  const gridStart = startOfWeek(first);
  const gridEnd = addDays(startOfWeek(addDays(last, 6)), 6);

  const days: Date[] = [];
  let current = new Date(gridStart);
  while (current <= gridEnd) {
    days.push(new Date(current));
    current = addDays(current, 1);
  }
  return days;
}

function getWeekGrid(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function formatRangeLabel(dates: Date[], mode: ViewMode): string {
  if (dates.length === 0) return '';
  const first = dates[0];
  const last = dates[dates.length - 1];
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  if (mode === 'month') {
    return first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  const fStr = first.toLocaleDateString('en-US', opts);
  const lStr = last.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  return `${fStr} - ${lStr}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CalendarView() {
  const { production } = useProduction();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());
  const [scenes, setScenes] = useState<ProdScene[]>([]);
  const [selectedScene, setSelectedScene] = useState<ProdScene | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();

  // Build date grid
  const dates = useMemo(
    () =>
      viewMode === 'month'
        ? getMonthGrid(anchorDate)
        : getWeekGrid(anchorDate),
    [viewMode, anchorDate]
  );

  const rangeLabel = useMemo(
    () => formatRangeLabel(dates, viewMode),
    [dates, viewMode]
  );

  // ------ Fetch scenes for visible range ------
  const fetchScenes = useCallback(async () => {
    if (!production) return;
    const startDate = formatDateShort(dates[0]);
    const endDate = formatDateShort(dates[dates.length - 1]);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/scenes?productionId=${production.id}&startDate=${startDate}&endDate=${endDate}`
      );
      const data = await res.json();
      if (data.success) {
        setScenes(data.data.items as ProdScene[]);
      } else {
        setError(data.error?.message ?? 'Failed to load scenes');
      }
    } catch {
      setError('Failed to load scenes');
    } finally {
      setLoading(false);
    }
  }, [production, dates]);

  useEffect(() => {
    if (production) {
      fetchScenes();
    }
  }, [production, fetchScenes]);

  // ------ Navigation ------
  function navigate(direction: -1 | 1) {
    setAnchorDate((prev) => {
      if (viewMode === 'week') return addDays(prev, direction * 7);
      const next = new Date(prev);
      next.setMonth(next.getMonth() + direction);
      return next;
    });
  }

  function goToday() {
    setAnchorDate(new Date());
  }

  // ------ Scene lookup per day ------
  function scenesForDay(date: Date): ProdScene[] {
    const key = formatDateShort(date);
    return scenes.filter((s) => s.scheduledDate === key);
  }

  // ------ Skeleton rows ------
  const skeletonCells = viewMode === 'month' ? 35 : 7;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center rounded-md border border-panel-border overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'week'
                  ? 'bg-vhs-400/15 text-vhs-400'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                viewMode === 'month'
                  ? 'bg-vhs-400/15 text-vhs-400'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Month
            </button>
          </div>

          {/* Navigation */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1.5 rounded text-gray-500 hover:text-gray-300 hover:bg-surface-elevated transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(1)}
            className="p-1.5 rounded text-gray-500 hover:text-gray-300 hover:bg-surface-elevated transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={goToday}
            className="px-2.5 py-1 rounded text-xs font-medium text-gray-400 border border-panel-border hover:text-gray-200 hover:border-gray-500 transition-colors"
          >
            Today
          </button>

          <span className="text-sm font-medium text-gray-200 ml-2">
            {rangeLabel}
          </span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Calendar grid */}
      <div>
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-px mb-1">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-xs font-medium text-gray-500 py-1"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Date cells */}
        {loading && !scenes.length ? (
          <div className="grid grid-cols-7 gap-px">
            {Array.from({ length: skeletonCells }, (_, i) => (
              <div
                key={i}
                className="min-h-[100px] rounded border border-panel-border bg-surface-primary animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-px">
            {dates.map((date) => (
              <CalendarDayCell
                key={formatDateShort(date)}
                date={date}
                scenes={scenesForDay(date)}
                isToday={isSameDay(date, today)}
                onSceneClick={setSelectedScene}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selected scene detail panel */}
      {selectedScene && (
        <div className="border border-panel-border rounded-md bg-panel-bg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">
              Scene Detail
            </h3>
            <button
              type="button"
              onClick={() => setSelectedScene(null)}
              className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-surface-elevated transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <SceneCard scene={selectedScene} />
        </div>
      )}
    </div>
  );
}
