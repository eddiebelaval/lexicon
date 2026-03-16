/**
 * Asset Instances API Routes - Collection Operations
 *
 * GET /api/assets - List asset instances by productionId (filterable)
 * POST /api/assets - Create a new asset instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { listAssetInstances, createAssetInstance } from '@/lib/lifecycle';
import {
  listAssetInstancesQuerySchema,
  createAssetInstanceSchema,
} from '@/lib/validation/lifecycle';
import type { ApiResponse, ApiError, AssetInstance, PaginatedResponse } from '@/types';

/**
 * GET /api/assets
 * List asset instances for a production with optional filters
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<AssetInstance>> | ApiError>> {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const parseResult = listAssetInstancesQuerySchema.safeParse(params);
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

    const { productionId, ...options } = parseResult.data;
    const result = await listAssetInstances(productionId, options);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error listing asset instances:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list asset instances',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/assets
 * Create a new asset instance
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<AssetInstance> | ApiError>> {
  try {
    const body = await request.json();

    const parseResult = createAssetInstanceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid asset instance data',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const instance = await createAssetInstance(parseResult.data);

    return NextResponse.json(
      {
        success: true,
        data: instance,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating asset instance:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create asset instance',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
