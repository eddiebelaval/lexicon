/**
 * Production Alerts API Route
 *
 * GET /api/production-alerts?productionId=X
 * Returns all active alerts for a production, sorted by severity.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllAlerts } from '@/lib/production-alerts';
import type { ProductionAlert } from '@/lib/production-alerts';
import type { ApiResponse, ApiError } from '@/types';

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ProductionAlert[]> | ApiError>> {
  try {
    const { searchParams } = new URL(request.url);
    const productionId = searchParams.get('productionId');

    if (!productionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'productionId query parameter is required',
          },
        },
        { status: 400 }
      );
    }

    const alerts = await getAllAlerts(productionId);

    return NextResponse.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error('Error fetching production alerts:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch production alerts',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
