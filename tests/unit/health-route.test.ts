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
    expect(body.mode).toBe('production-beta');
    expect(body.checks.supabase).toBe(true);
    expect(body.checks.neo4j).toBe(true);
    expect(body.optional.neo4j.status).toBe('connected');
  });

  it('returns healthy when Neo4j is down (optional service)', async () => {
    mockSupabaseHealthCheck.mockResolvedValue(true);
    mockNeo4jHealthCheck.mockResolvedValue(false);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.checks.supabase).toBe(true);
    expect(body.checks.neo4j).toBe(false);
    expect(body.optional.neo4j.status).toBe('hibernated');
    expect(body.optional.neo4j.required).toBe(false);
  });

  it('returns unhealthy when Supabase is unavailable', async () => {
    mockSupabaseHealthCheck.mockResolvedValue(false);
    mockNeo4jHealthCheck.mockResolvedValue(false);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('unhealthy');
    expect(body.checks.supabase).toBe(false);
  });
});
