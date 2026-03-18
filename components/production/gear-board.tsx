'use client';

/**
 * Gear Board — Visual equipment tracking dashboard
 *
 * Shows all equipment assets grouped by lifecycle stage.
 * Each card shows: gear name, who has it, location, how long
 * they've had it, and whether it's overdue.
 *
 * Also displays footage assets in a separate section.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Camera, Film, Clock, User, MapPin, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssetView {
  id: string;
  name: string;
  stage: string;
  stageColor: string;
  owner: string;
  location: string;
  castMember: string;
  dueDate: string;
  hoursInStage: number;
  stageEnteredAt: string;
  isTerminalStage: boolean;
  isInitialStage: boolean;
}

interface StageGroup {
  name: string;
  color: string;
  assets: AssetView[];
}

interface GearBoardProps {
  productionId: string;
}

const OVERDUE_HOURS = 48;

function formatRelativeHours(hours: number): string {
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function GearBoard({ productionId }: GearBoardProps) {
  const [equipmentGroups, setEquipmentGroups] = useState<StageGroup[]>([]);
  const [footageGroups, setFootageGroups] = useState<StageGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'equipment' | 'footage'>('equipment');

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const typesRes = await fetch(`/api/asset-types?productionId=${productionId}`);
      if (!typesRes.ok) throw new Error('Failed to fetch asset types');
      const typesData = await typesRes.json() as { data: { items: Array<{ id: string; slug: string; name: string }> } };
      const assetTypes = typesData.data?.items || [];

      const equipmentType = assetTypes.find((t) => t.slug === 'equipment');
      const footageType = assetTypes.find((t) => t.slug === 'footage');

      const fetchStagesAndAssets = async (typeId: string): Promise<StageGroup[]> => {
        const [stagesRes, assetsRes] = await Promise.all([
          fetch(`/api/lifecycle-stages?assetTypeId=${typeId}`),
          fetch(`/api/assets?productionId=${productionId}&assetTypeId=${typeId}`),
        ]);

        if (!stagesRes.ok || !assetsRes.ok) throw new Error('Failed to fetch data');

        const stagesData = await stagesRes.json() as { data: Array<{ id: string; name: string; color: string; stage_order: number; is_initial: boolean; is_terminal: boolean }> };
        const assetsData = await assetsRes.json() as { data: { items: Array<{
          id: string; name: string; current_stage_id: string; owner_name: string | null;
          metadata: Record<string, unknown> | null; due_date: string | null; stage_entered_at: string;
        }> } };

        const stages = (stagesData.data || []).sort((a, b) => a.stage_order - b.stage_order);
        const assets = assetsData.data?.items || [];
        const now = Date.now();

        return stages.map((stage) => ({
          name: stage.name,
          color: stage.color,
          assets: assets
            .filter((a) => a.current_stage_id === stage.id)
            .map((a) => ({
              id: a.id,
              name: a.name,
              stage: stage.name,
              stageColor: stage.color,
              owner: a.owner_name || 'Unassigned',
              location: (a.metadata?.location as string) || '',
              castMember: (a.metadata?.castMember as string) || '',
              dueDate: a.due_date || '',
              hoursInStage: Math.round((now - new Date(a.stage_entered_at).getTime()) / (1000 * 60 * 60)),
              stageEnteredAt: a.stage_entered_at,
              isTerminalStage: stage.is_terminal,
              isInitialStage: stage.is_initial,
            })),
        }));
      };

      // Fetch equipment and footage in parallel
      const [eqGroups, ftGroups] = await Promise.all([
        equipmentType ? fetchStagesAndAssets(equipmentType.id) : Promise.resolve([]),
        footageType ? fetchStagesAndAssets(footageType.id) : Promise.resolve([]),
      ]);

      setEquipmentGroups(eqGroups);
      setFootageGroups(ftGroups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gear data');
    } finally {
      setLoading(false);
    }
  }, [productionId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const groups = activeTab === 'equipment' ? equipmentGroups : footageGroups;

  const { totalAssets, overdueAssets } = useMemo(() => {
    let total = 0;
    let overdue = 0;
    for (const g of groups) {
      total += g.assets.length;
      for (const a of g.assets) {
        if (a.hoursInStage > OVERDUE_HOURS && !a.isTerminalStage && !a.isInitialStage) {
          overdue++;
        }
      }
    }
    return { totalAssets: total, overdueAssets: overdue };
  }, [groups]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-gray-500">Loading gear board...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 text-sm">{error}</p>
        <button
          type="button"
          onClick={fetchAssets}
          className="mt-3 text-sm text-vhs-400 hover:text-vhs-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-surface-secondary rounded-lg p-1">
            <button
              type="button"
              onClick={() => setActiveTab('equipment')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                activeTab === 'equipment'
                  ? 'bg-surface-elevated text-gray-200'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <Camera className="w-3.5 h-3.5" />
              Equipment
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('footage')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                activeTab === 'footage'
                  ? 'bg-surface-elevated text-gray-200'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <Film className="w-3.5 h-3.5" />
              Footage
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{totalAssets} total</span>
            {overdueAssets > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                {overdueAssets} overdue
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={fetchAssets}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Stage columns */}
      {totalAssets === 0 ? (
        <div className="text-center py-16 border border-dashed border-panel-border rounded-xl">
          <Camera className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            No {activeTab} tracked yet. Tell Lexi to register gear via Telegram.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Example: &quot;Register Kit 3 — Ian is picking it up&quot;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {groups.map((group) => (
            <div key={group.name} className="space-y-2">
              {/* Stage header */}
              <div className="flex items-center gap-2 px-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: group.color }}
                />
                <span className="text-xs font-medium text-gray-400 truncate">
                  {group.name}
                </span>
                <span className="text-xs text-gray-600">
                  {group.assets.length}
                </span>
              </div>

              {/* Asset cards */}
              <div className="space-y-2">
                {group.assets.map((asset) => {
                  const isOverdue = asset.hoursInStage > OVERDUE_HOURS
                    && !asset.isTerminalStage
                    && !asset.isInitialStage;

                  return (
                    <div
                      key={asset.id}
                      className={cn(
                        'px-3 py-2.5 rounded-lg border transition-colors',
                        isOverdue
                          ? 'bg-amber-500/5 border-amber-500/20'
                          : 'bg-surface-secondary border-panel-border'
                      )}
                    >
                      <p className="text-sm font-medium text-gray-200 truncate">
                        {asset.name}
                      </p>

                      {asset.owner !== 'Unassigned' && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <User className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-400 truncate">{asset.owner}</span>
                        </div>
                      )}

                      {asset.location && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-400 truncate">{asset.location}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className={cn('w-3 h-3', isOverdue ? 'text-amber-400' : 'text-gray-600')} />
                        <span className={cn('text-xs', isOverdue ? 'text-amber-400' : 'text-gray-600')}>
                          {formatRelativeHours(asset.hoursInStage)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
