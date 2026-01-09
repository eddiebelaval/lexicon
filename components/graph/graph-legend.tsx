'use client';

/**
 * GraphLegend Component
 *
 * Visual legend showing entity types and their corresponding colors,
 * plus relationship line indicator for the knowledge graph.
 */

import React from 'react';
import type { EntityType } from '@/types';

const ENTITY_TYPES: { type: EntityType; label: string; color: string }[] = [
  { type: 'character', label: 'Character', color: '#8b5cf6' },
  { type: 'location', label: 'Location', color: '#10b981' },
  { type: 'event', label: 'Event', color: '#f59e0b' },
  { type: 'object', label: 'Object', color: '#ec4899' },
  { type: 'faction', label: 'Faction', color: '#06b6d4' },
];

export function GraphLegend() {
  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Legend</h3>

      {/* Entity Types */}
      <div className="space-y-2 mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Entity Types
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ENTITY_TYPES.map(({ type, label, color }) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-slate-700">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Relationship Indicator */}
      <div className="space-y-2 pt-3 border-t border-slate-200">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Relationships
        </p>
        <div className="flex items-center gap-3">
          <svg width="40" height="2" className="flex-shrink-0">
            <line
              x1="0"
              y1="1"
              x2="40"
              y2="1"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeOpacity="0.6"
            />
          </svg>
          <span className="text-sm text-slate-700">Connection</span>
        </div>
        <p className="text-xs text-slate-500 italic mt-2">
          Line thickness indicates relationship strength
        </p>
      </div>

      {/* Interaction Hints */}
      <div className="space-y-2 pt-3 border-t border-slate-200 mt-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Interactions
        </p>
        <ul className="space-y-1 text-xs text-slate-600">
          <li className="flex items-start gap-2">
            <span className="font-semibold text-slate-700">Click:</span>
            <span>Select entity</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-slate-700">Drag:</span>
            <span>Move entity</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-slate-700">Scroll:</span>
            <span>Zoom in/out</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-slate-700">Pan:</span>
            <span>Click & drag background</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
