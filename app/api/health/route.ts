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
    neo4j_error?: string;
    env_check?: {
      uri: boolean;
      username: boolean;
      password: boolean;
      password_length: number;
      password_preview: string;
    };
  } = {
    api: true,
    neo4j: false,
    timestamp: new Date().toISOString(),
  };

  // Debug: check if env vars are set and their format
  const password = process.env.NEO4J_PASSWORD || '';
  checks.env_check = {
    uri: !!process.env.NEO4J_URI,
    username: !!process.env.NEO4J_USERNAME,
    password: !!process.env.NEO4J_PASSWORD,
    password_length: password.length,
    password_preview: password.length > 0 ? `${password[0]}...${password.slice(-3)}` : 'empty',
  };

  try {
    checks.neo4j = await neo4jHealthCheck();
  } catch (error) {
    checks.neo4j = false;
    checks.neo4j_error = error instanceof Error ? error.message : 'Unknown error';
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
