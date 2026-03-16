/**
 * Cast Contract API Routes - Individual Operations
 *
 * GET /api/cast-contracts/[id] - Get cast contract by ID
 * PUT /api/cast-contracts/[id] - Update cast contract
 * DELETE /api/cast-contracts/[id] - Delete cast contract
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCastContract,
  updateCastContract,
  deleteCastContract,
} from '@/lib/cast-contracts';
import {
  castContractIdSchema,
  updateCastContractSchema,
} from '@/lib/validation/production';
import type { ApiResponse, ApiError, CastContract } from '@/types';

/**
 * GET /api/cast-contracts/[id]
 * Get a cast contract by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<CastContract> | ApiError>> {
  const { id } = await params;

  const parseResult = castContractIdSchema.safeParse({ id });
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid cast contract ID',
          details: parseResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const contract = await getCastContract(id);

    if (!contract) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Cast contract not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contract,
    });
  } catch (error) {
    console.error('Error getting cast contract:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get cast contract',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cast-contracts/[id]
 * Update a cast contract
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<CastContract> | ApiError>> {
  const { id } = await params;

  const idResult = castContractIdSchema.safeParse({ id });
  if (!idResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid cast contract ID',
          details: idResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    const parseResult = updateCastContractSchema.safeParse(body);
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

    const contract = await updateCastContract(id, parseResult.data);

    if (!contract) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Cast contract not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contract,
    });
  } catch (error) {
    console.error('Error updating cast contract:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update cast contract',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cast-contracts/[id]
 * Delete a cast contract
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ deleted: boolean }> | ApiError>> {
  const { id } = await params;

  const parseResult = castContractIdSchema.safeParse({ id });
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid cast contract ID',
          details: parseResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const existing = await getCastContract(id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Cast contract not found',
          },
        },
        { status: 404 }
      );
    }

    await deleteCastContract(id);

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting cast contract:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete cast contract',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
