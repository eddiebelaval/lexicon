/**
 * Episodes API Routes - Individual Operations
 *
 * GET /api/episodes/[id] - Get episode by ID
 * PUT /api/episodes/[id] - Update episode
 * DELETE /api/episodes/[id] - Delete episode
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEpisode, updateEpisode, deleteEpisode } from '@/lib/episodes';
import type { ApiResponse, ApiError, Episode } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Episode> | ApiError>> {
  const { id } = await params;

  try {
    const episode = await getEpisode(id);
    if (!episode) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Episode not found' } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: episode });
  } catch (error) {
    console.error('Get episode error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get episode' } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Episode> | ApiError>> {
  const { id } = await params;

  try {
    const body = await request.json();
    const episode = await updateEpisode(id, body);
    if (!episode) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Episode not found' } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: episode });
  } catch (error) {
    console.error('Update episode error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update episode' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ deleted: boolean }> | ApiError>> {
  const { id } = await params;

  try {
    await deleteEpisode(id);
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error('Delete episode error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete episode' } },
      { status: 500 }
    );
  }
}
