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
    <div className="p-4 bg-[#141414] border border-[#1f1f1f] rounded-lg">
      <h3 className="text-sm font-semibold text-white mb-3">Legend</h3>

      {/* Entity Types */}
      <div className="space-y-2 mb-4">
        <p className="text-xs font-medium text-[#888] uppercase tracking-wide">
          Entity Types
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ENTITY_TYPES.map(({ type, label, color }) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-[#ccc]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Relationship Indicator */}
      <div className="space-y-2 pt-3 border-t border-[#1f1f1f]">
        <p className="text-xs font-medium text-[#888] uppercase tracking-wide">
          Relationships
        </p>
        <div className="flex items-center gap-3">
          <svg width="40" height="2" className="flex-shrink-0">
            <line
              x1="0"
              y1="1"
              x2="40"
              y2="1"
              stroke="#666"
              strokeWidth="2"
              strokeOpacity="0.8"
            />
          </svg>
          <span className="text-sm text-[#ccc]">Connection</span>
        </div>
        <p className="text-xs text-[#666] italic mt-2">
          Line thickness indicates relationship strength
        </p>
      </div>

      {/* Interaction Hints */}
      <div className="space-y-2 pt-3 border-t border-[#1f1f1f] mt-3">
        <p className="text-xs font-medium text-[#888] uppercase tracking-wide">
          Interactions
        </p>
        <ul className="space-y-1 text-xs text-[#888]">
          <li className="flex items-start gap-2">
            <span className="font-semibold text-[#ccc]">Click:</span>
            <span>Select entity</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-[#ccc]">Drag:</span>
            <span>Move entity</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-[#ccc]">Scroll:</span>
            <span>Zoom in/out</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-[#ccc]">Pan:</span>
            <span>Click & drag background</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
