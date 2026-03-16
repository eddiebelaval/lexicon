/**
 * Asset Types API Routes - Collection Operations
 *
 * GET /api/asset-types - List asset types by productionId
 * POST /api/asset-types - Create a new asset type
 */

import { NextRequest, NextResponse } from 'next/server';
import { listAssetTypes, createAssetType } from '@/lib/lifecycle';
import {
  listAssetTypesQuerySchema,
  createAssetTypeSchema,
} from '@/lib/validation/lifecycle';
import type { ApiResponse, ApiError, AssetType, PaginatedResponse } from '@/types';

/**
 * GET /api/asset-types
 * List asset types for a production
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<AssetType>> | ApiError>> {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const parseResult = listAssetTypesQuerySchema.safeParse(params);
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

    const { productionId, includeInactive } = parseResult.data;
    const result = await listAssetTypes(productionId, { includeInactive });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error listing asset types:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list asset types',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/asset-types
 * Create a new asset type
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<AssetType> | ApiError>> {
  try {
    const body = await request.json();

    const parseResult = createAssetTypeSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid asset type data',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const assetType = await createAssetType(parseResult.data);

    return NextResponse.json(
      {
        success: true,
        data: assetType,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating asset type:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create asset type',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
