/**
 * Storylines API Routes - Collection Operations
 *
 * GET /api/storylines - List storylines with filtering
 * POST /api/storylines - Create a new storyline
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listStorylines,
  createStoryline,
  searchStorylines,
} from '@/lib/storylines';
import {
  listStorylinesQuerySchema,
  createStorylineSchema,
  searchStorylinesQuerySchema,
} from '@/lib/validation/storyline';
import type { ApiResponse, ApiError, Storyline, StorylineSearchResult, PaginatedResponse } from '@/types';

/**
 * GET /api/storylines
 * List storylines for a universe, or search if 'q' param provided
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<Storyline> | StorylineSearchResult[]> | ApiError>> {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    // Check if this is a search request
    if (params.q) {
      const parseResult = searchStorylinesQuerySchema.safeParse(params);
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

      const { universeId, q, limit } = parseResult.data;
      const results = await searchStorylines(universeId, q, limit);

      return NextResponse.json({
        success: true,
        data: results,
      });
    }

    // Regular list request
    const parseResult = listStorylinesQuerySchema.safeParse(params);
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
    const result = await listStorylines(universeId, options);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error listing storylines:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list storylines',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/storylines
 * Create a new storyline
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Storyline> | ApiError>> {
  try {
    const body = await request.json();

    // Validate input
    const parseResult = createStorylineSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid storyline data',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    // TODO: Get user ID from session when auth is implemented
    const userId = undefined;

    const storyline = await createStoryline(parseResult.data, userId);

    return NextResponse.json(
      {
        success: true,
        data: storyline,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating storyline:', error);

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
          message: 'Failed to create storyline',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
