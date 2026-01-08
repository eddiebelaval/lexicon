/**
 * Relationship API Routes - Collection Operations
 *
 * POST /api/relationships - Create a new relationship
 * GET /api/relationships - List relationships for a universe
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRelationship, listRelationships } from '@/lib/relationships';
import {
  createRelationshipSchema,
  listRelationshipsQuerySchema,
} from '@/lib/validation/relationship';
import type {
  ApiResponse,
  ApiError,
  RelationshipWithEntities,
  PaginatedResponse,
} from '@/types';

/**
 * POST /api/relationships
 * Create a new relationship between two entities
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<RelationshipWithEntities> | ApiError>> {
  try {
    const body = await request.json();

    // Validate input
    const parseResult = createRelationshipSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid relationship data',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    // Create relationship
    const relationship = await createRelationship(parseResult.data);

    return NextResponse.json(
      {
        success: true,
        data: relationship,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating relationship:', error);

    // Check if it's a missing entity error
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create relationship';
    const isNotFoundError = errorMessage.includes('Ensure both source and target');

    return NextResponse.json(
      {
        success: false,
        error: {
          code: isNotFoundError ? 'ENTITIES_NOT_FOUND' : 'INTERNAL_ERROR',
          message: errorMessage,
        },
      },
      { status: isNotFoundError ? 400 : 500 }
    );
  }
}

/**
 * GET /api/relationships
 * List relationships for a universe, with optional entity filter
 *
 * Query params:
 * - universeId (required): UUID of the universe
 * - entityId: Filter to relationships involving this entity
 * - type: Filter by relationship type
 * - limit: Number of results (default 50, max 100)
 * - offset: Pagination offset
 * - sortBy: Sort field (createdAt, updatedAt, strength)
 * - sortOrder: Sort direction (asc, desc)
 */
export async function GET(
  request: NextRequest
): Promise<
  NextResponse<ApiResponse<PaginatedResponse<RelationshipWithEntities>> | ApiError>
> {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    // Validate query params
    const parseResult = listRelationshipsQuerySchema.safeParse(params);
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

    const { universeId, entityId, type, limit, offset, sortBy, sortOrder } =
      parseResult.data;

    const result = await listRelationships(universeId, {
      entityId,
      type,
      limit,
      offset,
      sortBy,
      sortOrder,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error listing relationships:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list relationships',
        },
      },
      { status: 500 }
    );
  }
}
