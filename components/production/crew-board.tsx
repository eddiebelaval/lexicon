'use client';

/**
 * Crew Board — Weekly availability grid for all crew members
 *
 * Fetches crew + availability for a Mon-Fri window. Supports week
 * navigation and click-to-cycle status per cell.
 */

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrewAvailabilityCell } from '@/components/production/crew-availability-cell';
import type {
  Production,
  CrewMember,
  CrewAvailability,
  AvailabilityStatus,
} from '@/types/production';

interface CrewBoardProps {
  universeId: string;
}

/** Status cycle order for click-through */
const STATUS_CYCLE: (AvailabilityStatus | null)[] = [
  null,
  'available',
  'booked',
  'ooo',
  'dark',
  'holding',
];

/** Get the Monday (start of work week) for a given date */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Format a date as YYYY-MM-DD (for API keys) */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Format a date for the column header (e.g. "Mon 3/17") */
function formatHeader(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[date.getDay()]} ${date.getMonth() + 1}/${date.getDate()}`;
}

/** Generate Mon-Fri dates from a given Monday */
function getWeekDates(monday: Date): Date[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/** Build a lookup key for availability: `crewMemberId::date` */
function availKey(crewMemberId: string, date: string): string {
  return `${crewMemberId}::${date}`;
}

export function CrewBoard({ universeId }: CrewBoardProps) {
  const [monday, setMonday] = useState<Date>(() => getMonday(new Date()));
  const [production, setProduction] = useState<Production | null>(null);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [availability, setAvailability] = useState<
    Map<string, CrewAvailability>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekDates = getWeekDates(monday);
  const dateStrings = weekDates.map(toDateString);

  // ---- Data fetching ----

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get production for this universe
      const prodRes = await fetch(
        `/api/productions?universeId=${universeId}&limit=1`
      );
      const prodData = await prodRes.json();
      if (!prodData.success || prodData.data.items.length === 0) {
        setError('No production found for this universe.');
        setLoading(false);
        return;
      }
      const prod: Production = prodData.data.items[0];
      setProduction(prod);

      // 2. Get crew members for production
      const crewRes = await fetch(
        `/api/crew?productionId=${prod.id}`
      );
      const crewData = await crewRes.json();
      if (!crewData.success) {
        setError('Failed to load crew members.');
        setLoading(false);
        return;
      }
      const crewItems: CrewMember[] = crewData.data.items ?? crewData.data;
      setCrew(crewItems);

      // 3. Get availability for this production + date range
      const startDate = toDateString(weekDates[0]);
      const endDate = toDateString(weekDates[4]);
      const availRes = await fetch(
        `/api/crew-availability?productionId=${prod.id}&startDate=${startDate}&endDate=${endDate}`
      );
      const availData = await availRes.json();
      if (availData.success) {
        const items: CrewAvailability[] = availData.data.items ?? availData.data;
        const map = new Map<string, CrewAvailability>();
        for (const entry of items) {
          map.set(availKey(entry.crewMemberId, entry.date), entry);
        }
        setAvailability(map);
      }
    } catch {
      setError('Failed to load crew board data.');
    } finally {
      setLoading(false);
    }
  }, [universeId, weekDates[0].getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---- Handlers ----

  const shiftWeek = (direction: -1 | 1) => {
    setMonday((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + direction * 7);
      return next;
    });
  };

  const handleCellClick = async (crewMember: CrewMember, dateStr: string) => {
    const key = availKey(crewMember.id, dateStr);
    const existing = availability.get(key) ?? null;
    const currentStatus = existing?.status ?? null;

    const currentIdx = STATUS_CYCLE.indexOf(currentStatus);
    const nextIdx = (currentIdx + 1) % STATUS_CYCLE.length;
    const nextStatus = STATUS_CYCLE[nextIdx];

    // Optimistic update
    const prevAvailability = new Map(availability);

    if (nextStatus === null) {
      // Cycling back to null — delete entry
      const updated = new Map(availability);
      updated.delete(key);
      setAvailability(updated);

      if (existing) {
        try {
          await fetch(`/api/crew-availability/${existing.id}`, {
            method: 'DELETE',
          });
        } catch {
          setAvailability(prevAvailability);
        }
      }
    } else if (existing) {
      // Update existing entry
      const updatedEntry: CrewAvailability = { ...existing, status: nextStatus };
      const updated = new Map(availability);
      updated.set(key, updatedEntry);
      setAvailability(updated);

      try {
        await fetch(`/api/crew-availability/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        });
      } catch {
        setAvailability(prevAvailability);
      }
    } else {
      // Create new entry
      const optimistic: CrewAvailability = {
        id: `temp-${Date.now()}`,
        crewMemberId: crewMember.id,
        date: dateStr,
        status: nextStatus,
        notes: null,
      };
      const updated = new Map(availability);
      updated.set(key, optimistic);
      setAvailability(updated);

      try {
        const res = await fetch('/api/crew-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            crewMemberId: crewMember.id,
            date: dateStr,
            status: nextStatus,
          }),
        });
        const data = await res.json();
        if (data.success) {
          const created: CrewAvailability = data.data;
          const refreshed = new Map(availability);
          refreshed.delete(key);
          refreshed.set(availKey(created.crewMemberId, created.date), created);
          setAvailability(refreshed);
        }
      } catch {
        setAvailability(prevAvailability);
      }
    }
  };

  // ---- Render ----

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading crew board...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-500">
        <AlertCircle className="h-6 w-6 text-red-400" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week navigation header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-200">
          Crew Availability
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            className="flex h-8 w-8 items-center justify-center rounded border border-panel-border bg-surface-secondary text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[180px] text-center text-sm text-gray-400">
            {formatHeader(weekDates[0])} &ndash; {formatHeader(weekDates[4])}
          </span>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            className="flex h-8 w-8 items-center justify-center rounded border border-panel-border bg-surface-secondary text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-lg border border-panel-border bg-panel-bg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-panel-border bg-surface-secondary">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Crew
              </th>
              {weekDates.map((date, i) => (
                <th
                  key={dateStrings[i]}
                  className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  {formatHeader(date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {crew.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-gray-600"
                >
                  No crew members found. Add crew members first.
                </td>
              </tr>
            ) : (
              crew.map((member) => (
                <tr
                  key={member.id}
                  className={cn(
                    'border-b border-panel-border transition-colors hover:bg-surface-secondary/50',
                    !member.isActive && 'opacity-50'
                  )}
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="text-sm font-medium text-gray-200">
                      {member.name}
                    </div>
                    <div className="text-xs capitalize text-gray-500">
                      {member.role}
                    </div>
                  </td>
                  {dateStrings.map((dateStr) => {
                    const entry = availability.get(
                      availKey(member.id, dateStr)
                    );
                    return (
                      <td key={dateStr} className="px-2 py-2">
                        <CrewAvailabilityCell
                          status={entry?.status ?? null}
                          notes={entry?.notes ?? null}
                          onClick={() => handleCellClick(member, dateStr)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="font-medium text-gray-400">Legend:</span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-sky-500/30 border border-sky-500/50" />
          Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-red-500/30 border border-red-500/50" />
          OOO
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-gray-500/30 border border-gray-500/50" />
          Dark
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-amber-500/30 border border-amber-500/50" />
          Holding
        </span>
      </div>
    </div>
  );
}
