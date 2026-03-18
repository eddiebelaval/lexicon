/**
 * Activity Log API
 *
 * GET /api/activity?productionId=X&channel=telegram&limit=20
 *
 * Returns recent activity entries for the dashboard feed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecentActivity, getActivityByChannel } from '@/lib/activity-log';
import type { ActivityChannel } from '@/lib/activity-log';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productionId = searchParams.get('productionId');
  const channel = searchParams.get('channel') as ActivityChannel | null;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

  if (!productionId) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'productionId is required' } },
      { status: 400 }
    );
  }

  const entries = channel
    ? await getActivityByChannel(productionId, channel, limit)
    : await getRecentActivity(productionId, limit);

  return NextResponse.json({ success: true, data: entries });
}
