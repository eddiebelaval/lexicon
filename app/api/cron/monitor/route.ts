/**
 * Daily Monitoring Cron Job
 *
 * Runs at 6 AM daily via Vercel Cron.
 * Searches for news about cast members and stores relevant updates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runMonitoringJob } from '@/lib/monitoring';
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
 * Vercel Cron always uses GET requests
 */
export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    console.error('[Cron] Unauthorized monitoring request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Cron] Starting daily monitoring job');

  try {
    // Get all universes that have monitoring enabled
    // For now, get universes that have storylines
    const supabase = getSupabase();

    const { data: universes, error } = await supabase
      .from('universes')
      .select('id, name')
      .order('updated_at', { ascending: false })
      .limit(10); // Limit to prevent timeout

    if (error) {
      throw new Error(`Failed to fetch universes: ${error.message}`);
    }

    if (!universes || universes.length === 0) {
      console.log('[Cron] No universes found for monitoring');
      return NextResponse.json({
        success: true,
        message: 'No universes to monitor',
        results: [],
      });
    }

    // Run monitoring for each universe
    const results = [];

    for (const universe of universes) {
      console.log(`[Cron] Monitoring universe: ${universe.name}`);

      try {
        const result = await runMonitoringJob({
          universeId: universe.id,
          castNames: [], // Will be fetched from entities
          storylineIds: [], // Will be fetched
        });

        results.push({
          universeId: universe.id,
          universeName: universe.name,
          success: true,
          stats: {
            castsSearched: result.castsSearched,
            rawResultsFound: result.rawResultsFound,
            relevantUpdates: result.relevantUpdates,
            updatesStored: result.updatesStored,
          },
          errors: result.errors.length,
          duration: result.completedAt.getTime() - result.startedAt.getTime(),
        });
      } catch (universeError) {
        console.error(`[Cron] Error monitoring ${universe.name}:`, universeError);
        results.push({
          universeId: universe.id,
          universeName: universe.name,
          success: false,
          error:
            universeError instanceof Error
              ? universeError.message
              : 'Unknown error',
        });
      }
    }

    console.log('[Cron] Daily monitoring completed');

    return NextResponse.json({
      success: true,
      message: `Monitored ${universes.length} universes`,
      results,
    });
  } catch (error) {
    console.error('[Cron] Monitoring job failed:', error);

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
