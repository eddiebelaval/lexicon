/**
 * Digests API
 *
 * GET /api/digests - List digests for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserDigests } from '@/lib/digest';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  try {
    const digests = await getUserDigests(userId, limit);
    return NextResponse.json({ digests });
  } catch (error) {
    console.error('Error fetching digests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch digests' },
      { status: 500 }
    );
  }
}
