'use client';

import React from 'react';
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type ImportStatus = 'idle' | 'importing' | 'complete' | 'error';

export interface ImportProgressProps {
  total: number;
  completed: number;
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
  status: ImportStatus;
}

export function ImportProgress({
  total,
  completed,
  created,
  skipped,
  errors,
  status,
}: ImportProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const hasErrors = errors.length > 0;

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="flex items-center gap-3">
        {status === 'idle' && (
          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
        )}
        {status === 'importing' && (
          <Loader2 className="h-5 w-5 animate-spin text-lexicon-600" />
        )}
        {status === 'complete' && !hasErrors && (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        )}
        {status === 'complete' && hasErrors && (
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
        )}
        {status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}

        <div className="flex-1">
          <p className="text-sm font-medium">
            {status === 'idle' && 'Ready to import'}
            {status === 'importing' && `Importing entities... ${percentage}%`}
            {status === 'complete' && !hasErrors && 'Import complete!'}
            {status === 'complete' && hasErrors && 'Import completed with warnings'}
            {status === 'error' && 'Import failed'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {(status === 'importing' || status === 'complete' || status === 'error') && (
        <Progress
          value={percentage}
          className={cn(
            'h-2',
            status === 'complete' && !hasErrors && '[&>div]:bg-green-500',
            status === 'complete' && hasErrors && '[&>div]:bg-yellow-500',
            status === 'error' && '[&>div]:bg-red-500'
          )}
        />
      )}

      {/* Statistics */}
      {(status === 'importing' || status === 'complete') && (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {created}
            </p>
            <p className="text-xs text-green-600/70 dark:text-green-400/70">
              Created
            </p>
          </div>
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/30 p-3">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {skipped}
            </p>
            <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70">
              Skipped
            </p>
          </div>
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {errors.length}
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">
              Errors
            </p>
          </div>
        </div>
      )}

      {/* Error List */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3">
          <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
            Import Errors ({errors.length})
          </p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {errors.slice(0, 10).map((error, idx) => (
              <p
                key={idx}
                className="text-xs text-red-600 dark:text-red-400"
              >
                <span className="font-medium">Row {error.row}:</span>{' '}
                {error.message}
              </p>
            ))}
            {errors.length > 10 && (
              <p className="text-xs text-red-500 italic">
                ...and {errors.length - 10} more errors
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
