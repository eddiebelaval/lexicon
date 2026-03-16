/**
 * Call Sheet API Route
 *
 * GET /api/call-sheet?productionId=X&date=YYYY-MM-DD
 * Returns a structured call sheet for a production on a given date.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateCallSheet } from '@/lib/call-sheet';
import type { CallSheet } from '@/lib/call-sheet';
import type { ApiResponse, ApiError } from '@/types';

const callSheetQuerySchema = z.object({
  productionId: z.string().uuid('Invalid production ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
});

/**
 * GET /api/call-sheet
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CallSheet> | ApiError>> {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const parseResult = callSheetQuerySchema.safeParse(params);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { productionId, date } = parseResult.data;
    const callSheet = await generateCallSheet(productionId, date);

    return NextResponse.json({
      success: true,
      data: callSheet,
    });
  } catch (error) {
    console.error('Error generating call sheet:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate call sheet',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
