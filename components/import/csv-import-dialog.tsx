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
  autoDetectColumnMappings,
  generateSampleCSV,
  type CSVParseResult,
} from '@/lib/import';
import {
  validateImportRows,
  type ColumnMapping,
  type MappedImportRow,
} from '@/lib/validation/import';
import { cn } from '@/lib/utils';

type Step = 'upload' | 'mapping' | 'preview' | 'importing';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  universeId: string;
  onImportComplete?: (result: {
    created: number;
    skipped: number;
    errors: number;
  }) => void;
}

const ENTITY_FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'type', label: 'Type', required: false },
  { key: 'description', label: 'Description', required: false },
  { key: 'aliases', label: 'Aliases', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'imageUrl', label: 'Image URL', required: false },
] as const;

const UNMAPPED_VALUE = '__unmapped__';

export function CSVImportDialog({
  open,
  onOpenChange,
  universeId,
  onImportComplete,
}: CSVImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCSVData] = useState<CSVParseResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    name: '',
  });
  const [validRows, setValidRows] = useState<MappedImportRow[]>([]);
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
  const [isDragging, setIsDragging] = useState(false);

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset all state
      setStep('upload');
      setFile(null);
      setCSVData(null);
      setColumnMapping({ name: '' });
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
    }
    onOpenChange(newOpen);
  };

  // File handling
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);

    try {
      const text = await selectedFile.text();
      const result = parseCSV(text);
      setCSVData(result);

      // Auto-detect column mappings
      const detectedMappings = autoDetectColumnMappings(result.headers);
      setColumnMapping({
        name: detectedMappings.name || result.headers[0] || '',
        type: detectedMappings.type,
        description: detectedMappings.description,
        aliases: detectedMappings.aliases,
        status: detectedMappings.status,
        imageUrl: detectedMappings.imageUrl,
      });

      // Move to mapping step
      setStep('mapping');
    } catch (error) {
      console.error('Error parsing CSV:', error);
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

    const result = validateImportRows(csvData.rows, columnMapping);
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
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          universeId,
          entities: validRows.map((row) => ({
            name: row.name,
            type: row.type,
            description: row.description,
            aliases: row.aliases,
            status: row.status,
            imageUrl: row.imageUrl,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const result = data.data;
        setImportProgress({
          total: validRows.length,
          completed: validRows.length,
          created: result.entitiesCreated,
          skipped: result.entitiesSkipped,
          errors: result.errors,
        });
        setImportStatus('complete');

        if (onImportComplete) {
          onImportComplete({
            created: result.entitiesCreated,
            skipped: result.entitiesSkipped,
            errors: result.errors.length,
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
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lexicon-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Column mapping update
  const updateMapping = (field: keyof ColumnMapping, value: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [field]: value === UNMAPPED_VALUE ? undefined : value,
    }));
  };

  const canProceedToPreview = columnMapping.name !== '';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Entities from CSV
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload a CSV file to import entities in bulk.'}
            {step === 'mapping' && 'Map your CSV columns to entity fields.'}
            {step === 'preview' && 'Review the data before importing.'}
            {step === 'importing' && 'Importing entities...'}
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
                        ['upload', 'mapping', 'preview', 'importing'].indexOf(
                          step
                        )
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {idx <
                  ['upload', 'mapping', 'preview', 'importing'].indexOf(
                    step
                  ) ? (
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
                        ['upload', 'mapping', 'preview', 'importing'].indexOf(
                          step
                        )
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
                  Supports: .csv files
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
                    <strong>name</strong> (required): Entity name
                  </li>
                  <li>
                    <strong>type</strong>: character, location, event, object, or
                    faction
                  </li>
                  <li>
                    <strong>description</strong>: Entity description
                  </li>
                  <li>
                    <strong>aliases</strong>: Comma-separated alternative names
                  </li>
                  <li>
                    <strong>status</strong>: active, inactive, or deceased
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && csvData && (
            <div className="space-y-4">
              {/* File Info */}
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

              {/* Parse Errors */}
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

              {/* Column Mapping */}
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  Map your CSV columns to entity fields:
                </p>
                {ENTITY_FIELDS.map((field) => (
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
                        columnMapping[field.key as keyof ColumnMapping] ||
                        UNMAPPED_VALUE
                      }
                      onValueChange={(value) =>
                        updateMapping(field.key as keyof ColumnMapping, value)
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

              {/* Preview Sample */}
              {csvData.rows.length > 0 && columnMapping.name && (
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium mb-2">
                    Sample Data Preview:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          {ENTITY_FIELDS.filter(
                            (f) =>
                              columnMapping[f.key as keyof ColumnMapping]
                          ).map((field) => (
                            <th
                              key={field.key}
                              className="text-left p-2 font-medium"
                            >
                              {field.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.rows.slice(0, 3).map((row, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            {ENTITY_FIELDS.filter(
                              (f) =>
                                columnMapping[f.key as keyof ColumnMapping]
                            ).map((field) => (
                              <td
                                key={field.key}
                                className="p-2 text-muted-foreground truncate max-w-[150px]"
                              >
                                {row[
                                  columnMapping[
                                    field.key as keyof ColumnMapping
                                  ] || ''
                                ] || '-'}
                              </td>
                            ))}
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
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-4 text-center">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {validRows.length}
                  </p>
                  <p className="text-sm text-green-600/70 dark:text-green-400/70">
                    Valid entities
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

              {/* Valid Entities Preview */}
              {validRows.length > 0 && (
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium mb-2">
                    Entities to Import ({validRows.length}):
                  </p>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">Name</th>
                          <th className="text-left p-2 font-medium">Type</th>
                          <th className="text-left p-2 font-medium">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {validRows.slice(0, 20).map((row, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="p-2 font-medium">{row.name}</td>
                            <td className="p-2 capitalize">{row.type}</td>
                            <td className="p-2 text-muted-foreground truncate max-w-[200px]">
                              {row.description || '-'}
                            </td>
                          </tr>
                        ))}
                        {validRows.length > 20 && (
                          <tr>
                            <td
                              colSpan={3}
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

              {/* Invalid Rows */}
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

              {validRows.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-10 w-10 mx-auto mb-2" />
                  <p className="font-medium">No valid entities to import</p>
                  <p className="text-sm">
                    Please fix the errors and try again.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Importing */}
          {step === 'importing' && (
            <div className="py-4">
              <ImportProgress
                total={importProgress.total}
                completed={importProgress.completed}
                created={importProgress.created}
                skipped={importProgress.skipped}
                errors={importProgress.errors}
                status={importStatus}
              />
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
                Import {validRows.length} Entities
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
