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
    <div className="flex flex-col gap-4 p-4 bg-[#141414] border border-[#1f1f1f] rounded-lg">
      {/* Zoom Controls */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white">Zoom</h3>
        <div className="flex gap-2">
          <button
            onClick={onZoomIn}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#ccc] bg-[#1f1f1f] hover:bg-[#252525] hover:text-white rounded-lg transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
            In
          </button>
          <button
            onClick={onZoomOut}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#ccc] bg-[#1f1f1f] hover:bg-[#252525] hover:text-white rounded-lg transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
            Out
          </button>
        </div>
        <button
          onClick={onResetZoom}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#ccc] bg-[#1f1f1f] hover:bg-[#252525] hover:text-white rounded-lg transition-colors"
          title="Reset zoom to fit view"
        >
          <Maximize2 className="w-4 h-4" />
          Fit to View
        </button>
      </div>

      {/* Entity Type Filters */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white">Show/Hide Types</h3>
        <div className="space-y-1.5">
          {ENTITY_TYPES.map(({ type, label, color }) => {
            const isVisible = !hiddenTypes.has(type);
            return (
              <label
                key={type}
                className="flex items-center gap-2 cursor-pointer hover:bg-[#1f1f1f] px-2 py-1.5 rounded-lg transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => onToggleType(type)}
                  className="w-4 h-4 rounded border-[#333] bg-[#1a1a1a] text-[#38bdf8] focus:ring-[#38bdf8] focus:ring-offset-0"
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-[#ccc]">{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Layout Controls */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white">Layout</h3>
        <button
          onClick={onRestartSimulation}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#0a0a0a] bg-[#38bdf8] hover:bg-[#5ccfff] rounded-lg transition-colors"
          title="Reset layout and restart physics simulation"
        >
          <RefreshCw className="w-4 h-4" />
          Reset Layout
        </button>
      </div>
    </div>
  );
}
