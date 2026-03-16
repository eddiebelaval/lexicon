/**
 * Cast Contracts API Routes - Collection Operations
 *
 * GET /api/cast-contracts - List cast contracts by productionId
 * POST /api/cast-contracts - Create a new cast contract
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listCastContracts,
  createCastContract,
} from '@/lib/cast-contracts';
import {
  listCastContractsQuerySchema,
  createCastContractSchema,
} from '@/lib/validation/production';
import type { ApiResponse, ApiError, CastContract, PaginatedResponse } from '@/types';

/**
 * GET /api/cast-contracts
 * List cast contracts for a production
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<CastContract>> | ApiError>> {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const parseResult = listCastContractsQuerySchema.safeParse(params);
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
    const result = await listCastContracts(productionId, options);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error listing cast contracts:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to list cast contracts',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cast-contracts
 * Create a new cast contract
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CastContract> | ApiError>> {
  try {
    const body = await request.json();

    const parseResult = createCastContractSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid cast contract data',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const contract = await createCastContract(parseResult.data);

    return NextResponse.json(
      {
        success: true,
        data: contract,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating cast contract:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create cast contract',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
