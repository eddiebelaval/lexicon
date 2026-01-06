/**
 * Health Check API Route
 *
 * Returns status of all backend services
 */

import { NextResponse } from 'next/server';
import { healthCheck as neo4jHealthCheck } from '@/lib/neo4j';

export async function GET() {
  const checks: {
    api: boolean;
    neo4j: boolean;
    timestamp: string;
  } = {
    api: true,
    neo4j: false,
    timestamp: new Date().toISOString(),
  };

  try {
    checks.neo4j = await neo4jHealthCheck();
  } catch {
    checks.neo4j = false;
  }

  const allHealthy = checks.api && checks.neo4j;

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
