/**
 * Entity API Routes - Collection Operations
 *
 * POST /api/entities - Create a new entity
 * GET /api/entities - List entities for a universe
 */

import { NextRequest, NextResponse } from 'next/server';
import { createEntity, listEntities, searchEntities } from '@/lib/entities';
import {
  createEntitySchema,
  listEntitiesQuerySchema,
  searchEntitiesQuerySchema,
} from '@/lib/validation/entity';
import type { ApiResponse, ApiError, Entity, PaginatedResponse } from '@/types';

/**
 * POST /api/entities
 * Create a new entity in the knowledge graph
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Entity> | ApiError>> {
  try {
    const body = await request.json();

    // Validate input
    const parseResult = createEntitySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid entity data',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    // Create entity
    const entity = await createEntity(parseResult.data);

    return NextResponse.json(
      {
        success: true,
        data: entity,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating entity:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create entity',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/entities
 * List entities for a universe, with optional filtering
 *
 * Query params:
 * - universeId (required): UUID of the universe
 * - type: Filter by entity type
 * - status: Filter by entity status
 * - limit: Number of results (default 50, max 100)
 * - offset: Pagination offset
 * - sortBy: Sort field (name, createdAt, updatedAt)
 * - sortOrder: Sort direction (asc, desc)
 * - q: Search query (switches to search mode)
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<Entity>> | ApiResponse<Entity[]> | ApiError>> {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    // Check if this is a search request
    if (params.q) {
      const parseResult = searchEntitiesQuerySchema.safeParse(params);
      if (!parseResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid search parameters',
              details: parseResult.error.flatten().fieldErrors,
            },
          },
          { status: 400 }
        );
      }

      const { universeId, q, type, limit } = parseResult.data;
      const results = await searchEntities(universeId, q, { type, limit });

      return NextResponse.json({
        success: true,
        data: results,
      });
    }

    // Regular list request
    const parseResult = listEntitiesQuerySchema.safeParse(params);
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

    const { universeId, type, status, limit, offset, sortBy, sortOrder } =
      parseResult.data;

    const result = await listEntities(universeId, {
      type,
      status,
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
    console.error('Error listing entities:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list entities',
        },
      },
      { status: 500 }
    );
  }
}
