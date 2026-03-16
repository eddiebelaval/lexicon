/**
 * Asset Instance API Routes - Individual Operations
 *
 * GET /api/assets/[id] - Get asset instance with stage + type
 * PUT /api/assets/[id] - Update asset instance
 * DELETE /api/assets/[id] - Delete asset instance
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAssetInstance,
  updateAssetInstance,
  deleteAssetInstance,
} from '@/lib/lifecycle';
import {
  assetInstanceIdSchema,
  updateAssetInstanceSchema,
} from '@/lib/validation/lifecycle';
import type { ApiResponse, ApiError, AssetInstanceWithStage, AssetInstance } from '@/types';

/**
 * GET /api/assets/[id]
 * Get an asset instance with current stage and asset type populated
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<AssetInstanceWithStage> | ApiError>> {
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
    const instance = await getAssetInstance(id);

    if (!instance) {
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

    return NextResponse.json({
      success: true,
      data: instance,
    });
  } catch (error) {
    console.error('Error getting asset instance:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get asset instance',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/assets/[id]
 * Update an asset instance
 */
export async function PUT(
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

    const parseResult = updateAssetInstanceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const instance = await updateAssetInstance(id, parseResult.data);

    return NextResponse.json({
      success: true,
      data: instance,
    });
  } catch (error) {
    console.error('Error updating asset instance:', error);

    if (error instanceof Error && error.message === 'Asset instance not found') {
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

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update asset instance',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/assets/[id]
 * Delete an asset instance
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ deleted: boolean }> | ApiError>> {
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
    const existing = await getAssetInstance(id);
    if (!existing) {
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

    await deleteAssetInstance(id);

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting asset instance:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete asset instance',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
