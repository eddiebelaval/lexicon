/**
 * Production API Routes - Individual Operations
 *
 * GET /api/productions/[id] - Get production by ID
 * PUT /api/productions/[id] - Update production
 * DELETE /api/productions/[id] - Delete production
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getProduction,
  updateProduction,
  deleteProduction,
} from '@/lib/productions';
import {
  productionIdSchema,
  updateProductionSchema,
} from '@/lib/validation/production';
import type { ApiResponse, ApiError, Production } from '@/types';

/**
 * GET /api/productions/[id]
 * Get a production by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Production> | ApiError>> {
  const { id } = await params;

  const parseResult = productionIdSchema.safeParse({ id });
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid production ID',
          details: parseResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const production = await getProduction(id);

    if (!production) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Production not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: production,
    });
  } catch (error) {
    console.error('Error getting production:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get production',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/productions/[id]
 * Update a production
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Production> | ApiError>> {
  const { id } = await params;

  const idResult = productionIdSchema.safeParse({ id });
  if (!idResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid production ID',
          details: idResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    const parseResult = updateProductionSchema.safeParse(body);
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

    // TODO: Get user ID from session when auth is implemented
    const userId = undefined;

    const production = await updateProduction(id, parseResult.data, userId);

    if (!production) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Production not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: production,
    });
  } catch (error) {
    console.error('Error updating production:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update production',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/productions/[id]
 * Delete a production
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ deleted: boolean }> | ApiError>> {
  const { id } = await params;

  const parseResult = productionIdSchema.safeParse({ id });
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid production ID',
          details: parseResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const existing = await getProduction(id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Production not found',
          },
        },
        { status: 404 }
      );
    }

    await deleteProduction(id);

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting production:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete production',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
