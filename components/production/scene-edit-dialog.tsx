'use client';

/**
 * Scene Edit Dialog — Create or edit a production scene
 *
 * Modal form with fields for scene details, cast assignment,
 * and scheduling. Used from the calendar and dashboard views.
 */

import { useState, useEffect } from 'react';
import { X, Plus, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProdScene, ProdSceneStatus, Entity } from '@/types';

interface SceneEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (scene: ProdScene) => void;
  scene?: ProdScene | null;
  productionId: string;
  universeId: string;
}

const STATUS_OPTIONS: { value: ProdSceneStatus; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'shot', label: 'Shot' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'postponed', label: 'Postponed' },
  { value: 'self_shot', label: 'Self-Shot' },
];

export function SceneEditDialog({
  open,
  onClose,
  onSave,
  scene,
  productionId,
  universeId,
}: SceneEditDialogProps) {
  const isEditing = !!scene;

  // Form state
  const [sceneNumber, setSceneNumber] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [location, setLocation] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [status, setStatus] = useState<ProdSceneStatus>('scheduled');
  const [equipmentNotes, setEquipmentNotes] = useState('');
  const [isSelfShot, setIsSelfShot] = useState(false);
  const [castEntityIds, setCastEntityIds] = useState<string[]>([]);

  // Cast entity search
  const [castEntities, setCastEntities] = useState<Entity[]>([]);
  const [castSearch, setCastSearch] = useState('');
  const [showCastDropdown, setShowCastDropdown] = useState(false);

  // Submission state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (scene) {
      setSceneNumber(scene.sceneNumber || '');
      setTitle(scene.title);
      setDescription(scene.description || '');
      setScheduledDate(scene.scheduledDate || '');
      setScheduledTime(scene.scheduledTime || '');
      setLocation(scene.location || '');
      setLocationDetails(scene.locationDetails || '');
      setStatus(scene.status);
      setEquipmentNotes(scene.equipmentNotes || '');
      setIsSelfShot(scene.isSelfShot);
      setCastEntityIds(scene.castEntityIds || []);
    } else {
      // Reset for new scene
      setSceneNumber('');
      setTitle('');
      setDescription('');
      setScheduledDate('');
      setScheduledTime('');
      setLocation('');
      setLocationDetails('');
      setStatus('scheduled');
      setEquipmentNotes('');
      setIsSelfShot(false);
      setCastEntityIds([]);
    }
    setError(null);
  }, [scene, open]);

  // Fetch cast entities for assignment
  useEffect(() => {
    if (!open) return;

    async function fetchCast() {
      try {
        const res = await fetch(
          `/api/entities?universeId=${universeId}&type=character&limit=50`
        );
        const data = await res.json();
        if (data.success) {
          setCastEntities(data.data.entities || data.data.items || []);
        }
      } catch {
        // Silent — cast list is optional
      }
    }
    fetchCast();
  }, [universeId, open]);

  const filteredCast = castEntities.filter(
    (e) =>
      !castEntityIds.includes(e.id) &&
      e.name.toLowerCase().includes(castSearch.toLowerCase())
  );

  function addCastMember(entityId: string) {
    setCastEntityIds((prev) => [...prev, entityId]);
    setCastSearch('');
    setShowCastDropdown(false);
  }

  function removeCastMember(entityId: string) {
    setCastEntityIds((prev) => prev.filter((id) => id !== entityId));
  }

  function getCastName(entityId: string): string {
    const entity = castEntities.find((e) => e.id === entityId);
    return entity?.name || entityId;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const body = {
        productionId,
        sceneNumber: sceneNumber || undefined,
        title: title.trim(),
        description: description || undefined,
        castEntityIds,
        scheduledDate: scheduledDate || undefined,
        scheduledTime: scheduledTime || undefined,
        location: location || undefined,
        locationDetails: locationDetails || undefined,
        status,
        equipmentNotes: equipmentNotes || undefined,
        isSelfShot,
      };

      const url = isEditing
        ? `/api/scenes/${scene.id}`
        : '/api/scenes';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to save scene');
      }

      onSave(data.data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save scene');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-surface-secondary border border-panel-border rounded-lg shadow-glass">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-surface-secondary border-b border-panel-border">
          <h2 className="text-lg font-medium text-gray-100">
            {isEditing ? 'Edit Scene' : 'New Scene'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-5">
          {error && (
            <div className="px-4 py-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-md">
              {error}
            </div>
          )}

          {/* Scene Number + Title */}
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Scene #
              </label>
              <input
                type="text"
                value={sceneNumber}
                onChange={(e) => setSceneNumber(e.target.value)}
                placeholder="D7-001"
                className="w-full px-3 py-2 bg-surface-tertiary border border-panel-border rounded-md text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-vhs-400/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Chantel apartment move-in"
                required
                className="w-full px-3 py-2 bg-surface-tertiary border border-panel-border rounded-md text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-vhs-400/50"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What happens in this scene..."
              className="w-full px-3 py-2 bg-surface-tertiary border border-panel-border rounded-md text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-vhs-400/50 resize-none"
            />
          </div>

          {/* Date + Time + Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 bg-surface-tertiary border border-panel-border rounded-md text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-vhs-400/50 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Time
              </label>
              <input
                type="text"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="10:00"
                className="w-full px-3 py-2 bg-surface-tertiary border border-panel-border rounded-md text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-vhs-400/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProdSceneStatus)}
                className="w-full px-3 py-2 bg-surface-tertiary border border-panel-border rounded-md text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-vhs-400/50"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Atlanta, GA"
                className="w-full px-3 py-2 bg-surface-tertiary border border-panel-border rounded-md text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-vhs-400/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Location Details
              </label>
              <input
                type="text"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                placeholder="Chantel residence - midtown apartment"
                className="w-full px-3 py-2 bg-surface-tertiary border border-panel-border rounded-md text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-vhs-400/50"
              />
            </div>
          </div>

          {/* Cast Assignment */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Cast
            </label>

            {/* Selected cast chips */}
            {castEntityIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {castEntityIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-graph-character/20 text-purple-300 rounded-full"
                  >
                    {getCastName(id)}
                    <button
                      type="button"
                      onClick={() => removeCastMember(id)}
                      className="hover:text-red-400 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Cast search input */}
            <div className="relative">
              <input
                type="text"
                value={castSearch}
                onChange={(e) => {
                  setCastSearch(e.target.value);
                  setShowCastDropdown(true);
                }}
                onFocus={() => setShowCastDropdown(true)}
                placeholder="Search cast to add..."
                className="w-full px-3 py-2 bg-surface-tertiary border border-panel-border rounded-md text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-vhs-400/50"
              />

              {showCastDropdown && filteredCast.length > 0 && (
                <div className="absolute z-20 w-full mt-1 max-h-40 overflow-y-auto bg-surface-elevated border border-panel-border rounded-md shadow-glass">
                  {filteredCast.slice(0, 10).map((entity) => (
                    <button
                      key={entity.id}
                      type="button"
                      onClick={() => addCastMember(entity.id)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-sidebar-hover transition-colors text-left"
                    >
                      <Plus className="h-3 w-3 text-gray-500" />
                      {entity.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Equipment Notes + Self-Shot */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Equipment Notes
            </label>
            <input
              type="text"
              value={equipmentNotes}
              onChange={(e) => setEquipmentNotes(e.target.value)}
              placeholder="Two-camera setup for dinner table"
              className="w-full px-3 py-2 bg-surface-tertiary border border-panel-border rounded-md text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-vhs-400/50"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={cn(
                'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                isSelfShot
                  ? 'bg-vhs-400 border-vhs-400'
                  : 'bg-surface-tertiary border-panel-border'
              )}
              onClick={() => setIsSelfShot(!isSelfShot)}
            >
              {isSelfShot && <Video className="h-3 w-3 text-white" />}
            </div>
            <input
              type="checkbox"
              checked={isSelfShot}
              onChange={(e) => setIsSelfShot(e.target.checked)}
              className="sr-only"
            />
            <span className="text-sm text-gray-300">Self-shot scene</span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-panel-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={cn(
                'px-5 py-2 text-sm font-medium rounded-md transition-colors',
                saving
                  ? 'bg-vhs-400/50 text-gray-300 cursor-not-allowed'
                  : 'bg-vhs-400 text-white hover:bg-vhs-500'
              )}
            >
              {saving ? 'Saving...' : isEditing ? 'Update Scene' : 'Create Scene'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
