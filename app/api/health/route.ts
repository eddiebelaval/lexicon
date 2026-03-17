/**
 * Health Check API Route
 *
 * Returns status of all backend services
 */

import { NextResponse } from 'next/server';
import { healthCheck as neo4jHealthCheck } from '@/lib/neo4j';
import { healthCheckSupabase } from '@/lib/supabase';

export async function GET() {
  const checks: {
    api: boolean;
    supabase: boolean;
    neo4j: boolean;
    timestamp: string;
  } = {
    api: true,
    supabase: false,
    neo4j: false,
    timestamp: new Date().toISOString(),
  };

  try {
    checks.supabase = await healthCheckSupabase();
  } catch {
    checks.supabase = false;
  }

  try {
    checks.neo4j = await neo4jHealthCheck();
  } catch {
    checks.neo4j = false;
  }

  const betaReady = checks.api && checks.supabase;
  const allHealthy = betaReady && checks.neo4j;
  const status = allHealthy ? 'healthy' : betaReady ? 'degraded' : 'unhealthy';

  return NextResponse.json(
    {
      status,
      betaReady,
      mode: 'production-beta',
      checks,
    },
    { status: betaReady ? 200 : 503 }
  );
}
