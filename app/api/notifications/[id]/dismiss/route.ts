/**
 * Dismiss Notification API
 *
 * POST /api/notifications/[id]/dismiss - Dismiss a notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { dismissNotification } from '@/lib/notifications';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await dismissNotification(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss notification' },
      { status: 500 }
    );
  }
}
