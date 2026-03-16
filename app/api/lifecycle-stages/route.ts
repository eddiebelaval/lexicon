/**
 * Lifecycle Stages API Routes - Collection Operations
 *
 * POST /api/lifecycle-stages - Create a new lifecycle stage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLifecycleStage } from '@/lib/lifecycle';
import { createLifecycleStageSchema } from '@/lib/validation/lifecycle';
import type { ApiResponse, ApiError, LifecycleStage } from '@/types';

/**
 * POST /api/lifecycle-stages
 * Create a new lifecycle stage for an asset type
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<LifecycleStage> | ApiError>> {
  try {
    const body = await request.json();

    const parseResult = createLifecycleStageSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid lifecycle stage data',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const stage = await createLifecycleStage(parseResult.data);

    return NextResponse.json(
      {
        success: true,
        data: stage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating lifecycle stage:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create lifecycle stage',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
