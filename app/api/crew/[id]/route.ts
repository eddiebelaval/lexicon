/**
 * Crew Member API Routes - Individual Operations
 *
 * GET /api/crew/[id] - Get crew member by ID
 * PUT /api/crew/[id] - Update crew member
 * DELETE /api/crew/[id] - Delete crew member
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getCrewMember,
  updateCrewMember,
  deleteCrewMember,
} from '@/lib/crew';
import {
  crewMemberIdSchema,
  updateCrewMemberSchema,
} from '@/lib/validation/production';
import type { ApiResponse, ApiError, CrewMember } from '@/types';

/**
 * GET /api/crew/[id]
 * Get a crew member by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<CrewMember> | ApiError>> {
  const { id } = await params;

  const parseResult = crewMemberIdSchema.safeParse({ id });
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid crew member ID',
          details: parseResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const crewMember = await getCrewMember(id);

    if (!crewMember) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Crew member not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: crewMember,
    });
  } catch (error) {
    console.error('Error getting crew member:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get crew member',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/crew/[id]
 * Update a crew member
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<CrewMember> | ApiError>> {
  const { id } = await params;

  const idResult = crewMemberIdSchema.safeParse({ id });
  if (!idResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid crew member ID',
          details: idResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    const parseResult = updateCrewMemberSchema.safeParse(body);
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

    const crewMember = await updateCrewMember(id, parseResult.data);

    if (!crewMember) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Crew member not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: crewMember,
    });
  } catch (error) {
    console.error('Error updating crew member:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update crew member',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/crew/[id]
 * Delete a crew member
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ deleted: boolean }> | ApiError>> {
  const { id } = await params;

  const parseResult = crewMemberIdSchema.safeParse({ id });
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid crew member ID',
          details: parseResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const existing = await getCrewMember(id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Crew member not found',
          },
        },
        { status: 404 }
      );
    }

    await deleteCrewMember(id);

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting crew member:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete crew member',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
