/**
 * Notification Count API
 *
 * GET /api/notifications/count - Get unread notification count
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUnreadCount } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  try {
    const count = await getUnreadCount(userId);
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
