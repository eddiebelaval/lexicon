'use client';

/**
 * Step 4: Asset Types Configuration
 *
 * Shows default asset types (Contract, Shoot, Deliverable) as expandable cards.
 * Users can toggle, rename stages, add/remove stages, and add custom types.
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileCheck,
  Video,
  Package,
  Plus,
  X,
  GripVertical,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssetTypeDraft, LifecycleStageDraft } from './intake-types';

interface AssetTypesStepProps {
  assetTypes: AssetTypeDraft[];
  onChange: (types: AssetTypeDraft[]) => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  FileCheck,
  Video,
  Package,
};

const STAGE_COLOR_PRESETS = [
  { name: 'Gray', value: '#6b7280' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Cyan', value: '#06b6d4' },
];

function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AssetTypesStep({ assetTypes, onChange }: AssetTypesStepProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function toggleEnabled(tempId: string) {
    onChange(
      assetTypes.map((t) =>
        t.tempId === tempId ? { ...t, enabled: !t.enabled } : t
      )
    );
  }

  function updateStageName(typeTempId: string, stageTempId: string, name: string) {
    onChange(
      assetTypes.map((t) =>
        t.tempId === typeTempId
          ? {
              ...t,
              stages: t.stages.map((s) =>
                s.tempId === stageTempId ? { ...s, name } : s
              ),
            }
          : t
      )
    );
  }

  function updateStageColor(typeTempId: string, stageTempId: string, color: string) {
    onChange(
      assetTypes.map((t) =>
        t.tempId === typeTempId
          ? {
              ...t,
              stages: t.stages.map((s) =>
                s.tempId === stageTempId ? { ...s, color } : s
              ),
            }
          : t
      )
    );
  }

  function removeStage(typeTempId: string, stageTempId: string) {
    onChange(
      assetTypes.map((t) => {
        if (t.tempId !== typeTempId) return t;
        const filtered = t.stages.filter((s) => s.tempId !== stageTempId);
        // If we removed the initial stage, make the first remaining one initial
        if (filtered.length > 0 && !filtered.some((s) => s.isInitial)) {
          filtered[0] = { ...filtered[0], isInitial: true };
        }
        // If we removed the terminal stage, make the last remaining one terminal
        if (filtered.length > 0 && !filtered.some((s) => s.isTerminal)) {
          filtered[filtered.length - 1] = {
            ...filtered[filtered.length - 1],
            isTerminal: true,
          };
        }
        return { ...t, stages: filtered };
      })
    );
  }

  function addStage(typeTempId: string) {
    onChange(
      assetTypes.map((t) => {
        if (t.tempId !== typeTempId) return t;
        const newStage: LifecycleStageDraft = {
          tempId: generateTempId(),
          name: 'New Stage',
          color: '#6b7280',
          isInitial: false,
          isTerminal: false,
        };
        return { ...t, stages: [...t.stages, newStage] };
      })
    );
  }

  function addCustomAssetType() {
    const newType: AssetTypeDraft = {
      tempId: generateTempId(),
      name: 'Custom Type',
      slug: 'custom-type',
      icon: 'Package',
      color: '#8b5cf6',
      enabled: true,
      stages: [
        {
          tempId: generateTempId(),
          name: 'Open',
          color: '#6b7280',
          isInitial: true,
          isTerminal: false,
        },
        {
          tempId: generateTempId(),
          name: 'In Progress',
          color: '#3b82f6',
          isInitial: false,
          isTerminal: false,
        },
        {
          tempId: generateTempId(),
          name: 'Done',
          color: '#22c55e',
          isInitial: false,
          isTerminal: true,
        },
      ],
    };
    onChange([...assetTypes, newType]);
    setExpandedId(newType.tempId);
  }

  function updateTypeName(tempId: string, name: string) {
    onChange(
      assetTypes.map((t) =>
        t.tempId === tempId
          ? { ...t, name, slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }
          : t
      )
    );
  }

  function removeType(tempId: string) {
    onChange(assetTypes.filter((t) => t.tempId !== tempId));
    if (expandedId === tempId) setExpandedId(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-medium text-gray-100">
          How do you track progress?
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Choose which assets to track and customize their lifecycle stages. You
          can change these later.
        </p>
      </div>

      {/* Asset type cards */}
      <div className="space-y-3">
        {assetTypes.map((assetType) => {
          const IconComponent = ICON_MAP[assetType.icon] || Package;
          const isExpanded = expandedId === assetType.tempId;
          const isDefault = assetType.tempId.startsWith('default-');

          return (
            <div
              key={assetType.tempId}
              className={cn(
                'border rounded-lg transition-colors',
                assetType.enabled
                  ? 'border-panel-border bg-surface-secondary'
                  : 'border-panel-border/50 bg-surface-primary opacity-60'
              )}
            >
              {/* Card header */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggleEnabled(assetType.tempId)}
                  className={cn(
                    'w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors',
                    assetType.enabled
                      ? 'bg-vhs-400 border-vhs-400'
                      : 'border-gray-600 bg-transparent'
                  )}
                  aria-label={`${assetType.enabled ? 'Disable' : 'Enable'} ${assetType.name}`}
                >
                  {assetType.enabled && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>

                {/* Icon + color dot */}
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: assetType.color }}
                />
                <IconComponent className="w-4 h-4 text-gray-400 shrink-0" />

                {/* Name (editable for custom types) */}
                {isDefault ? (
                  <span className="text-sm font-medium text-gray-200 flex-1">
                    {assetType.name}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={assetType.name}
                    onChange={(e) => updateTypeName(assetType.tempId, e.target.value)}
                    className="text-sm font-medium text-gray-200 flex-1 bg-transparent border-none outline-none focus:ring-0 p-0"
                  />
                )}

                {/* Stage count */}
                <span className="text-xs text-gray-600 shrink-0">
                  {assetType.stages.length} stages
                </span>

                {/* Remove button (custom types only) */}
                {!isDefault && (
                  <button
                    type="button"
                    onClick={() => removeType(assetType.tempId)}
                    className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
                    aria-label={`Remove ${assetType.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Expand/collapse */}
                <button
                  type="button"
                  onClick={() => toggleExpand(assetType.tempId)}
                  className="text-gray-500 hover:text-gray-300 transition-colors shrink-0"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Expanded: lifecycle stages */}
              {isExpanded && (
                <div className="border-t border-panel-border px-4 py-3 space-y-2">
                  <p className="text-xs text-gray-600 mb-2">
                    Lifecycle stages (in order)
                  </p>

                  {assetType.stages.map((stage, stageIdx) => (
                    <StageRow
                      key={stage.tempId}
                      stage={stage}
                      stageIndex={stageIdx}
                      canRemove={assetType.stages.length > 1}
                      onNameChange={(name) =>
                        updateStageName(assetType.tempId, stage.tempId, name)
                      }
                      onColorChange={(color) =>
                        updateStageColor(assetType.tempId, stage.tempId, color)
                      }
                      onRemove={() =>
                        removeStage(assetType.tempId, stage.tempId)
                      }
                    />
                  ))}

                  {/* Add stage button */}
                  <button
                    type="button"
                    onClick={() => addStage(assetType.tempId)}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-vhs-400 transition-colors mt-2 py-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add stage
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add custom type button */}
      <button
        type="button"
        onClick={addCustomAssetType}
        className="flex items-center gap-2 w-full px-4 py-3 border border-dashed border-panel-border rounded-lg text-sm text-gray-500 hover:text-vhs-400 hover:border-vhs-400/30 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Custom Asset Type
      </button>
    </div>
  );
}

/**
 * Individual stage row with inline editing, color picker, and badges.
 */
function StageRow({
  stage,
  stageIndex,
  canRemove,
  onNameChange,
  onColorChange,
  onRemove,
}: {
  stage: LifecycleStageDraft;
  stageIndex: number;
  canRemove: boolean;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
  onRemove: () => void;
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div className="flex items-center gap-2 group">
      {/* Order number */}
      <div className="flex items-center gap-1 shrink-0">
        <GripVertical className="w-3 h-3 text-gray-700" />
        <span className="text-xs text-gray-600 w-4 text-right">
          {stageIndex + 1}
        </span>
      </div>

      {/* Color dot (clickable) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowColorPicker((prev) => !prev)}
          className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/10 hover:ring-white/30 transition-all"
          style={{ backgroundColor: stage.color }}
          aria-label="Change color"
        />

        {/* Color picker dropdown */}
        {showColorPicker && (
          <div className="absolute top-5 left-0 z-10 flex gap-1 p-2 bg-surface-elevated border border-panel-border rounded-md shadow-lg">
            {STAGE_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  onColorChange(preset.value);
                  setShowColorPicker(false);
                }}
                className={cn(
                  'w-5 h-5 rounded-full ring-1 transition-all',
                  stage.color === preset.value
                    ? 'ring-white ring-2'
                    : 'ring-white/10 hover:ring-white/40'
                )}
                style={{ backgroundColor: preset.value }}
                aria-label={preset.name}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stage name (inline editable) */}
      <input
        type="text"
        value={stage.name}
        onChange={(e) => onNameChange(e.target.value)}
        className="flex-1 text-sm text-gray-300 bg-transparent border-none outline-none focus:text-gray-100 p-0 min-w-0"
      />

      {/* Badges */}
      <div className="flex items-center gap-1 shrink-0">
        {stage.isInitial && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
            initial
          </span>
        )}
        {stage.isTerminal && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-medium">
            terminal
          </span>
        )}
      </div>

      {/* Remove button */}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
          aria-label={`Remove ${stage.name}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
