/**
 * Episodes API Routes - Collection Operations
 *
 * GET /api/episodes - List episodes by productionId
 * POST /api/episodes - Create a new episode
 */

import { NextRequest, NextResponse } from 'next/server';
import { listEpisodes, createEpisode } from '@/lib/episodes';
import type { ApiResponse, ApiError, Episode, PaginatedResponse } from '@/types';

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PaginatedResponse<Episode>> | ApiError>> {
  try {
    const { searchParams } = new URL(request.url);
    const productionId = searchParams.get('productionId');

    if (!productionId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'productionId is required' } },
        { status: 400 }
      );
    }

    const status = searchParams.get('status') as Episode['status'] | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await listEpisodes(productionId, {
      status: status || undefined,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('List episodes error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list episodes' } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Episode> | ApiError>> {
  try {
    const body = await request.json();
    const { productionId, episodeNumber, title, description, airDate, premiereDate, status } = body;

    if (!productionId || episodeNumber === undefined) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'productionId and episodeNumber are required' } },
        { status: 400 }
      );
    }

    const episode = await createEpisode({
      productionId,
      episodeNumber,
      title,
      description,
      airDate,
      premiereDate,
      status,
    });

    return NextResponse.json({ success: true, data: episode }, { status: 201 });
  } catch (error) {
    console.error('Create episode error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create episode' } },
      { status: 500 }
    );
  }
}
