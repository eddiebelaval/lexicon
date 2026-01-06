/**
 * Health Check API Route
 *
 * Returns status of all backend services
 */

import { NextResponse } from 'next/server';
import { healthCheck as neo4jHealthCheck } from '@/lib/neo4j';

export async function GET() {
  const checks = {
    api: true,
    neo4j: false,
    timestamp: new Date().toISOString(),
  };

  try {
    checks.neo4j = await neo4jHealthCheck();
  } catch {
    checks.neo4j = false;
  }

  const allHealthy = Object.values(checks).every(
    (v) => v === true || typeof v === 'string'
  );

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
