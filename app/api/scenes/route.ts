/**
 * Scenes API Routes - Collection Operations
 *
 * GET /api/scenes - List scenes by productionId (with date range filters)
 * POST /api/scenes - Create a new scene
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listScenes,
  createScene,
} from '@/lib/scenes';
import {
  listScenesQuerySchema,
  createProdSceneSchema,
} from '@/lib/validation/production';
import type { ApiResponse, ApiError, ProdScene, PaginatedResponse } from '@/types';

/**
 * GET /api/scenes
 * List scenes for a production with optional date range filters
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<ProdScene>> | ApiError>> {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const parseResult = listScenesQuerySchema.safeParse(params);
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
    const result = await listScenes(productionId, options);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error listing scenes:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list scenes',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scenes
 * Create a new scene
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ProdScene> | ApiError>> {
  try {
    const body = await request.json();

    const parseResult = createProdSceneSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid scene data',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const scene = await createScene(parseResult.data);

    return NextResponse.json(
      {
        success: true,
        data: scene,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating scene:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create scene',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
