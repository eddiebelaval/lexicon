/**
 * Notifications API
 *
 * GET /api/notifications - List notifications for a user
 * POST /api/notifications - Create a notification (internal use)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserNotifications, createNotification } from '@/lib/notifications';
import type { NotificationType } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  try {
    const notifications = await getUserNotifications(userId, {
      unreadOnly,
      limit,
      offset,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userId,
      type,
      title,
      message,
      actionUrl,
      actionLabel,
      digestId,
      storylineId,
      priority,
    } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'userId, type, title, and message are required' },
        { status: 400 }
      );
    }

    const notification = await createNotification({
      userId,
      type: type as NotificationType,
      title,
      message,
      actionUrl,
      actionLabel,
      digestId,
      storylineId,
      priority,
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
