/**
 * Mark Notification as Read API
 *
 * POST /api/notifications/[id]/read - Mark a notification as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { markAsRead } from '@/lib/notifications';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await markAsRead(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
