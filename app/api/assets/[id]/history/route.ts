/**
 * Asset Transition History API Route
 *
 * GET /api/assets/[id]/history - Get stage transition history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTransitionHistory } from '@/lib/lifecycle';
import { assetInstanceIdSchema } from '@/lib/validation/lifecycle';
import type { ApiResponse, ApiError, StageTransitionWithNames } from '@/types';

/**
 * GET /api/assets/[id]/history
 * Get the full stage transition history for an asset instance
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<StageTransitionWithNames[]> | ApiError>> {
  const { id } = await params;

  const parseResult = assetInstanceIdSchema.safeParse({ id });
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid asset instance ID',
          details: parseResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const history = await getTransitionHistory(id);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error getting transition history:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get transition history',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
