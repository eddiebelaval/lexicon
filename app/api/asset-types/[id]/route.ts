/**
 * Asset Type API Routes - Individual Operations
 *
 * GET /api/asset-types/[id] - Get asset type with stages
 * PUT /api/asset-types/[id] - Update asset type
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAssetTypeWithStages, updateAssetType } from '@/lib/lifecycle';
import {
  assetTypeIdSchema,
  updateAssetTypeSchema,
} from '@/lib/validation/lifecycle';
import type { ApiResponse, ApiError, AssetTypeWithStages, AssetType } from '@/types';

/**
 * GET /api/asset-types/[id]
 * Get an asset type with its lifecycle stages
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<AssetTypeWithStages> | ApiError>> {
  const { id } = await params;

  const parseResult = assetTypeIdSchema.safeParse({ id });
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid asset type ID',
          details: parseResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const assetType = await getAssetTypeWithStages(id);

    if (!assetType) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Asset type not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: assetType,
    });
  } catch (error) {
    console.error('Error getting asset type:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get asset type',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/asset-types/[id]
 * Update an asset type
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<AssetType> | ApiError>> {
  const { id } = await params;

  const idResult = assetTypeIdSchema.safeParse({ id });
  if (!idResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid asset type ID',
          details: idResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    const parseResult = updateAssetTypeSchema.safeParse(body);
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

    const assetType = await updateAssetType(id, parseResult.data);

    return NextResponse.json({
      success: true,
      data: assetType,
    });
  } catch (error) {
    console.error('Error updating asset type:', error);

    if (error instanceof Error && error.message === 'Asset type not found') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Asset type not found',
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
          message: 'Failed to update asset type',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
