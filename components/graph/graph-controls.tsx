'use client';

/**
 * GraphControls Component
 *
 * Control panel for the force-directed graph visualization.
 * Provides zoom controls, entity type filters, and layout reset.
 */

import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';
import type { EntityType } from '@/types';

interface GraphControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onRestartSimulation: () => void;
  hiddenTypes: Set<EntityType>;
  onToggleType: (type: EntityType) => void;
}

const ENTITY_TYPES: { type: EntityType; label: string; color: string }[] = [
  { type: 'character', label: 'Characters', color: '#8b5cf6' },
  { type: 'location', label: 'Locations', color: '#10b981' },
  { type: 'event', label: 'Events', color: '#f59e0b' },
  { type: 'object', label: 'Objects', color: '#ec4899' },
  { type: 'faction', label: 'Factions', color: '#06b6d4' },
];

export function GraphControls({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onRestartSimulation,
  hiddenTypes,
  onToggleType,
}: GraphControlsProps) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
      {/* Zoom Controls */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">Zoom</h3>
        <div className="flex gap-2">
          <button
            onClick={onZoomIn}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
            In
          </button>
          <button
            onClick={onZoomOut}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
            Out
          </button>
        </div>
        <button
          onClick={onResetZoom}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          title="Reset zoom to fit view"
        >
          <Maximize2 className="w-4 h-4" />
          Fit to View
        </button>
      </div>

      {/* Entity Type Filters */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">Show/Hide Types</h3>
        <div className="space-y-1.5">
          {ENTITY_TYPES.map(({ type, label, color }) => {
            const isVisible = !hiddenTypes.has(type);
            return (
              <label
                key={type}
                className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => onToggleType(type)}
                  className="w-4 h-4 rounded border-slate-300 text-lexicon-600 focus:ring-lexicon-500"
                />
                <div
                  className="w-3 h-3 rounded-full border border-white"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Layout Controls */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-700">Layout</h3>
        <button
          onClick={onRestartSimulation}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-lexicon-600 hover:bg-lexicon-700 rounded-md transition-colors"
          title="Reset layout and restart physics simulation"
        >
          <RefreshCw className="w-4 h-4" />
          Reset Layout
        </button>
      </div>
    </div>
  );
}
