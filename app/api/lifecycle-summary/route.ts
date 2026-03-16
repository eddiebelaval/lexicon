/**
 * Lifecycle Summary API Route
 *
 * GET /api/lifecycle-summary - Get summary counts by productionId
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLifecycleSummary } from '@/lib/lifecycle';
import { z } from 'zod';
import type { ApiResponse, ApiError, LifecycleSummary } from '@/types';

const querySchema = z.object({
  productionId: z.string().uuid('Invalid production ID'),
});

/**
 * GET /api/lifecycle-summary
 * Get lifecycle summary: counts per stage per asset type
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<LifecycleSummary[]> | ApiError>> {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const parseResult = querySchema.safeParse(params);
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

    const summary = await getLifecycleSummary(parseResult.data.productionId);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error getting lifecycle summary:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get lifecycle summary',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
