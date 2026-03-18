/**
 * Utility Functions
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Slugify a string for URL-safe identifiers
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Get entity type color class
 */
export function getEntityColor(type: string): string {
  const colors: Record<string, string> = {
    character: 'bg-graph-character',
    location: 'bg-graph-location',
    event: 'bg-graph-event',
    object: 'bg-graph-object',
    faction: 'bg-graph-faction',
  };
  return colors[type] || 'bg-gray-500';
}

/**
 * Get entity type text color class
 */
export function getEntityTextColor(type: string): string {
  const colors: Record<string, string> = {
    character: 'text-graph-character',
    location: 'text-graph-location',
    event: 'text-graph-event',
    object: 'text-graph-object',
    faction: 'text-graph-faction',
  };
  return colors[type] || 'text-gray-500';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Hours elapsed since a given ISO date string
 */
export function hoursSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
}

/**
 * Format hours into a relative display string (e.g., "Just now", "3h", "2d")
 */
export function formatRelativeHours(hours: number): string {
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
