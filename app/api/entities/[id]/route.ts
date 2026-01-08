/**
 * Entity API Routes - Single Entity Operations
 *
 * GET /api/entities/[id] - Get a single entity
 * PUT /api/entities/[id] - Update an entity
 * DELETE /api/entities/[id] - Delete an entity
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEntity, updateEntity, deleteEntity } from '@/lib/entities';
import { updateEntitySchema, entityIdSchema } from '@/lib/validation/entity';
import type { ApiResponse, ApiError, Entity } from '@/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/entities/[id]
 * Get a single entity by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Entity> | ApiError>> {
  try {
    const { id } = await context.params;

    // Validate ID format
    const parseResult = entityIdSchema.safeParse({ id });
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid entity ID format',
          },
        },
        { status: 400 }
      );
    }

    const entity = await getEntity(id);

    if (!entity) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ENTITY_NOT_FOUND',
            message: `Entity with ID ${id} not found`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: entity,
    });
  } catch (error) {
    console.error('Error getting entity:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get entity',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/entities/[id]
 * Update an existing entity
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<Entity> | ApiError>> {
  try {
    const { id } = await context.params;

    // Validate ID format
    const idParseResult = entityIdSchema.safeParse({ id });
    if (!idParseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid entity ID format',
          },
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate update data
    const parseResult = updateEntitySchema.safeParse(body);
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

    const entity = await updateEntity(id, parseResult.data);

    if (!entity) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ENTITY_NOT_FOUND',
            message: `Entity with ID ${id} not found`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: entity,
    });
  } catch (error) {
    console.error('Error updating entity:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update entity',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/entities/[id]
 * Delete an entity and its relationships
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ApiResponse<{ deleted: boolean }> | ApiError>> {
  try {
    const { id } = await context.params;

    // Validate ID format
    const parseResult = entityIdSchema.safeParse({ id });
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid entity ID format',
          },
        },
        { status: 400 }
      );
    }

    const deleted = await deleteEntity(id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ENTITY_NOT_FOUND',
            message: `Entity with ID ${id} not found`,
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
    console.error('Error deleting entity:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete entity',
        },
      },
      { status: 500 }
    );
  }
}
