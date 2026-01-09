'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Download,
  X,
  AlertCircle,
  CheckCircle2,
  Users,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImportProgress, type ImportStatus } from './import-progress';
import {
  parseCSV,
  autoDetectStorylineColumnMappings,
  generateStorylineSampleCSV,
  type CSVParseResult,
} from '@/lib/import';
import {
  validateStorylineImportRows,
  type StorylineColumnMapping,
  type MappedStorylineRow,
} from '@/lib/validation/import';
import { cn } from '@/lib/utils';

type Step = 'upload' | 'mapping' | 'preview' | 'importing';

interface StorylineImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  universeId: string;
  onImportComplete?: (result: {
    created: number;
    skipped: number;
    errors: number;
    unmatchedCast: string[];
  }) => void;
}

const STORYLINE_FIELDS = [
  { key: 'title', label: 'Title', required: true },
  { key: 'synopsis', label: 'Synopsis', required: false },
  { key: 'narrative', label: 'Narrative', required: false },
  { key: 'primaryCastNames', label: 'Primary Cast', required: false },
  { key: 'supportingCastNames', label: 'Supporting Cast', required: false },
  { key: 'season', label: 'Season', required: false },
  { key: 'episodeRange', label: 'Episode Range', required: false },
  { key: 'tags', label: 'Tags', required: false },
  { key: 'status', label: 'Status', required: false },
] as const;

const UNMAPPED_VALUE = '__unmapped__';

