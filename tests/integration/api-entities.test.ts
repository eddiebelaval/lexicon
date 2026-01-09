/**
 * Integration tests for /api/entities routes
 *
 * Tests HTTP layer with mocked database operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/entities/route';
import {
  GET as GET_BY_ID,
  PUT,
  DELETE,
} from '@/app/api/entities/[id]/route';

// Mock the entities library
vi.mock('@/lib/entities', () => ({
  createEntity: vi.fn(),
  getEntity: vi.fn(),
  listEntities: vi.fn(),
  searchEntities: vi.fn(),
  updateEntity: vi.fn(),
  deleteEntity: vi.fn(),
}));

import {
  createEntity,
  getEntity,
  listEntities,
  searchEntities,
  updateEntity,
  deleteEntity,
} from '@/lib/entities';

const mockCreateEntity = vi.mocked(createEntity);
const mockGetEntity = vi.mocked(getEntity);
const mockListEntities = vi.mocked(listEntities);
const mockSearchEntities = vi.mocked(searchEntities);
const mockUpdateEntity = vi.mocked(updateEntity);
const mockDeleteEntity = vi.mocked(deleteEntity);

// Use valid UUIDs for testing (validation requires UUID format)
const UNIVERSE_ID = '550e8400-e29b-41d4-a716-446655440000';
const ENTITY_ID = '550e8400-e29b-41d4-a716-446655440001';

// Sample entity data
const sampleEntity = {
  id: ENTITY_ID,
  type: 'character' as const,
  name: "D'Artagnan",
  aliases: ['Gascon'],
  description: 'A young musketeer',
  status: 'active' as const,
  imageUrl: undefined,
  metadata: {},
  universeId: UNIVERSE_ID,
  createdAt: new Date('2026-01-08T10:00:00.000Z'),
  updatedAt: new Date('2026-01-08T10:00:00.000Z'),
};

// Helper to create mock NextRequest
function createRequest(
  url: string,
  options: { method?: string; body?: unknown } = {}
): NextRequest {
  const { method = 'GET', body } = options;
  const init: { method: string; body?: string; headers?: Record<string, string> } = { method };

  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }

  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

describe('/api/entities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/entities', () => {
    it('should create entity with valid data', async () => {
      mockCreateEntity.mockResolvedValue(sampleEntity);

      const request = createRequest('http://localhost:3000/api/entities', {
        method: 'POST',
        body: {
          type: 'character',
          name: "D'Artagnan",
          description: 'A young musketeer',
          universeId: UNIVERSE_ID,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("D'Artagnan");
    });

    it('should return 400 for missing required fields', async () => {
      const request = createRequest('http://localhost:3000/api/entities', {
        method: 'POST',
        body: {
          type: 'character',
          // Missing name, description, universeId
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid entity type', async () => {
      const request = createRequest('http://localhost:3000/api/entities', {
        method: 'POST',
        body: {
          type: 'invalid_type',
          name: 'Test',
          description: 'Test description',
          universeId: UNIVERSE_ID,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 500 on database error', async () => {
      mockCreateEntity.mockRejectedValue(new Error('Database error'));

      const request = createRequest('http://localhost:3000/api/entities', {
        method: 'POST',
        body: {
          type: 'character',
          name: "D'Artagnan",
          description: 'A young musketeer',
          universeId: UNIVERSE_ID,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('GET /api/entities (list)', () => {
    it('should list entities for a universe', async () => {
      mockListEntities.mockResolvedValue({
        items: [sampleEntity],
        total: 1,
        page: 1,
        pageSize: 50,
        hasMore: false,
      });

      const request = createRequest(
        `http://localhost:3000/api/entities?universeId=${UNIVERSE_ID}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.items).toHaveLength(1);
      expect(data.data.total).toBe(1);
    });

    it('should filter by type', async () => {
      mockListEntities.mockResolvedValue({
        items: [sampleEntity],
        total: 1,
        page: 1,
        pageSize: 50,
        hasMore: false,
      });

      const request = createRequest(
        `http://localhost:3000/api/entities?universeId=${UNIVERSE_ID}&type=character`
      );

      await GET(request);

      expect(mockListEntities).toHaveBeenCalledWith(
        UNIVERSE_ID,
        expect.objectContaining({ type: 'character' })
      );
    });

    it('should handle search with q parameter', async () => {
      mockSearchEntities.mockResolvedValue([sampleEntity]);

      const request = createRequest(
        `http://localhost:3000/api/entities?universeId=${UNIVERSE_ID}&q=artagnan`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSearchEntities).toHaveBeenCalledWith(
        UNIVERSE_ID,
        'artagnan',
        expect.any(Object)
      );
    });

    it('should return 400 for missing universeId', async () => {
      const request = createRequest('http://localhost:3000/api/entities');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should support pagination', async () => {
      mockListEntities.mockResolvedValue({
        items: [sampleEntity],
        total: 100,
        page: 3,
        pageSize: 10,
        hasMore: true,
      });

      const request = createRequest(
        `http://localhost:3000/api/entities?universeId=${UNIVERSE_ID}&limit=10&offset=20`
      );

      await GET(request);

      expect(mockListEntities).toHaveBeenCalledWith(
        UNIVERSE_ID,
        expect.objectContaining({ limit: 10, offset: 20 })
      );
    });
  });

  describe('GET /api/entities/[id]', () => {
    it('should return entity by ID', async () => {
      mockGetEntity.mockResolvedValue(sampleEntity);

      const request = createRequest(
        `http://localhost:3000/api/entities/${ENTITY_ID}`
      );
      const context = { params: Promise.resolve({ id: ENTITY_ID }) };

      const response = await GET_BY_ID(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(ENTITY_ID);
    });

    it('should return 404 for non-existent entity', async () => {
      mockGetEntity.mockResolvedValue(null);

      const nonExistentId = '550e8400-e29b-41d4-a716-446655449999';
      const request = createRequest(
        `http://localhost:3000/api/entities/${nonExistentId}`
      );
      const context = { params: Promise.resolve({ id: nonExistentId }) };

      const response = await GET_BY_ID(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('ENTITY_NOT_FOUND');
    });
  });

  describe('PUT /api/entities/[id]', () => {
    it('should update entity with valid data', async () => {
      const updatedEntity = { ...sampleEntity, name: 'Updated Name' };
      mockUpdateEntity.mockResolvedValue(updatedEntity);

      const request = createRequest(
        `http://localhost:3000/api/entities/${ENTITY_ID}`,
        {
          method: 'PUT',
          body: { name: 'Updated Name' },
        }
      );
      const context = { params: Promise.resolve({ id: ENTITY_ID }) };

      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Updated Name');
    });

    it('should return 404 when updating non-existent entity', async () => {
      mockUpdateEntity.mockResolvedValue(null);

      const nonExistentId = '550e8400-e29b-41d4-a716-446655449999';
      const request = createRequest(
        `http://localhost:3000/api/entities/${nonExistentId}`,
        {
          method: 'PUT',
          body: { name: 'Updated Name' },
        }
      );
      const context = { params: Promise.resolve({ id: nonExistentId }) };

      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('ENTITY_NOT_FOUND');
    });

    it('should return 400 for invalid update data', async () => {
      const request = createRequest(
        `http://localhost:3000/api/entities/${ENTITY_ID}`,
        {
          method: 'PUT',
          body: { status: 'invalid_status' },
        }
      );
      const context = { params: Promise.resolve({ id: ENTITY_ID }) };

      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/entities/[id]', () => {
    it('should delete entity', async () => {
      mockDeleteEntity.mockResolvedValue(true);

      const request = createRequest(
        `http://localhost:3000/api/entities/${ENTITY_ID}`,
        { method: 'DELETE' }
      );
      const context = { params: Promise.resolve({ id: ENTITY_ID }) };

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.deleted).toBe(true);
    });

    it('should return 404 when deleting non-existent entity', async () => {
      mockDeleteEntity.mockResolvedValue(false);

      const nonExistentId = '550e8400-e29b-41d4-a716-446655449999';
      const request = createRequest(
        `http://localhost:3000/api/entities/${nonExistentId}`,
        { method: 'DELETE' }
      );
      const context = { params: Promise.resolve({ id: nonExistentId }) };

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('ENTITY_NOT_FOUND');
    });
  });
});
