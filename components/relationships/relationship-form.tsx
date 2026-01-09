'use client';

import { useState, useCallback, useEffect } from 'react';
import { cn, capitalize } from '@/lib/utils';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EntityTypeBadge } from '@/components/entities/entity-type-badge';
import type {
  RelationshipWithEntities,
  RelationshipType,
  Entity,
} from '@/types';

const relationshipTypes: RelationshipType[] = [
  'knows',
  'loves',
  'opposes',
  'works_for',
  'family_of',
  'located_at',
  'participated_in',
  'possesses',
  'member_of',
];

const strengthLevels: { value: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { value: 1, label: '1 - Very Weak' },
  { value: 2, label: '2 - Weak' },
  { value: 3, label: '3 - Moderate' },
  { value: 4, label: '4 - Strong' },
  { value: 5, label: '5 - Very Strong' },
];

interface RelationshipFormProps {
  universeId: string;
  relationship?: RelationshipWithEntities; // If provided, we're in edit mode
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (relationship: RelationshipWithEntities) => void;
  // Pre-selected entities (for creating from entity detail view)
  initialSourceEntity?: Entity;
  initialTargetEntity?: Entity;
}

interface FormState {
  type: RelationshipType;
  sourceId: string;
  targetId: string;
  context: string;
  strength: 1 | 2 | 3 | 4 | 5;
  startDate: string;
  endDate: string;
  ongoing: boolean;
}

interface FormErrors {
  type?: string;
  sourceId?: string;
  targetId?: string;
  context?: string;
  strength?: string;
  startDate?: string;
  endDate?: string;
  submit?: string;
}

