/**
 * Crew API Routes - Collection Operations
 *
 * GET /api/crew - List crew members by productionId
 * POST /api/crew - Create a new crew member
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listCrewMembers,
  createCrewMember,
} from '@/lib/crew';
import {
  listCrewQuerySchema,
  createCrewMemberSchema,
} from '@/lib/validation/production';
import type { ApiResponse, ApiError, CrewMember, PaginatedResponse } from '@/types';

/**
 * GET /api/crew
 * List crew members for a production
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<CrewMember>> | ApiError>> {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const parseResult = listCrewQuerySchema.safeParse(params);
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

    const { productionId, ...options } = parseResult.data;
    const result = await listCrewMembers(productionId, options);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error listing crew members:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list crew members',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crew
 * Create a new crew member
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CrewMember> | ApiError>> {
  try {
    const body = await request.json();

    const parseResult = createCrewMemberSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid crew member data',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const crewMember = await createCrewMember(parseResult.data);

    return NextResponse.json(
      {
        success: true,
        data: crewMember,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating crew member:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create crew member',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
