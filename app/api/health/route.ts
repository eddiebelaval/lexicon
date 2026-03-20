/**
 * Health Check API Route
 *
 * Returns status of all backend services.
 *
 * In production-beta mode, Supabase is the core dependency.
 * Neo4j is optional (used for knowledge graph features only).
 * Health is determined by core services only.
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

  // Core services: API + Supabase. Neo4j is optional in production-beta.
  const coreHealthy = checks.api && checks.supabase;
  const status = coreHealthy ? 'healthy' : 'unhealthy';

  return NextResponse.json(
    {
      status,
      mode: 'production-beta',
      checks,
      optional: {
        neo4j: {
          status: checks.neo4j ? 'connected' : 'hibernated',
          required: false,
          note: checks.neo4j ? undefined : 'Knowledge graph features unavailable. All production features operational via Supabase.',
        },
      },
    },
    { status: coreHealthy ? 200 : 503 }
  );
}
