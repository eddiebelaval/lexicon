/**
 * Cast Spreadsheet Import API Route
 *
 * POST /api/import/cast - Upload a CSV/XLSX cast spreadsheet, parse it,
 * and return structured data for review before committing to the database.
 *
 * This is the "parse" step. The coordinator uploads their master cast spreadsheet,
 * gets back a preview of what Lexi found, and can review before committing via
 * POST /api/import/cast/commit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseCastSpreadsheet, type CastParseResult } from '@/lib/import/cast-spreadsheet-parser';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const VALID_EXTENSIONS = ['csv', 'xlsx', 'xls'];
const VALID_MIME_TYPES = [
  'text/csv',
  'application/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: { code: 'FILE_TOO_LARGE', message: 'File must be under 10 MB' } },
        { status: 400 }
      );
    }

    // Validate file type by extension and MIME type
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!VALID_MIME_TYPES.includes(file.type) && !VALID_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TYPE', message: 'File must be CSV, XLS, or XLSX' } },
        { status: 400 }
      );
    }

    // Parse the file
    const buffer = Buffer.from(await file.arrayBuffer());
    const result: CastParseResult = parseCastSpreadsheet(buffer, file.name);

    // Return parsed data with a preview for the coordinator to review
    return NextResponse.json({
      success: true,
      data: {
        filename: file.name,
        totalRows: result.totalRows,
        parsedRows: result.rows.length,
        skippedRows: result.skippedRows,
        columns: result.columns,
        seasonTags: result.seasonTags,
        preview: result.rows.slice(0, 5),
        rows: result.rows,
      },
    });
  } catch (error) {
    console.error('Cast import parse error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse file',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
