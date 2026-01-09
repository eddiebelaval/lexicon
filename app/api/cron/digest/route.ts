/**
 * Daily Digest Cron Job
 *
 * Runs at 7 AM daily via Vercel Cron (1 hour after monitoring).
 * Generates and delivers digest summaries to users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createUserDigest } from '@/lib/digest';
import { getSupabase } from '@/lib/supabase';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('[Cron] CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET handler for Vercel Cron
 */
export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    console.error('[Cron] Unauthorized digest request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Cron] Starting daily digest generation');

  try {
    const supabase = getSupabase();

    // Get users who have email digests enabled
    // For now, get all users with universes
    const { data: users, error } = await supabase
      .from('universes')
      .select('owner_id')
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    // Deduplicate user IDs
    const uniqueUserIds = [...new Set(users?.map((u) => u.owner_id) || [])];

    if (uniqueUserIds.length === 0) {
      console.log('[Cron] No users found for digest');
      return NextResponse.json({
        success: true,
        message: 'No users for digest',
        results: [],
      });
    }

    console.log(`[Cron] Generating digests for ${uniqueUserIds.length} users`);

    // Generate digests for each user
    const results = [];

    for (const userId of uniqueUserIds) {
      try {
        const digest = await createUserDigest(userId);

        if (digest) {
          results.push({
            userId,
            success: true,
            digestId: digest.id,
            updatesCount: digest.updatesCount,
            storylinesCount: digest.storylinesCount,
          });

          // TODO: Send email notification if user preferences allow
          // await sendDigestEmail(userId, digest);

          console.log(`[Cron] Created digest for user ${userId}: ${digest.updatesCount} updates`);
        } else {
          results.push({
            userId,
            success: true,
            digestId: null,
            message: 'No updates for digest',
          });
        }
      } catch (userError) {
        console.error(`[Cron] Error creating digest for user ${userId}:`, userError);
        results.push({
          userId,
          success: false,
          error:
            userError instanceof Error ? userError.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success && r.digestId).length;

    console.log(`[Cron] Daily digest completed: ${successCount} digests created`);

    return NextResponse.json({
      success: true,
      message: `Generated ${successCount} digests for ${uniqueUserIds.length} users`,
      results,
    });
  } catch (error) {
    console.error('[Cron] Digest job failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Configure max duration for Vercel
export const maxDuration = 300; // 5 minutes

// Disable static generation
export const dynamic = 'force-dynamic';
