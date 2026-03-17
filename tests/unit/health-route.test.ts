import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/health/route';

vi.mock('@/lib/neo4j', () => ({
  healthCheck: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  healthCheckSupabase: vi.fn(),
}));

import { healthCheck as neo4jHealthCheck } from '@/lib/neo4j';
import { healthCheckSupabase } from '@/lib/supabase';

const mockNeo4jHealthCheck = vi.mocked(neo4jHealthCheck);
const mockSupabaseHealthCheck = vi.mocked(healthCheckSupabase);

describe('/api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns healthy when core and optional services are available', async () => {
    mockSupabaseHealthCheck.mockResolvedValue(true);
    mockNeo4jHealthCheck.mockResolvedValue(true);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.betaReady).toBe(true);
    expect(body.checks.supabase).toBe(true);
    expect(body.checks.neo4j).toBe(true);
  });

  it('returns degraded but beta-ready when Neo4j is down', async () => {
    mockSupabaseHealthCheck.mockResolvedValue(true);
    mockNeo4jHealthCheck.mockResolvedValue(false);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('degraded');
    expect(body.betaReady).toBe(true);
    expect(body.checks.supabase).toBe(true);
    expect(body.checks.neo4j).toBe(false);
  });

  it('returns unhealthy when Supabase is unavailable', async () => {
    mockSupabaseHealthCheck.mockResolvedValue(false);
    mockNeo4jHealthCheck.mockResolvedValue(false);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('unhealthy');
    expect(body.betaReady).toBe(false);
    expect(body.checks.supabase).toBe(false);
  });
});