export function StorylineImportDialog({
  open,
  onOpenChange,
  universeId,
  onImportComplete,
}: StorylineImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCSVData] = useState<CSVParseResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<StorylineColumnMapping>({
    title: '',
  });
  const [validRows, setValidRows] = useState<MappedStorylineRow[]>([]);
  const [invalidRows, setInvalidRows] = useState<
    { row: number; errors: string[] }[]
  >([]);
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [importProgress, setImportProgress] = useState({
    total: 0,
    completed: 0,
    created: 0,
    skipped: 0,
    errors: [] as { row: number; message: string }[],
  });
  const [unmatchedCast, setUnmatchedCast] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep('upload');
      setFile(null);
      setCSVData(null);
      setColumnMapping({ title: '' });
      setValidRows([]);
      setInvalidRows([]);
      setImportStatus('idle');
      setImportProgress({
        total: 0,
        completed: 0,
        created: 0,
        skipped: 0,
        errors: [],
      });
      setUnmatchedCast([]);
      setParseError(null);
    }
    onOpenChange(newOpen);
  };

  // File handling
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setParseError(null);

    try {
      const text = await selectedFile.text();
      const result = parseCSV(text);

      if (result.headers.length === 0) {
        throw new Error('No headers found in CSV file');
      }
      if (result.rows.length === 0) {
        throw new Error('No data rows found in CSV file');
      }

      setCSVData(result);

      // Auto-detect column mappings
      const detectedMappings = autoDetectStorylineColumnMappings(result.headers);
      setColumnMapping({
        title: detectedMappings.title || result.headers[0] || '',
        synopsis: detectedMappings.synopsis,
        narrative: detectedMappings.narrative,
        primaryCastNames: detectedMappings.primaryCastNames,
        supportingCastNames: detectedMappings.supportingCastNames,
        season: detectedMappings.season,
        episodeRange: detectedMappings.episodeRange,
        tags: detectedMappings.tags,
        status: detectedMappings.status,
      });

      setStep('mapping');
    } catch (error) {
      console.error('Error parsing CSV:', error);
      setParseError(
        error instanceof Error ? error.message : 'Failed to parse CSV file'
      );
      setFile(null);
      setCSVData(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && isValidFileType(droppedFile)) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect]
  );

  // Validation
  const validateMapping = useCallback(() => {
    if (!csvData) return;

    const result = validateStorylineImportRows(csvData.rows, columnMapping);
    setValidRows(result.validRows);
    setInvalidRows(result.invalidRows);
    setStep('preview');
  }, [csvData, columnMapping]);

  // Import
  const handleImport = useCallback(async () => {
    if (validRows.length === 0) return;

    setStep('importing');
    setImportStatus('importing');
    setImportProgress({
      total: validRows.length,
      completed: 0,
      created: 0,
      skipped: 0,
      errors: [],
    });

    try {
      const response = await fetch('/api/import/storylines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          universeId,
          storylines: validRows.map((row) => ({
            title: row.title,
            synopsis: row.synopsis,
            narrative: row.narrative,
            primaryCastNames: row.primaryCastNames,
            supportingCastNames: row.supportingCastNames,
            season: row.season,
            episodeRange: row.episodeRange,
            tags: row.tags,
            status: row.status,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const result = data.data;
        setImportProgress({
          total: validRows.length,
          completed: validRows.length,
          created: result.storylinesCreated,
          skipped: result.storylinesSkipped,
          errors: result.errors,
        });
        setUnmatchedCast(result.castResolution.unmatched);
        setImportStatus('complete');

        if (onImportComplete) {
          onImportComplete({
            created: result.storylinesCreated,
            skipped: result.storylinesSkipped,
            errors: result.errors.length,
            unmatchedCast: result.castResolution.unmatched,
          });
        }
      } else {
        setImportProgress((prev) => ({
          ...prev,
          completed: prev.total,
          errors: [{ row: 0, message: data.error?.message || 'Import failed' }],
        }));
        setImportStatus('error');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportProgress((prev) => ({
        ...prev,
        completed: prev.total,
        errors: [{ row: 0, message: 'Network error during import' }],
      }));
      setImportStatus('error');
    }
  }, [validRows, universeId, onImportComplete]);

  // Download sample CSV
  const handleDownloadSample = useCallback(() => {
    const csv = generateStorylineSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lexicon-storyline-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Column mapping update
  const updateMapping = (field: keyof StorylineColumnMapping, value: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [field]: value === UNMAPPED_VALUE ? undefined : value,
    }));
  };

  const canProceedToPreview = columnMapping.title !== '';

  // Count total cast members for preview
  const totalCastCount = validRows.reduce(
    (acc, row) =>
      acc + row.primaryCastNames.length + row.supportingCastNames.length,
    0
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Storylines from CSV
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload a CSV file to import storylines in bulk.'}
            {step === 'mapping' && 'Map your CSV columns to storyline fields.'}
            {step === 'preview' && 'Review the data before importing.'}
            {step === 'importing' && 'Importing storylines...'}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {(['upload', 'mapping', 'preview', 'importing'] as const).map(
            (s, idx) => (
              <React.Fragment key={s}>
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors',
                    step === s
                      ? 'bg-lexicon-600 text-white'
                      : idx <
                          ['upload', 'mapping', 'preview', 'importing'].indexOf(step)
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {idx <
                  ['upload', 'mapping', 'preview', 'importing'].indexOf(step) ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                {idx < 3 && (
                  <div
                    className={cn(
                      'w-8 h-0.5',
                      idx <
                        ['upload', 'mapping', 'preview', 'importing'].indexOf(step)
                        ? 'bg-green-500'
                        : 'bg-muted'
                    )}
                  />
                )}
              </React.Fragment>
            )
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              {parseError && (
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">
                      Failed to parse CSV file
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {parseError}
                    </p>
                  </div>
                  <button
                    onClick={() => setParseError(null)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                  isDragging
                    ? 'border-lexicon-500 bg-lexicon-50 dark:bg-lexicon-950/20'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Drag and drop your CSV file here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  Supports: .csv files with storyline data
                </p>
              </div>

              <div className="flex items-center justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSample}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Sample CSV
                </Button>
              </div>

              <div className="rounded-lg bg-muted/50 p-4 text-sm">
                <p className="font-medium mb-2">Expected CSV Format:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>
                    <strong>title</strong> (required): Storyline title
                  </li>
                  <li>
                    <strong>synopsis</strong>: Brief summary (~300 words)
                  </li>
                  <li>
                    <strong>narrative</strong>: Full story (up to 100K words)
                  </li>
                  <li>
                    <strong>primary_cast</strong>: Comma-separated cast names
                  </li>
                  <li>
                    <strong>supporting_cast</strong>: Comma-separated names
                  </li>
                  <li>
                    <strong>season</strong>: Season identifier
                  </li>
                  <li>
                    <strong>tags</strong>: Comma-separated tags
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Cast names will be matched to existing entities in your universe.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && csvData && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{file?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {csvData.rows.length} rows, {csvData.headers.length} columns
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto"
                  onClick={() => {
                    setFile(null);
                    setCSVData(null);
                    setStep('upload');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {csvData.errors.length > 0 && (
                <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 p-3">
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    CSV Parse Warnings
                  </p>
                  <ul className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 space-y-1">
                    {csvData.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>
                        Row {err.row}: {err.message}
                      </li>
                    ))}
                    {csvData.errors.length > 5 && (
                      <li>...and {csvData.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm font-medium">
                  Map your CSV columns to storyline fields:
                </p>
                {STORYLINE_FIELDS.map((field) => (
                  <div
                    key={field.key}
                    className="grid grid-cols-2 gap-4 items-center"
                  >
                    <Label className="text-sm">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <Select
                      value={
                        columnMapping[field.key as keyof StorylineColumnMapping] ||
                        UNMAPPED_VALUE
                      }
                      onValueChange={(value) =>
                        updateMapping(field.key as keyof StorylineColumnMapping, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNMAPPED_VALUE}>
                          -- Not Mapped --
                        </SelectItem>
                        {csvData.headers.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {csvData.rows.length > 0 && columnMapping.title && (
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium mb-2">Sample Data Preview:</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">Title</th>
                          <th className="text-left p-2 font-medium">Season</th>
                          <th className="text-left p-2 font-medium">Primary Cast</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.rows.slice(0, 3).map((row, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="p-2 font-medium truncate max-w-[200px]">
                              {row[columnMapping.title] || '-'}
                            </td>
                            <td className="p-2 text-muted-foreground">
                              {columnMapping.season
                                ? row[columnMapping.season] || '-'
                                : '-'}
                            </td>
                            <td className="p-2 text-muted-foreground truncate max-w-[150px]">
                              {columnMapping.primaryCastNames
                                ? row[columnMapping.primaryCastNames] || '-'
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-4 text-center">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {validRows.length}
                  </p>
                  <p className="text-sm text-green-600/70 dark:text-green-400/70">
                    Valid storylines
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {totalCastCount}
                  </p>
                  <p className="text-sm text-blue-600/70 dark:text-blue-400/70">
                    Cast references
                  </p>
                </div>
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4 text-center">
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {invalidRows.length}
                  </p>
                  <p className="text-sm text-red-600/70 dark:text-red-400/70">
                    Invalid rows
                  </p>
                </div>
              </div>

              {validRows.length > 0 && (
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium mb-2">
                    Storylines to Import ({validRows.length}):
                  </p>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">Title</th>
                          <th className="text-left p-2 font-medium">Season</th>
                          <th className="text-left p-2 font-medium">Cast</th>
                          <th className="text-left p-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validRows.slice(0, 20).map((row, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="p-2 font-medium truncate max-w-[200px]">
                              {row.title}
                            </td>
                            <td className="p-2 text-muted-foreground">
                              {row.season || '-'}
                            </td>
                            <td className="p-2 text-muted-foreground">
                              {row.primaryCastNames.length + row.supportingCastNames.length}
                            </td>
                            <td className="p-2 capitalize">{row.status}</td>
                          </tr>
                        ))}
                        {validRows.length > 20 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="p-2 text-center text-muted-foreground italic"
                            >
                              ...and {validRows.length - 20} more
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {invalidRows.length > 0 && (
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    Invalid Rows (will be skipped)
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {invalidRows.slice(0, 10).map((row, idx) => (
                      <p
                        key={idx}
                        className="text-xs text-red-600 dark:text-red-400"
                      >
                        <span className="font-medium">Row {row.row}:</span>{' '}
                        {row.errors.join(', ')}
                      </p>
                    ))}
                    {invalidRows.length > 10 && (
                      <p className="text-xs text-red-500 italic">
                        ...and {invalidRows.length - 10} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
                <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Cast names will be matched to existing entities during import
                </p>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                  Unmatched cast members will be reported but storylines will
                  still be created.
                </p>
              </div>

              {validRows.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-10 w-10 mx-auto mb-2" />
                  <p className="font-medium">No valid storylines to import</p>
                  <p className="text-sm">
                    Please fix the errors and try again.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Importing */}
          {step === 'importing' && (
            <div className="py-4 space-y-4">
              <ImportProgress
                total={importProgress.total}
                completed={importProgress.completed}
                created={importProgress.created}
                skipped={importProgress.skipped}
                errors={importProgress.errors}
                status={importStatus}
              />

              {importStatus === 'complete' && unmatchedCast.length > 0 && (
                <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 p-3">
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4" />
                    {unmatchedCast.length} Cast Member(s) Not Found
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    {unmatchedCast.slice(0, 10).join(', ')}
                    {unmatchedCast.length > 10 &&
                      `... and ${unmatchedCast.length - 10} more`}
                  </p>
                  <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70 mt-2">
                    Create these entities first, then update the storylines to
                    link them.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="gap-2">
          {step === 'upload' && (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          )}

          {step === 'mapping' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setCSVData(null);
                  setStep('upload');
                }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={validateMapping}
                disabled={!canProceedToPreview}
                variant="lexicon"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0}
                variant="lexicon"
              >
                Import {validRows.length} Storylines
              </Button>
            </>
          )}

          {step === 'importing' && importStatus === 'complete' && (
            <Button onClick={() => handleOpenChange(false)} variant="lexicon">
              Done
            </Button>
          )}

          {step === 'importing' && importStatus === 'error' && (
            <>
              <Button variant="outline" onClick={() => setStep('preview')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button onClick={handleImport} variant="lexicon">
                Retry Import
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function isValidFileType(file: File): boolean {
  const validTypes = [
    'text/csv',
    'text/plain',
    'application/csv',
    'application/vnd.ms-excel',
  ];
  const validExtensions = ['.csv', '.txt'];

  return (
    validTypes.includes(file.type) ||
    validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
  );
}
