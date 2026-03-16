'use client';

/**
 * Calendar Day Cell — Single day in the production calendar grid
 *
 * Shows day number at top with scene chips stacked below.
 * Caps visible scenes at 3, with a "+N more" overflow indicator.
 */

import { cn } from '@/lib/utils';
import { SceneCard } from '@/components/production/scene-card';
import type { ProdScene } from '@/types/production';

interface CalendarDayCellProps {
  date: Date;
  scenes: ProdScene[];
  isToday: boolean;
  onSceneClick: (scene: ProdScene) => void;
}

const MAX_VISIBLE_SCENES = 3;

export function CalendarDayCell({
  date,
  scenes,
  isToday,
  onSceneClick,
}: CalendarDayCellProps) {
  const dayNumber = date.getDate();
  const hasScenes = scenes.length > 0;
  const visibleScenes = scenes.slice(0, MAX_VISIBLE_SCENES);
  const overflowCount = scenes.length - MAX_VISIBLE_SCENES;

  return (
    <div
      className={cn(
        'min-h-[100px] border border-panel-border rounded p-1.5 transition-colors',
        hasScenes ? 'bg-surface-secondary' : 'bg-surface-primary',
        isToday && 'ring-1 ring-vhs-400'
      )}
    >
      {/* Day number */}
      <div
        className={cn(
          'text-xs font-medium mb-1',
          isToday ? 'text-vhs-400' : 'text-gray-500'
        )}
      >
        {dayNumber}
      </div>

      {/* Scene chips */}
      <div className="flex flex-col gap-0.5">
        {visibleScenes.map((scene) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            compact
            onClick={() => onSceneClick(scene)}
          />
        ))}
        {overflowCount > 0 && (
          <span className="text-[10px] text-gray-500 pl-2">
            +{overflowCount} more
          </span>
        )}
      </div>
    </div>
  );
}
