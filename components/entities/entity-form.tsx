'use client';

import { useState, useCallback, KeyboardEvent } from 'react';
import { cn, capitalize } from '@/lib/utils';
import { X, Plus, Loader2 } from 'lucide-react';
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
import type { Entity, EntityType, EntityStatus } from '@/types';

const entityTypes: EntityType[] = [
  'character',
  'location',
  'event',
  'object',
  'faction',
];

const entityStatuses: EntityStatus[] = ['active', 'inactive', 'deceased'];

interface EntityFormProps {
  universeId: string;
  entity?: Entity; // If provided, we're in edit mode
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (entity: Entity) => void;
}

interface FormState {
  type: EntityType;
  name: string;
  aliases: string[];
  description: string;
  status: EntityStatus;
  imageUrl: string;
}

interface FormErrors {
  type?: string;
  name?: string;
  aliases?: string;
  description?: string;
  status?: string;
  imageUrl?: string;
  submit?: string;
}

export function EntityForm({
  universeId,
  entity,
  open,
  onOpenChange,
  onSuccess,
}: EntityFormProps) {
  const isEditMode = !!entity;

  const [form, setForm] = useState<FormState>(() => ({
    type: entity?.type || 'character',
    name: entity?.name || '',
    aliases: entity?.aliases || [],
    description: entity?.description || '',
    status: entity?.status || 'active',
    imageUrl: entity?.imageUrl || '',
  }));

  const [aliasInput, setAliasInput] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Reset form when dialog opens/closes or entity changes
  const resetForm = useCallback(() => {
    setForm({
      type: entity?.type || 'character',
      name: entity?.name || '',
      aliases: entity?.aliases || [],
      description: entity?.description || '',
      status: entity?.status || 'active',
      imageUrl: entity?.imageUrl || '',
    });
    setAliasInput('');
    setErrors({});
    setSubmitting(false);
  }, [entity]);

  // Handle alias tag input
  const addAlias = useCallback(() => {
    const trimmed = aliasInput.trim();
    if (
      trimmed &&
      !form.aliases.includes(trimmed) &&
      form.aliases.length < 20
    ) {
      setForm((prev) => ({
        ...prev,
        aliases: [...prev.aliases, trimmed],
      }));
      setAliasInput('');
    }
  }, [aliasInput, form.aliases]);

  const removeAlias = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      aliases: prev.aliases.filter((_, i) => i !== index),
    }));
  }, []);

  const handleAliasKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAlias();
    } else if (e.key === 'Backspace' && !aliasInput && form.aliases.length > 0) {
      // Remove last alias on backspace when input is empty
      removeAlias(form.aliases.length - 1);
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (form.name.length > 200) {
      newErrors.name = 'Name must be 200 characters or less';
    }

    if (!form.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (form.description.length > 5000) {
      newErrors.description = 'Description must be 5000 characters or less';
    }

    if (form.imageUrl && !isValidUrl(form.imageUrl)) {
      newErrors.imageUrl = 'Invalid URL format';
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
        ...form,
        universeId,
        imageUrl: form.imageUrl || undefined,
      };

      const url = isEditMode ? `/api/entities/${entity.id}` : '/api/entities';
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
          submit: data.error?.message || 'Failed to save entity',
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Entity' : 'Create Entity'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the details of this entity in your universe.'
              : 'Add a new entity to your story universe.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Entity Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={form.type}
              onValueChange={(value: EntityType) =>
                setForm((prev) => ({ ...prev, type: value }))
              }
              disabled={isEditMode}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {entityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {capitalize(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEditMode && (
              <p className="text-xs text-muted-foreground">
                Type cannot be changed after creation
              </p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., d'Artagnan"
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Aliases - Tag Style */}
          <div className="space-y-2">
            <Label>Aliases</Label>
            <div
              className={cn(
                'flex flex-wrap gap-1.5 p-2 min-h-[42px] rounded-md border border-input bg-background',
                'focus-within:ring-2 focus-within:ring-lexicon-500 focus-within:ring-offset-2'
              )}
            >
              {form.aliases.map((alias, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 bg-lexicon-100 text-lexicon-800 px-2 py-0.5 rounded-full text-sm"
                >
                  {alias}
                  <button
                    type="button"
                    onClick={() => removeAlias(idx)}
                    className="hover:text-lexicon-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                onKeyDown={handleAliasKeyDown}
                onBlur={addAlias}
                placeholder={
                  form.aliases.length === 0 ? "Type and press Enter" : ""
                }
                className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
              />
              {aliasInput && (
                <button
                  type="button"
                  onClick={addAlias}
                  className="text-lexicon-600 hover:text-lexicon-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Press Enter or click + to add. {20 - form.aliases.length} remaining.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe this entity..."
              rows={4}
              className={cn(errors.description && 'border-destructive')}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {errors.description ? (
                <span className="text-destructive">{errors.description}</span>
              ) : (
                <span>&nbsp;</span>
              )}
              <span>{form.description.length}/5000</span>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value: EntityStatus) =>
                setForm((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {entityStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {capitalize(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              type="url"
              value={form.imageUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, imageUrl: e.target.value }))
              }
              placeholder="https://example.com/image.jpg"
              className={cn(errors.imageUrl && 'border-destructive')}
            />
            {errors.imageUrl && (
              <p className="text-xs text-destructive">{errors.imageUrl}</p>
            )}
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
              'Create Entity'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}
