import { NextRequest, NextResponse } from 'next/server';
import { enrichCastBatch } from '@/lib/enrichment';

export async function POST(request: NextRequest) {
  try {
    const { castNames } = await request.json();

    if (!Array.isArray(castNames) || castNames.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'castNames array is required',
          },
        },
        { status: 400 }
      );
    }

    // Cap at 20 per batch to avoid timeout
    const names = castNames.slice(0, 20);

    const results = await enrichCastBatch(names);

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      data: {
        results: results.map((r) => r.profile),
        summary: {
          total: names.length,
          successful,
          failed,
          capped: castNames.length > 20,
        },
      },
    });
  } catch (error) {
    console.error('Batch enrichment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ENRICHMENT_ERROR',
          message: 'Failed to enrich cast batch',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
