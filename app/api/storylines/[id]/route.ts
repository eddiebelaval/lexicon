/**
 * Storyline API Routes - Individual Operations
 *
 * GET /api/storylines/[id] - Get storyline by ID
 * PUT /api/storylines/[id] - Update storyline
 * DELETE /api/storylines/[id] - Delete storyline
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getStoryline,
  getStorylineWithCast,
  updateStoryline,
  deleteStoryline,
} from '@/lib/storylines';
import {
  storylineIdSchema,
  updateStorylineSchema,
} from '@/lib/validation/storyline';
import type { ApiResponse, ApiError, Storyline, StorylineWithCast } from '@/types';

/**
 * GET /api/storylines/[id]
 * Get a storyline by ID, optionally with cast entities
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Storyline | StorylineWithCast> | ApiError>> {
  const { id } = await params;

  // Validate ID
  const parseResult = storylineIdSchema.safeParse({ id });
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid storyline ID',
          details: parseResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    // Check if cast should be included
    const { searchParams } = new URL(request.url);
    const includeCast = searchParams.get('includeCast') === 'true';

    const storyline = includeCast
      ? await getStorylineWithCast(id)
      : await getStoryline(id);

    if (!storyline) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Storyline not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: storyline,
    });
  } catch (error) {
    console.error('Error getting storyline:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get storyline',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/storylines/[id]
 * Update a storyline
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Storyline> | ApiError>> {
  const { id } = await params;

  // Validate ID
  const idResult = storylineIdSchema.safeParse({ id });
  if (!idResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid storyline ID',
          details: idResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    // Validate update data
    const parseResult = updateStorylineSchema.safeParse(body);
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

    const storyline = await updateStoryline(id, parseResult.data, userId);

    if (!storyline) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Storyline not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: storyline,
    });
  } catch (error) {
    console.error('Error updating storyline:', error);

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'A storyline with this slug already exists in this universe',
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update storyline',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/storylines/[id]
 * Delete a storyline
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ deleted: boolean }> | ApiError>> {
  const { id } = await params;

  // Validate ID
  const parseResult = storylineIdSchema.safeParse({ id });
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid storyline ID',
          details: parseResult.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  try {
    // Check if storyline exists first
    const existing = await getStoryline(id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Storyline not found',
          },
        },
        { status: 404 }
      );
    }

    await deleteStoryline(id);

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting storyline:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete storyline',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
