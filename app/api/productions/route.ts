/**
 * Productions API Routes - Collection Operations
 *
 * GET /api/productions - List productions by universeId
 * POST /api/productions - Create a new production
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listProductions,
  createProduction,
} from '@/lib/productions';
import {
  listProductionsQuerySchema,
  createProductionSchema,
} from '@/lib/validation/production';
import type { ApiResponse, ApiError, Production, PaginatedResponse } from '@/types';

/**
 * GET /api/productions
 * List productions for a universe
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<Production>> | ApiError>> {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const parseResult = listProductionsQuerySchema.safeParse(params);
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

    const { universeId, ...options } = parseResult.data;
    const result = await listProductions(universeId ?? undefined, options);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error listing productions:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list productions',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/productions
 * Create a new production
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Production> | ApiError>> {
  try {
    const body = await request.json();

    const parseResult = createProductionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid production data',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    // TODO: Get user ID from session when auth is implemented
    const userId = undefined;

    const production = await createProduction(parseResult.data, userId);

    return NextResponse.json(
      {
        success: true,
        data: production,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating production:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create production',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
