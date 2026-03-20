import { NextRequest, NextResponse } from 'next/server';
import { enrichCastMember } from '@/lib/enrichment';

export async function POST(request: NextRequest) {
  try {
    const { castName } = await request.json();

    if (!castName || typeof castName !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'castName is required',
          },
        },
        { status: 400 }
      );
    }

    const result = await enrichCastMember(castName);

    return NextResponse.json({
      success: result.success,
      data: result.profile,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error('Enrichment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ENRICHMENT_ERROR',
          message: 'Failed to enrich cast member',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
