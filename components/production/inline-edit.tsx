'use client';

/**
 * InlineEdit — Click to edit any field in place
 *
 * Shows display text normally. On click, becomes an input.
 * Saves on blur or Enter. Cancels on Escape. Supports text,
 * select, and date variants.
 */

import { useState, useRef, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineEditTextProps {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  type?: 'text' | 'date';
}

export function InlineEditText({
  value,
  onSave,
  placeholder = 'Click to edit',
  className,
  inputClassName,
  type = 'text',
}: InlineEditTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text') {
        inputRef.current.select();
      }
    }
  }, [editing, type]);

  const savingRef = useRef(false);

  async function handleSave() {
    if (savingRef.current) return; // Prevent double-save (Enter + blur race)
    if (draft === value) {
      setEditing(false);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch {
      setDraft(value); // Revert on error
      setEditing(false);
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }

  function handleCancel() {
    setDraft(value);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur(); // Single save path via onBlur
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  }

  if (editing) {
    return (
      <div className="inline-flex items-center gap-1">
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={saving}
          className={cn(
            'px-1.5 py-0.5 bg-surface-elevated border border-vhs-400/50 rounded text-sm text-gray-200 focus:outline-none',
            type === 'date' && '[color-scheme:dark]',
            inputClassName
          )}
        />
      </div>
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn(
        'group inline-flex items-center gap-1 cursor-pointer rounded px-1 -mx-1 hover:bg-surface-tertiary transition-colors',
        !value && 'text-gray-600 italic',
        className
      )}
      title="Click to edit"
    >
      {value || placeholder}
      <Pencil className="h-3 w-3 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
    </span>
  );
}

// ============================================
// Select variant
// ============================================

interface InlineEditSelectProps {
  value: string;
  options: { value: string; label: string }[];
  onSave: (value: string) => Promise<void> | void;
  className?: string;
}

export function InlineEditSelect({
  value,
  options,
  onSave,
  className,
}: InlineEditSelectProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (editing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [editing]);

  async function handleChange(newValue: string) {
    if (newValue === value) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(newValue);
      setEditing(false);
    } catch {
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  const currentLabel = options.find((o) => o.value === value)?.label || value;

  if (editing) {
    return (
      <select
        ref={selectRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setEditing(false)}
        disabled={saving}
        className="px-1.5 py-0.5 bg-surface-elevated border border-vhs-400/50 rounded text-sm text-gray-200 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn(
        'group inline-flex items-center gap-1 cursor-pointer rounded px-1 -mx-1 hover:bg-surface-tertiary transition-colors',
        className
      )}
      title="Click to edit"
    >
      {currentLabel}
      <Pencil className="h-3 w-3 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
    </span>
  );
}
