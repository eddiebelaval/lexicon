/**
 * Crew Availability API Routes - Individual Operations
 *
 * GET /api/crew-availability/[id] - Get availability entry by ID
 * PUT /api/crew-availability/[id] - Update availability entry
 * DELETE /api/crew-availability/[id] - Delete availability entry
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCrewAvailability,
  updateCrewAvailability,
  deleteCrewAvailability,
} from '@/lib/crew-availability';
import {
  crewAvailabilityIdSchema,
  updateCrewAvailabilitySchema,
} from '@/lib/validation/production';
import type { ApiResponse, ApiError, CrewAvailability } from '@/types';

/**
 * GET /api/crew-availability/[id]
 * Get a crew availability entry by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<CrewAvailability> | ApiError>> {
  const { id } = await params;

  const parseResult = crewAvailabilityIdSchema.safeParse({ id });
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid crew availability ID',
          details: parseResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const availability = await getCrewAvailability(id);

    if (!availability) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Crew availability entry not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error('Error getting crew availability:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get crew availability',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/crew-availability/[id]
 * Update a crew availability entry
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<CrewAvailability> | ApiError>> {
  const { id } = await params;

  const idResult = crewAvailabilityIdSchema.safeParse({ id });
  if (!idResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid crew availability ID',
          details: idResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    const parseResult = updateCrewAvailabilitySchema.safeParse(body);
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

    const availability = await updateCrewAvailability(id, parseResult.data);

    if (!availability) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Crew availability entry not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error('Error updating crew availability:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update crew availability',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/crew-availability/[id]
 * Delete a crew availability entry
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ deleted: boolean }> | ApiError>> {
  const { id } = await params;

  const parseResult = crewAvailabilityIdSchema.safeParse({ id });
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid crew availability ID',
          details: parseResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const existing = await getCrewAvailability(id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Crew availability entry not found',
          },
        },
        { status: 404 }
      );
    }

    await deleteCrewAvailability(id);

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting crew availability:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete crew availability',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
