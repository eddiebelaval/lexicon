'use client';

/**
 * Scene Card — Compact chip or expanded detail view for a production scene
 *
 * Compact mode: scene number + title with colored left border (for calendar cells)
 * Expanded mode: full scene info — description, cast, location, time, equipment, status
 */

import { Video, MapPin, Clock, Users, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProdScene, ProdSceneStatus } from '@/types/production';

interface SceneCardProps {
  scene: ProdScene;
  compact?: boolean;
  onClick?: () => void;
}

const statusConfig: Record<
  ProdSceneStatus,
  { border: string; bg: string; text: string; label: string }
> = {
  scheduled: {
    border: 'border-l-sky-500',
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    label: 'Scheduled',
  },
  shot: {
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    label: 'Shot',
  },
  cancelled: {
    border: 'border-l-red-500',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    label: 'Cancelled',
  },
  postponed: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    label: 'Postponed',
  },
  self_shot: {
    border: 'border-l-violet-500',
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    label: 'Self Shot',
  },
};

export function SceneCard({ scene, compact = false, onClick }: SceneCardProps) {
  const config = statusConfig[scene.status];

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-full text-left rounded px-2 py-1 border-l-2 text-xs truncate transition-colors',
          'hover:bg-surface-elevated',
          config.border,
          config.bg
        )}
      >
        {scene.sceneNumber && (
          <span className="font-mono text-gray-500 mr-1">
            {scene.sceneNumber}
          </span>
        )}
        <span className="text-gray-300">{scene.title}</span>
        {scene.isSelfShot && (
          <Video className="inline-block ml-1 h-3 w-3 text-violet-400" />
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        'rounded-md border-l-4 p-4 bg-surface-secondary',
        config.border
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-gray-100 truncate">
            {scene.sceneNumber && (
              <span className="font-mono text-gray-500 mr-2">
                {scene.sceneNumber}
              </span>
            )}
            {scene.title}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {scene.isSelfShot && (
            <Video className="h-4 w-4 text-violet-400" />
          )}
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              config.bg,
              config.text
            )}
          >
            {config.label}
          </span>
        </div>
      </div>

      {/* Description */}
      {scene.description && (
        <p className="text-xs text-gray-400 mb-3 line-clamp-3">
          {scene.description}
        </p>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {scene.scheduledTime && (
          <div className="flex items-center gap-1.5 text-gray-400">
            <Clock className="h-3.5 w-3.5 text-gray-500" />
            {scene.scheduledTime}
          </div>
        )}
        {scene.location && (
          <div className="flex items-center gap-1.5 text-gray-400">
            <MapPin className="h-3.5 w-3.5 text-gray-500" />
            <span className="truncate">
              {scene.location}
              {scene.locationDetails && ` - ${scene.locationDetails}`}
            </span>
          </div>
        )}
        {scene.castEntityIds.length > 0 && (
          <div className="flex items-center gap-1.5 text-gray-400">
            <Users className="h-3.5 w-3.5 text-gray-500" />
            {scene.castEntityIds.length} cast member
            {scene.castEntityIds.length !== 1 ? 's' : ''}
          </div>
        )}
        {scene.equipmentNotes && (
          <div className="flex items-center gap-1.5 text-gray-400">
            <Wrench className="h-3.5 w-3.5 text-gray-500" />
            <span className="truncate">{scene.equipmentNotes}</span>
          </div>
        )}
      </div>
    </div>
  );
}
