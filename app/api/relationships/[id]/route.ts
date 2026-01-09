/**
 * Relationship API Routes - Single Relationship Operations
 *
 * GET /api/relationships/[id] - Get a single relationship
 * PUT /api/relationships/[id] - Update a relationship
 * DELETE /api/relationships/[id] - Delete a relationship
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getRelationship,
  updateRelationship,
  deleteRelationship,
} from '@/lib/relationships';
import {
  updateRelationshipSchema,
  relationshipIdSchema,
} from '@/lib/validation/relationship';
import type { ApiResponse, ApiError, RelationshipWithEntities } from '@/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/relationships/[id]
 * Get a single relationship by ID with source and target entities
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<RelationshipWithEntities> | ApiError>> {
  try {
    const { id } = await context.params;

    // Validate ID format
    const parseResult = relationshipIdSchema.safeParse({ id });
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid relationship ID format',
          },
        },
        { status: 400 }
      );
    }

    const relationship = await getRelationship(id);

    if (!relationship) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RELATIONSHIP_NOT_FOUND',
            message: `Relationship with ID ${id} not found`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: relationship,
    });
  } catch (error) {
    console.error('Error getting relationship:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get relationship',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/relationships/[id]
 * Update an existing relationship
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<RelationshipWithEntities> | ApiError>> {
  try {
    const { id } = await context.params;

    // Validate ID format
    const idParseResult = relationshipIdSchema.safeParse({ id });
    if (!idParseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid relationship ID format',
          },
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate update data
    const parseResult = updateRelationshipSchema.safeParse(body);
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

    const relationship = await updateRelationship(id, parseResult.data);

    if (!relationship) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RELATIONSHIP_NOT_FOUND',
            message: `Relationship with ID ${id} not found`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: relationship,
    });
  } catch (error) {
    console.error('Error updating relationship:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update relationship',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/relationships/[id]
 * Delete a relationship
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<{ deleted: boolean }> | ApiError>> {
  try {
    const { id } = await context.params;

    // Validate ID format
    const parseResult = relationshipIdSchema.safeParse({ id });
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid relationship ID format',
          },
        },
        { status: 400 }
      );
    }

    const deleted = await deleteRelationship(id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RELATIONSHIP_NOT_FOUND',
            message: `Relationship with ID ${id} not found`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting relationship:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete relationship',
        },
      },
      { status: 500 }
    );
  }
}
