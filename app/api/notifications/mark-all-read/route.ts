/**
 * Mark All Notifications as Read API
 *
 * POST /api/notifications/mark-all-read - Mark all notifications as read for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { markAllAsRead } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    await markAllAsRead(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all as read' },
      { status: 500 }
    );
  }
}
