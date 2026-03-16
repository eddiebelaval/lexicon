/**
 * Asset Stage Advance API Route
 *
 * POST /api/assets/[id]/advance - Advance asset to next stage
 */

import { NextRequest, NextResponse } from 'next/server';
import { advanceStage } from '@/lib/lifecycle';
import {
  assetInstanceIdSchema,
  advanceStageSchema,
} from '@/lib/validation/lifecycle';
import type { ApiResponse, ApiError, AssetInstance } from '@/types';

/**
 * POST /api/assets/[id]/advance
 * Advance an asset instance to a new lifecycle stage
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<AssetInstance> | ApiError>> {
  const { id } = await params;

  const idResult = assetInstanceIdSchema.safeParse({ id });
  if (!idResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid asset instance ID',
          details: idResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    const parseResult = advanceStageSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid advance stage data',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const instance = await advanceStage(id, parseResult.data);

    return NextResponse.json({
      success: true,
      data: instance,
    });
  } catch (error) {
    console.error('Error advancing stage:', error);

    if (error instanceof Error) {
      if (error.message === 'Asset instance not found') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Asset instance not found',
            },
          },
          { status: 404 }
        );
      }

      if (error.message.startsWith('Transition not allowed')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TRANSITION_NOT_ALLOWED',
              message: error.message,
            },
          },
          { status: 422 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to advance stage',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
