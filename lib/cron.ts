/**
 * Shared Cron Utilities
 */

import { NextRequest } from 'next/server';

/**
 * Verify the CRON_SECRET authorization header.
 * Used by all Vercel cron routes to prevent unauthorized access.
 */
export function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    console.warn('[Cron] CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}
