/**
 * Crew Availability API Routes - Collection Operations
 *
 * GET /api/crew-availability - List availability by crewMemberId or productionId
 * POST /api/crew-availability - Create a new availability entry
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listCrewAvailability,
  createCrewAvailability,
} from '@/lib/crew-availability';
import {
  listCrewAvailabilityQuerySchema,
  createCrewAvailabilitySchema,
} from '@/lib/validation/production';
import type { ApiResponse, ApiError, CrewAvailability } from '@/types';

/**
 * GET /api/crew-availability
 * List crew availability by crewMemberId or productionId
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CrewAvailability[]> | ApiError>> {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const parseResult = listCrewAvailabilityQuerySchema.safeParse(params);
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

    const result = await listCrewAvailability(parseResult.data);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error listing crew availability:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list crew availability',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crew-availability
 * Create a new crew availability entry
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CrewAvailability> | ApiError>> {
  try {
    const body = await request.json();

    const parseResult = createCrewAvailabilitySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid crew availability data',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const availability = await createCrewAvailability(parseResult.data);

    return NextResponse.json(
      {
        success: true,
        data: availability,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating crew availability:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create crew availability',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
