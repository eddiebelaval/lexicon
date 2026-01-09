/**
 * Unit tests for lib/entities.ts
 *
 * Tests entity CRUD operations with mocked Neo4j driver.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createEntity,
  getEntity,
  listEntities,
  updateEntity,
  deleteEntity,
  searchEntities,
  getEntityCounts,
  entityExists,
} from '@/lib/entities';
import type { CreateEntityInput, EntityType } from '@/types';

// Mock the neo4j module
vi.mock('@/lib/neo4j', () => ({
  readQuery: vi.fn(),
  writeQuery: vi.fn(),
}));

// Mock the utils module for deterministic IDs
vi.mock('@/lib/utils', () => ({
  generateId: vi.fn(() => 'test-entity-id'),
  cn: vi.fn((...args) => args.filter(Boolean).join(' ')),
  formatDate: vi.fn((date) => date?.toString()),
  capitalize: vi.fn((str) => str),
}));

// Import mocked modules
import { readQuery, writeQuery } from '@/lib/neo4j';

const mockReadQuery = vi.mocked(readQuery);
const mockWriteQuery = vi.mocked(writeQuery);

// Sample entity data for tests
const sampleEntityRaw = {
  id: 'test-entity-id',
  type: 'character',
  name: "D'Artagnan",
  aliases: ['Gascon', 'Young Musketeer'],
  description: 'A young man from Gascony who dreams of becoming a musketeer.',
  status: 'active',
  imageUrl: 'https://example.com/dartagnan.jpg',
  metadata: '{"birthplace": "Gascony"}',
  universeId: 'universe-123',
  createdAt: '2026-01-08T10:00:00.000Z',
  updatedAt: '2026-01-08T10:00:00.000Z',
};

const sampleCreateInput: CreateEntityInput = {
  type: 'character',
  name: "D'Artagnan",
  aliases: ['Gascon', 'Young Musketeer'],
  description: 'A young man from Gascony who dreams of becoming a musketeer.',
  status: 'active',
  imageUrl: 'https://example.com/dartagnan.jpg',
  metadata: { birthplace: 'Gascony' },
  universeId: 'universe-123',
};

describe('lib/entities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createEntity', () => {
    it('should create an entity with all fields', async () => {
      mockWriteQuery.mockResolvedValue([{ e: sampleEntityRaw }]);

      const result = await createEntity(sampleCreateInput);

      expect(result.id).toBe('test-entity-id');
      expect(result.name).toBe("D'Artagnan");
      expect(result.type).toBe('character');
      expect(result.aliases).toEqual(['Gascon', 'Young Musketeer']);
      expect(result.description).toBe(sampleCreateInput.description);
      expect(result.status).toBe('active');
      expect(result.imageUrl).toBe('https://example.com/dartagnan.jpg');
      expect(result.universeId).toBe('universe-123');

      // Verify the write query was called
      expect(mockWriteQuery).toHaveBeenCalledTimes(1);
      expect(mockWriteQuery).toHaveBeenCalledWith(
        expect.stringContaining('CREATE (e:Entity'),
        expect.objectContaining({
          id: 'test-entity-id',
          type: 'character',
          name: "D'Artagnan",
          universeId: 'universe-123',
        })
      );
    });

    it('should use default values for optional fields', async () => {
      const minimalInput: CreateEntityInput = {
        type: 'location',
        name: 'Paris',
        description: 'The capital city of France.',
        universeId: 'universe-123',
      };

      mockWriteQuery.mockResolvedValue([
        {
          e: {
            ...sampleEntityRaw,
            type: 'location',
            name: 'Paris',
            aliases: [],
            description: 'The capital city of France.',
            imageUrl: null,
            metadata: '{}',
          },
        },
      ]);

      const result = await createEntity(minimalInput);

      expect(result.type).toBe('location');
      expect(result.name).toBe('Paris');
      expect(result.aliases).toEqual([]);
      expect(result.status).toBe('active');

      // Verify defaults were passed to query
      expect(mockWriteQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          aliases: [],
          status: 'active',
          imageUrl: null,
          metadata: '{}',
        })
      );
    });

    it('should throw error when create fails', async () => {
      mockWriteQuery.mockResolvedValue([]);

      await expect(createEntity(sampleCreateInput)).rejects.toThrow(
        'Failed to create entity'
      );
    });
  });

  describe('getEntity', () => {
    it('should return entity when found', async () => {
      mockReadQuery.mockResolvedValue([{ e: sampleEntityRaw }]);

      const result = await getEntity('test-entity-id');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-entity-id');
      expect(result?.name).toBe("D'Artagnan");

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (e:Entity {id: $id})'),
        { id: 'test-entity-id' }
      );
    });

    it('should return null when entity not found', async () => {
      mockReadQuery.mockResolvedValue([]);

      const result = await getEntity('non-existent-id');

      expect(result).toBeNull();
    });

    it('should parse metadata from JSON string', async () => {
      mockReadQuery.mockResolvedValue([{ e: sampleEntityRaw }]);

      const result = await getEntity('test-entity-id');

      expect(result?.metadata).toEqual({ birthplace: 'Gascony' });
    });

    it('should handle empty metadata', async () => {
      mockReadQuery.mockResolvedValue([
        { e: { ...sampleEntityRaw, metadata: null } },
      ]);

      const result = await getEntity('test-entity-id');

      expect(result?.metadata).toEqual({});
    });
  });

  describe('listEntities', () => {
    it('should list entities with default options', async () => {
      mockReadQuery
        .mockResolvedValueOnce([{ count: 3 }]) // Count query
        .mockResolvedValueOnce([
          { e: sampleEntityRaw },
          { e: { ...sampleEntityRaw, id: 'entity-2', name: 'Athos' } },
          { e: { ...sampleEntityRaw, id: 'entity-3', name: 'Porthos' } },
        ]);

      const result = await listEntities('universe-123');

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(50);
      expect(result.hasMore).toBe(false);
    });

    it('should filter by type', async () => {
      mockReadQuery
        .mockResolvedValueOnce([{ count: 2 }])
        .mockResolvedValueOnce([
          { e: sampleEntityRaw },
          { e: { ...sampleEntityRaw, id: 'entity-2' } },
        ]);

      await listEntities('universe-123', { type: 'character' });

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.stringContaining('e.type = $type'),
        expect.objectContaining({ type: 'character' })
      );
    });

    it('should filter by status', async () => {
      mockReadQuery
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([{ e: sampleEntityRaw }]);

      await listEntities('universe-123', { status: 'active' });

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.stringContaining('e.status = $status'),
        expect.objectContaining({ status: 'active' })
      );
    });

    it('should handle pagination', async () => {
      mockReadQuery
        .mockResolvedValueOnce([{ count: 100 }])
        .mockResolvedValueOnce([{ e: sampleEntityRaw }]);

      const result = await listEntities('universe-123', {
        limit: 10,
        offset: 20,
      });

      expect(result.page).toBe(3); // offset 20 / limit 10 + 1 = 3
      expect(result.hasMore).toBe(true); // 20 + 1 < 100
    });

    it('should support sorting', async () => {
      mockReadQuery
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([{ e: sampleEntityRaw }]);

      await listEntities('universe-123', {
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY e.createdAt DESC'),
        expect.any(Object)
      );
    });
  });

  describe('updateEntity', () => {
    it('should update specific fields', async () => {
      const updatedRaw = {
        ...sampleEntityRaw,
        name: "D'Artagnan the Brave",
        description: 'Updated description',
      };
      mockWriteQuery.mockResolvedValue([{ e: updatedRaw }]);

      const result = await updateEntity('test-entity-id', {
        name: "D'Artagnan the Brave",
        description: 'Updated description',
      });

      expect(result?.name).toBe("D'Artagnan the Brave");
      expect(result?.description).toBe('Updated description');

      // Should only set the fields that were provided
      expect(mockWriteQuery).toHaveBeenCalledWith(
        expect.stringContaining('e.name = $name'),
        expect.objectContaining({ name: "D'Artagnan the Brave" })
      );
    });

    it('should return null when entity not found', async () => {
      mockWriteQuery.mockResolvedValue([]);

      const result = await updateEntity('non-existent-id', { name: 'New Name' });

      expect(result).toBeNull();
    });

    it('should update aliases array', async () => {
      mockWriteQuery.mockResolvedValue([
        {
          e: {
            ...sampleEntityRaw,
            aliases: ['New Alias 1', 'New Alias 2'],
          },
        },
      ]);

      const result = await updateEntity('test-entity-id', {
        aliases: ['New Alias 1', 'New Alias 2'],
      });

      expect(result?.aliases).toEqual(['New Alias 1', 'New Alias 2']);
    });

    it('should update status', async () => {
      mockWriteQuery.mockResolvedValue([
        { e: { ...sampleEntityRaw, status: 'deceased' } },
      ]);

      const result = await updateEntity('test-entity-id', {
        status: 'deceased',
      });

      expect(result?.status).toBe('deceased');
    });

    it('should serialize metadata to JSON', async () => {
      mockWriteQuery.mockResolvedValue([{ e: sampleEntityRaw }]);

      await updateEntity('test-entity-id', {
        metadata: { newKey: 'newValue' },
      });

      expect(mockWriteQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ metadata: '{"newKey":"newValue"}' })
      );
    });
  });

  describe('deleteEntity', () => {
    it('should return true when entity deleted', async () => {
      mockWriteQuery.mockResolvedValue([{ deleted: 1 }]);

      const result = await deleteEntity('test-entity-id');

      expect(result).toBe(true);
      expect(mockWriteQuery).toHaveBeenCalledWith(
        expect.stringContaining('DETACH DELETE e'),
        { id: 'test-entity-id' }
      );
    });

    it('should return false when entity not found', async () => {
      mockWriteQuery.mockResolvedValue([{ deleted: 0 }]);

      const result = await deleteEntity('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('searchEntities', () => {
    it('should search by name pattern', async () => {
      mockReadQuery.mockResolvedValue([
        { e: sampleEntityRaw },
        { e: { ...sampleEntityRaw, id: 'entity-2', name: 'Aramis' } },
      ]);

      const results = await searchEntities('universe-123', 'art');

      expect(results).toHaveLength(2);
      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.stringContaining('e.name =~ $pattern'),
        expect.objectContaining({ pattern: '(?i).*art.*' })
      );
    });

    it('should filter by type when specified', async () => {
      mockReadQuery.mockResolvedValue([{ e: sampleEntityRaw }]);

      await searchEntities('universe-123', 'test', { type: 'character' });

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.stringContaining('e.type = $type'),
        expect.objectContaining({ type: 'character' })
      );
    });

    it('should escape special regex characters', async () => {
      mockReadQuery.mockResolvedValue([]);

      await searchEntities('universe-123', 'test.*query');

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ pattern: '(?i).*test\\.\\*query.*' })
      );
    });

    it('should respect limit option', async () => {
      mockReadQuery.mockResolvedValue([]);

      await searchEntities('universe-123', 'test', { limit: 5 });

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ limit: 5 })
      );
    });

    it('should use default limit of 20', async () => {
      mockReadQuery.mockResolvedValue([]);

      await searchEntities('universe-123', 'test');

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ limit: 20 })
      );
    });
  });

  describe('getEntityCounts', () => {
    it('should return counts for all entity types', async () => {
      mockReadQuery.mockResolvedValue([
        { type: 'character', count: 10 },
        { type: 'location', count: 5 },
        { type: 'event', count: 3 },
      ]);

      const counts = await getEntityCounts('universe-123');

      expect(counts).toEqual({
        character: 10,
        location: 5,
        event: 3,
        object: 0,
        faction: 0,
      });
    });

    it('should return zeros when no entities exist', async () => {
      mockReadQuery.mockResolvedValue([]);

      const counts = await getEntityCounts('universe-123');

      expect(counts).toEqual({
        character: 0,
        location: 0,
        event: 0,
        object: 0,
        faction: 0,
      });
    });

    it('should ignore unknown entity types', async () => {
      mockReadQuery.mockResolvedValue([
        { type: 'character', count: 5 },
        { type: 'unknown_type' as EntityType, count: 10 },
      ]);

      const counts = await getEntityCounts('universe-123');

      expect(counts.character).toBe(5);
      // Unknown type should not appear
      expect('unknown_type' in counts).toBe(false);
    });
  });

  describe('entityExists', () => {
    it('should return true when entity exists', async () => {
      mockReadQuery.mockResolvedValue([{ exists: true }]);

      const exists = await entityExists('test-entity-id');

      expect(exists).toBe(true);
    });

    it('should return false when entity does not exist', async () => {
      mockReadQuery.mockResolvedValue([{ exists: false }]);

      const exists = await entityExists('non-existent-id');

      expect(exists).toBe(false);
    });

    it('should handle empty results', async () => {
      mockReadQuery.mockResolvedValue([]);

      const exists = await entityExists('test-id');

      expect(exists).toBe(false);
    });
  });

  describe('date parsing', () => {
    it('should parse ISO string dates', async () => {
      mockReadQuery.mockResolvedValue([{ e: sampleEntityRaw }]);

      const result = await getEntity('test-entity-id');

      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle Neo4j DateTime objects', async () => {
      const neo4jDateTime = {
        toString: () => '2026-01-08T10:00:00.000Z',
      };

      mockReadQuery.mockResolvedValue([
        {
          e: {
            ...sampleEntityRaw,
            createdAt: neo4jDateTime,
            updatedAt: neo4jDateTime,
          },
        },
      ]);

      const result = await getEntity('test-entity-id');

      expect(result?.createdAt).toBeInstanceOf(Date);
    });

    it('should use current date for null dates', async () => {
      mockReadQuery.mockResolvedValue([
        {
          e: { ...sampleEntityRaw, createdAt: null, updatedAt: null },
        },
      ]);

      const before = new Date();
      const result = await getEntity('test-entity-id');
      const after = new Date();

      expect(result?.createdAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(result?.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('metadata parsing', () => {
    it('should parse JSON string metadata', async () => {
      mockReadQuery.mockResolvedValue([
        {
          e: { ...sampleEntityRaw, metadata: '{"key": "value"}' },
        },
      ]);

      const result = await getEntity('test-entity-id');

      expect(result?.metadata).toEqual({ key: 'value' });
    });

    it('should handle object metadata', async () => {
      mockReadQuery.mockResolvedValue([
        {
          e: { ...sampleEntityRaw, metadata: { key: 'value' } },
        },
      ]);

      const result = await getEntity('test-entity-id');

      expect(result?.metadata).toEqual({ key: 'value' });
    });

    it('should return empty object for invalid JSON', async () => {
      mockReadQuery.mockResolvedValue([
        {
          e: { ...sampleEntityRaw, metadata: 'invalid-json' },
        },
      ]);

      const result = await getEntity('test-entity-id');

      expect(result?.metadata).toEqual({});
    });
  });
});