export function RelationshipForm({
  universeId,
  relationship,
  open,
  onOpenChange,
  onSuccess,
  initialSourceEntity,
  initialTargetEntity,
}: RelationshipFormProps) {
  const isEditMode = !!relationship;

  const [form, setForm] = useState<FormState>(() => ({
    type: relationship?.type || 'knows',
    sourceId: relationship?.sourceId || initialSourceEntity?.id || '',
    targetId: relationship?.targetId || initialTargetEntity?.id || '',
    context: relationship?.context || '',
    strength: relationship?.strength || 3,
    startDate: relationship?.startDate || '',
    endDate: relationship?.endDate || '',
    ongoing: relationship?.ongoing ?? true,
  }));

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Entity search state
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(true);
  const [sourceSearch, setSourceSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');

  // Selected entities for display
  const [selectedSource, setSelectedSource] = useState<Entity | null>(
    relationship?.source || initialSourceEntity || null
  );
  const [selectedTarget, setSelectedTarget] = useState<Entity | null>(
    relationship?.target || initialTargetEntity || null
  );

  // Load entities for selectors
  useEffect(() => {
    async function loadEntities() {
      setLoadingEntities(true);
      try {
        const response = await fetch(
          `/api/entities?universeId=${universeId}&limit=100`
        );
        const data = await response.json();
        if (data.success) {
          setEntities(data.data.items || data.data);
        }
      } catch (err) {
        console.error('Failed to load entities:', err);
      } finally {
        setLoadingEntities(false);
      }
    }

    if (open) {
      loadEntities();
    }
  }, [universeId, open]);

  // Reset form when dialog opens/closes or relationship changes
  const resetForm = useCallback(() => {
    setForm({
      type: relationship?.type || 'knows',
      sourceId: relationship?.sourceId || initialSourceEntity?.id || '',
      targetId: relationship?.targetId || initialTargetEntity?.id || '',
      context: relationship?.context || '',
      strength: relationship?.strength || 3,
      startDate: relationship?.startDate || '',
      endDate: relationship?.endDate || '',
      ongoing: relationship?.ongoing ?? true,
    });
    setSelectedSource(relationship?.source || initialSourceEntity || null);
    setSelectedTarget(relationship?.target || initialTargetEntity || null);
    setSourceSearch('');
    setTargetSearch('');
    setErrors({});
    setSubmitting(false);
  }, [relationship, initialSourceEntity, initialTargetEntity]);

  // Filter entities for source selector
  const filteredSourceEntities = entities.filter(
    (e) =>
      e.id !== form.targetId &&
      (sourceSearch === '' ||
        e.name.toLowerCase().includes(sourceSearch.toLowerCase()) ||
        e.aliases.some((a) =>
          a.toLowerCase().includes(sourceSearch.toLowerCase())
        ))
  );

  // Filter entities for target selector
  const filteredTargetEntities = entities.filter(
    (e) =>
      e.id !== form.sourceId &&
      (targetSearch === '' ||
        e.name.toLowerCase().includes(targetSearch.toLowerCase()) ||
        e.aliases.some((a) =>
          a.toLowerCase().includes(targetSearch.toLowerCase())
        ))
  );

  // Select entity handlers
  const handleSelectSource = (entity: Entity) => {
    setForm((prev) => ({ ...prev, sourceId: entity.id }));
    setSelectedSource(entity);
    setSourceSearch('');
  };

  const handleSelectTarget = (entity: Entity) => {
    setForm((prev) => ({ ...prev, targetId: entity.id }));
    setSelectedTarget(entity);
    setTargetSearch('');
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.sourceId) {
      newErrors.sourceId = 'Source entity is required';
    }

    if (!form.targetId) {
      newErrors.targetId = 'Target entity is required';
    }

    if (form.sourceId && form.targetId && form.sourceId === form.targetId) {
      newErrors.targetId = 'Source and target cannot be the same entity';
    }

    if (form.context.length > 2000) {
      newErrors.context = 'Context must be 2000 characters or less';
    }

    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const payload = {
        type: form.type,
        sourceId: form.sourceId,
        targetId: form.targetId,
        context: form.context || undefined,
        strength: form.strength,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        ongoing: form.ongoing,
      };

      const url = isEditMode
        ? `/api/relationships/${relationship.id}`
        : '/api/relationships';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess(data.data);
        onOpenChange(false);
        resetForm();
      } else {
        setErrors({
          submit: data.error?.message || 'Failed to save relationship',
        });
      }
    } catch {
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetForm();
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Relationship' : 'Create Relationship'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the details of this relationship.'
              : 'Create a new relationship between two entities.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source Entity Selector */}
          <div className="space-y-2">
            <Label>Source Entity</Label>
            {selectedSource && !isEditMode ? (
              <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <EntityTypeBadge type={selectedSource.type} size="sm" />
                  <span className="font-medium">{selectedSource.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedSource(null);
                    setForm((prev) => ({ ...prev, sourceId: '' }));
                  }}
                >
                  Change
                </Button>
              </div>
            ) : isEditMode ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <EntityTypeBadge type={relationship.source.type} size="sm" />
                <span className="font-medium">{relationship.source.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  (Cannot change source)
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search entities..."
                    value={sourceSearch}
                    onChange={(e) => setSourceSearch(e.target.value)}
                    className={cn('pl-8', errors.sourceId && 'border-destructive')}
                  />
                </div>
                <div className="max-h-[150px] overflow-y-auto border rounded-md">
                  {loadingEntities ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Loading...
                    </div>
                  ) : filteredSourceEntities.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No entities found
                    </div>
                  ) : (
                    filteredSourceEntities.slice(0, 10).map((entity) => (
                      <button
                        key={entity.id}
                        type="button"
                        onClick={() => handleSelectSource(entity)}
                        className="w-full flex items-center gap-2 p-2 hover:bg-muted text-left"
                      >
                        <EntityTypeBadge type={entity.type} size="sm" />
                        <span className="text-sm">{entity.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
            {errors.sourceId && (
              <p className="text-xs text-destructive">{errors.sourceId}</p>
            )}
          </div>

          {/* Relationship Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Relationship Type</Label>
            <Select
              value={form.type}
              onValueChange={(value: RelationshipType) =>
                setForm((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {capitalize(type.replace('_', ' '))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Entity Selector */}
          <div className="space-y-2">
            <Label>Target Entity</Label>
            {selectedTarget && !isEditMode ? (
              <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <EntityTypeBadge type={selectedTarget.type} size="sm" />
                  <span className="font-medium">{selectedTarget.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTarget(null);
                    setForm((prev) => ({ ...prev, targetId: '' }));
                  }}
                >
                  Change
                </Button>
              </div>
            ) : isEditMode ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <EntityTypeBadge type={relationship.target.type} size="sm" />
                <span className="font-medium">{relationship.target.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  (Cannot change target)
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search entities..."
                    value={targetSearch}
                    onChange={(e) => setTargetSearch(e.target.value)}
                    className={cn('pl-8', errors.targetId && 'border-destructive')}
                  />
                </div>
                <div className="max-h-[150px] overflow-y-auto border rounded-md">
                  {loadingEntities ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Loading...
                    </div>
                  ) : filteredTargetEntities.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No entities found
                    </div>
                  ) : (
                    filteredTargetEntities.slice(0, 10).map((entity) => (
                      <button
                        key={entity.id}
                        type="button"
                        onClick={() => handleSelectTarget(entity)}
                        className="w-full flex items-center gap-2 p-2 hover:bg-muted text-left"
                      >
                        <EntityTypeBadge type={entity.type} size="sm" />
                        <span className="text-sm">{entity.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
            {errors.targetId && (
              <p className="text-xs text-destructive">{errors.targetId}</p>
            )}
          </div>

          {/* Context/Description */}
          <div className="space-y-2">
            <Label htmlFor="context">Context (optional)</Label>
            <Textarea
              id="context"
              value={form.context}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, context: e.target.value }))
              }
              placeholder="Describe this relationship..."
              rows={3}
              className={cn(errors.context && 'border-destructive')}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {errors.context ? (
                <span className="text-destructive">{errors.context}</span>
              ) : (
                <span>&nbsp;</span>
              )}
              <span>{form.context.length}/2000</span>
            </div>
          </div>

          {/* Strength */}
          <div className="space-y-2">
            <Label htmlFor="strength">Strength</Label>
            <Select
              value={form.strength.toString()}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  strength: parseInt(value) as 1 | 2 | 3 | 4 | 5,
                }))
              }
            >
              <SelectTrigger id="strength">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {strengthLevels.map(({ value, label }) => (
                  <SelectItem key={value} value={value.toString()}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How strong or significant is this relationship?
            </p>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date (optional)</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className={cn(errors.startDate && 'border-destructive')}
              />
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className={cn(errors.endDate && 'border-destructive')}
                disabled={form.ongoing}
              />
              {errors.endDate && (
                <p className="text-xs text-destructive">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Ongoing Toggle */}
          <div className="flex items-center gap-2">
            <input
              id="ongoing"
              type="checkbox"
              checked={form.ongoing}
              onChange={(e) => {
                const ongoing = e.target.checked;
                setForm((prev) => ({
                  ...prev,
                  ongoing,
                  endDate: ongoing ? '' : prev.endDate,
                }));
              }}
              className="h-4 w-4 rounded border-gray-300 text-lexicon-600 focus:ring-lexicon-500"
            />
            <Label htmlFor="ongoing" className="text-sm font-normal cursor-pointer">
              Relationship is ongoing
            </Label>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {errors.submit}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="lexicon"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditMode ? 'Saving...' : 'Creating...'}
              </>
            ) : isEditMode ? (
              'Save Changes'
            ) : (
              'Create Relationship'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
