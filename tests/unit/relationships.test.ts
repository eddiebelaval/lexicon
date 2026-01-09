/**
 * Unit tests for lib/relationships.ts
 *
 * Tests relationship CRUD operations with mocked Neo4j driver.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createRelationship,
  getRelationship,
  listRelationships,
  updateRelationship,
  deleteRelationship,
  getEntityRelationships,
  getRelationshipCounts,
  relationshipExists,
} from '@/lib/relationships';
import type { CreateRelationshipInput, RelationshipType } from '@/types';

// Mock the neo4j module
vi.mock('@/lib/neo4j', () => ({
  readQuery: vi.fn(),
  writeQuery: vi.fn(),
}));

// Mock the utils module for deterministic IDs
vi.mock('@/lib/utils', () => ({
  generateId: vi.fn(() => 'test-relationship-id'),
  cn: vi.fn((...args) => args.filter(Boolean).join(' ')),
  formatDate: vi.fn((date) => date?.toString()),
  capitalize: vi.fn((str) => str),
}));

// Import mocked modules
import { readQuery, writeQuery } from '@/lib/neo4j';

const mockReadQuery = vi.mocked(readQuery);
const mockWriteQuery = vi.mocked(writeQuery);

// Sample entity data for tests
const sampleSourceEntity = {
  id: 'entity-source-id',
  type: 'character',
  name: "D'Artagnan",
  aliases: ['Gascon'],
  description: 'A young musketeer',
  status: 'active',
  imageUrl: null,
  metadata: '{}',
  universeId: 'universe-123',
  createdAt: '2026-01-08T10:00:00.000Z',
  updatedAt: '2026-01-08T10:00:00.000Z',
};

const sampleTargetEntity = {
  id: 'entity-target-id',
  type: 'character',
  name: 'Athos',
  aliases: ['Comte de la Fère'],
  description: 'A noble musketeer',
  status: 'active',
  imageUrl: null,
  metadata: '{}',
  universeId: 'universe-123',
  createdAt: '2026-01-08T10:00:00.000Z',
  updatedAt: '2026-01-08T10:00:00.000Z',
};

const sampleRelationshipRaw = {
  id: 'test-relationship-id',
  type: 'knows',
  context: 'Met during a sword fight',
  strength: 4,
  startDate: '1625-01-01',
  endDate: null,
  ongoing: true,
  metadata: '{"place": "Paris"}',
  createdAt: '2026-01-08T10:00:00.000Z',
  updatedAt: '2026-01-08T10:00:00.000Z',
};

const sampleCreateInput: CreateRelationshipInput = {
  sourceId: 'entity-source-id',
  targetId: 'entity-target-id',
  type: 'knows',
  context: 'Met during a sword fight',
  strength: 4,
  startDate: '1625-01-01',
  ongoing: true,
  metadata: { place: 'Paris' },
};

describe('lib/relationships', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRelationship', () => {
    it('should create a relationship with all fields', async () => {
      mockWriteQuery.mockResolvedValue([
        {
          r: sampleRelationshipRaw,
          source: sampleSourceEntity,
          target: sampleTargetEntity,
        },
      ]);

      const result = await createRelationship(sampleCreateInput);

      expect(result.id).toBe('test-relationship-id');
      expect(result.type).toBe('knows');
      expect(result.sourceId).toBe('entity-source-id');
      expect(result.targetId).toBe('entity-target-id');
      expect(result.context).toBe('Met during a sword fight');
      expect(result.strength).toBe(4);
      expect(result.ongoing).toBe(true);

      // Verify source and target entities are included
      expect(result.source.name).toBe("D'Artagnan");
      expect(result.target.name).toBe('Athos');

      // Verify the write query was called
      expect(mockWriteQuery).toHaveBeenCalledTimes(1);
      expect(mockWriteQuery).toHaveBeenCalledWith(
        expect.stringContaining('CREATE (source)-[r:RELATES_TO'),
        expect.objectContaining({
          id: 'test-relationship-id',
          sourceId: 'entity-source-id',
          targetId: 'entity-target-id',
          type: 'knows',
        })
      );
    });

    it('should use default values for optional fields', async () => {
      const minimalInput: CreateRelationshipInput = {
        sourceId: 'entity-source-id',
        targetId: 'entity-target-id',
        type: 'knows',
      };

      mockWriteQuery.mockResolvedValue([
        {
          r: { ...sampleRelationshipRaw, context: '', strength: 3 },
          source: sampleSourceEntity,
          target: sampleTargetEntity,
        },
      ]);

      const result = await createRelationship(minimalInput);

      expect(result.strength).toBe(3); // Default strength
      expect(result.context).toBe(''); // Default context

      // Verify defaults were passed to query
      expect(mockWriteQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          context: '',
          strength: 3,
          ongoing: true,
          metadata: '{}',
        })
      );
    });

    it('should throw error when entities do not exist', async () => {
      mockWriteQuery.mockResolvedValue([]);

      await expect(createRelationship(sampleCreateInput)).rejects.toThrow(
        'Failed to create relationship. Ensure both source and target entities exist.'
      );
    });
  });

  describe('getRelationship', () => {
    it('should return relationship when found', async () => {
      mockReadQuery.mockResolvedValue([
        {
          r: sampleRelationshipRaw,
          source: sampleSourceEntity,
          target: sampleTargetEntity,
        },
      ]);

      const result = await getRelationship('test-relationship-id');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-relationship-id');
      expect(result?.type).toBe('knows');
      expect(result?.source.name).toBe("D'Artagnan");
      expect(result?.target.name).toBe('Athos');

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (source:Entity)-[r:RELATES_TO {id: $id}]->(target:Entity)'),
        { id: 'test-relationship-id' }
      );
    });

    it('should return null when relationship not found', async () => {
      mockReadQuery.mockResolvedValue([]);

      const result = await getRelationship('non-existent-id');

      expect(result).toBeNull();
    });

    it('should parse metadata from JSON string', async () => {
      mockReadQuery.mockResolvedValue([
        {
          r: sampleRelationshipRaw,
          source: sampleSourceEntity,
          target: sampleTargetEntity,
        },
      ]);

      const result = await getRelationship('test-relationship-id');

      expect(result?.metadata).toEqual({ place: 'Paris' });
    });
  });

  describe('listRelationships', () => {
    it('should list relationships with default options', async () => {
      mockReadQuery
        .mockResolvedValueOnce([{ count: 3 }]) // Count query
        .mockResolvedValueOnce([
          {
            r: sampleRelationshipRaw,
            source: sampleSourceEntity,
            target: sampleTargetEntity,
          },
          {
            r: { ...sampleRelationshipRaw, id: 'rel-2', type: 'opposes' },
            source: sampleSourceEntity,
            target: sampleTargetEntity,
          },
          {
            r: { ...sampleRelationshipRaw, id: 'rel-3', type: 'loves' },
            source: sampleSourceEntity,
            target: sampleTargetEntity,
          },
        ]);

      const result = await listRelationships('universe-123');

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(50);
      expect(result.hasMore).toBe(false);
    });

    it('should filter by entityId', async () => {
      mockReadQuery
        .mockResolvedValueOnce([{ count: 2 }])
        .mockResolvedValueOnce([
          {
            r: sampleRelationshipRaw,
            source: sampleSourceEntity,
            target: sampleTargetEntity,
          },
        ]);

      await listRelationships('universe-123', { entityId: 'entity-source-id' });

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.stringContaining('source.id = $entityId OR target.id = $entityId'),
        expect.objectContaining({ entityId: 'entity-source-id' })
      );
    });

    it('should filter by type', async () => {
      mockReadQuery
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([
          {
            r: sampleRelationshipRaw,
            source: sampleSourceEntity,
            target: sampleTargetEntity,
          },
        ]);

      await listRelationships('universe-123', { type: 'knows' });

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.stringContaining('r.type = $type'),
        expect.objectContaining({ type: 'knows' })
      );
    });

    it('should handle pagination', async () => {
      mockReadQuery
        .mockResolvedValueOnce([{ count: 100 }])
        .mockResolvedValueOnce([
          {
            r: sampleRelationshipRaw,
            source: sampleSourceEntity,
            target: sampleTargetEntity,
          },
        ]);

      const result = await listRelationships('universe-123', {
        limit: 10,
        offset: 20,
      });

      expect(result.page).toBe(3); // offset 20 / limit 10 + 1 = 3
      expect(result.hasMore).toBe(true); // 20 + 1 < 100
    });

    it('should support sorting', async () => {
      mockReadQuery
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([
          {
            r: sampleRelationshipRaw,
            source: sampleSourceEntity,
            target: sampleTargetEntity,
          },
        ]);

      await listRelationships('universe-123', {
        sortBy: 'strength',
        sortOrder: 'asc',
      });

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY r.strength ASC'),
        expect.any(Object)
      );
    });
  });

  describe('updateRelationship', () => {
    it('should update specific fields', async () => {
      const updatedRaw = {
        ...sampleRelationshipRaw,
        type: 'loves',
        context: 'Updated context',
      };
      mockWriteQuery.mockResolvedValue([
        {
          r: updatedRaw,
          source: sampleSourceEntity,
          target: sampleTargetEntity,
        },
      ]);

      const result = await updateRelationship('test-relationship-id', {
        type: 'loves',
        context: 'Updated context',
      });

      expect(result?.type).toBe('loves');
      expect(result?.context).toBe('Updated context');

      expect(mockWriteQuery).toHaveBeenCalledWith(
        expect.stringContaining('r.type = $type'),
        expect.objectContaining({ type: 'loves', context: 'Updated context' })
      );
    });

    it('should return null when relationship not found', async () => {
      mockWriteQuery.mockResolvedValue([]);

      const result = await updateRelationship('non-existent-id', { context: 'New context' });

      expect(result).toBeNull();
    });

    it('should update strength', async () => {
      mockWriteQuery.mockResolvedValue([
        {
          r: { ...sampleRelationshipRaw, strength: 5 },
          source: sampleSourceEntity,
          target: sampleTargetEntity,
        },
      ]);

      const result = await updateRelationship('test-relationship-id', {
        strength: 5,
      });

      expect(result?.strength).toBe(5);
    });

    it('should update date fields', async () => {
      mockWriteQuery.mockResolvedValue([
        {
          r: {
            ...sampleRelationshipRaw,
            startDate: '1620-01-01',
            endDate: '1630-12-31',
            ongoing: false,
          },
          source: sampleSourceEntity,
          target: sampleTargetEntity,
        },
      ]);

      const result = await updateRelationship('test-relationship-id', {
        startDate: '1620-01-01',
        endDate: '1630-12-31',
        ongoing: false,
      });

      expect(result?.startDate).toBe('1620-01-01');
      expect(result?.endDate).toBe('1630-12-31');
      expect(result?.ongoing).toBe(false);
    });

    it('should serialize metadata to JSON', async () => {
      mockWriteQuery.mockResolvedValue([
        {
          r: sampleRelationshipRaw,
          source: sampleSourceEntity,
          target: sampleTargetEntity,
        },
      ]);

      await updateRelationship('test-relationship-id', {
        metadata: { newKey: 'newValue' },
      });

      expect(mockWriteQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ metadata: '{"newKey":"newValue"}' })
      );
    });
  });

  describe('deleteRelationship', () => {
    it('should return true when relationship deleted', async () => {
      mockWriteQuery.mockResolvedValue([{ deleted: 1 }]);

      const result = await deleteRelationship('test-relationship-id');

      expect(result).toBe(true);
      expect(mockWriteQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE r'),
        { id: 'test-relationship-id' }
      );
    });

    it('should return false when relationship not found', async () => {
      mockWriteQuery.mockResolvedValue([{ deleted: 0 }]);

      const result = await deleteRelationship('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('getEntityRelationships', () => {
    it('should return all relationships for an entity', async () => {
      mockReadQuery.mockResolvedValue([
        {
          r: sampleRelationshipRaw,
          source: sampleSourceEntity,
          target: sampleTargetEntity,
        },
        {
          r: { ...sampleRelationshipRaw, id: 'rel-2', type: 'opposes' },
          source: sampleTargetEntity,
          target: sampleSourceEntity,
        },
      ]);

      const results = await getEntityRelationships('entity-source-id');

      expect(results).toHaveLength(2);
      expect(results[0].type).toBe('knows');
      expect(results[1].type).toBe('opposes');

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.stringContaining('source.id = $entityId OR target.id = $entityId'),
        { entityId: 'entity-source-id' }
      );
    });

    it('should return empty array when entity has no relationships', async () => {
      mockReadQuery.mockResolvedValue([]);

      const results = await getEntityRelationships('lonely-entity-id');

      expect(results).toEqual([]);
    });
  });

  describe('getRelationshipCounts', () => {
    it('should return counts for all relationship types', async () => {
      mockReadQuery.mockResolvedValue([
        { type: 'knows', count: 10 },
        { type: 'loves', count: 5 },
        { type: 'opposes', count: 3 },
      ]);

      const counts = await getRelationshipCounts('universe-123');

      expect(counts).toEqual({
        knows: 10,
        loves: 5,
        opposes: 3,
        works_for: 0,
        family_of: 0,
        located_at: 0,
        participated_in: 0,
        possesses: 0,
        member_of: 0,
      });
    });

    it('should return zeros when no relationships exist', async () => {
      mockReadQuery.mockResolvedValue([]);

      const counts = await getRelationshipCounts('universe-123');

      expect(counts).toEqual({
        knows: 0,
        loves: 0,
        opposes: 0,
        works_for: 0,
        family_of: 0,
        located_at: 0,
        participated_in: 0,
        possesses: 0,
        member_of: 0,
      });
    });

    it('should ignore unknown relationship types', async () => {
      mockReadQuery.mockResolvedValue([
        { type: 'knows', count: 5 },
        { type: 'unknown_type' as RelationshipType, count: 10 },
      ]);

      const counts = await getRelationshipCounts('universe-123');

      expect(counts.knows).toBe(5);
      // Unknown type should not appear or modify results
      expect('unknown_type' in counts).toBe(false);
    });
  });

  describe('relationshipExists', () => {
    it('should return true when relationship exists', async () => {
      mockReadQuery.mockResolvedValue([{ exists: true }]);

      const exists = await relationshipExists('entity-source-id', 'entity-target-id');

      expect(exists).toBe(true);
      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (source:Entity {id: $sourceId})-[r:RELATES_TO]->(target:Entity {id: $targetId})'),
        expect.objectContaining({
          sourceId: 'entity-source-id',
          targetId: 'entity-target-id',
        })
      );
    });

    it('should return false when relationship does not exist', async () => {
      mockReadQuery.mockResolvedValue([{ exists: false }]);

      const exists = await relationshipExists('entity-1', 'entity-2');

      expect(exists).toBe(false);
    });

    it('should filter by type when specified', async () => {
      mockReadQuery.mockResolvedValue([{ exists: true }]);

      await relationshipExists('entity-source-id', 'entity-target-id', 'loves');

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE r.type = $type'),
        expect.objectContaining({ type: 'loves' })
      );
    });

    it('should handle empty results', async () => {
      mockReadQuery.mockResolvedValue([]);

      const exists = await relationshipExists('entity-1', 'entity-2');

      expect(exists).toBe(false);
    });
  });

  describe('entity parsing within relationships', () => {
    it('should parse source and target entities correctly', async () => {
      mockReadQuery.mockResolvedValue([
        {
          r: sampleRelationshipRaw,
          source: sampleSourceEntity,
          target: sampleTargetEntity,
        },
      ]);

      const result = await getRelationship('test-relationship-id');

      // Check source entity
      expect(result?.source.id).toBe('entity-source-id');
      expect(result?.source.name).toBe("D'Artagnan");
      expect(result?.source.type).toBe('character');
      expect(result?.source.aliases).toEqual(['Gascon']);
      expect(result?.source.createdAt).toBeInstanceOf(Date);

      // Check target entity
      expect(result?.target.id).toBe('entity-target-id');
      expect(result?.target.name).toBe('Athos');
      expect(result?.target.aliases).toEqual(['Comte de la Fère']);
    });

    it('should handle entity metadata parsing', async () => {
      mockReadQuery.mockResolvedValue([
        {
          r: sampleRelationshipRaw,
          source: { ...sampleSourceEntity, metadata: '{"birthplace": "Gascony"}' },
          target: { ...sampleTargetEntity, metadata: { nobility: true } },
        },
      ]);

      const result = await getRelationship('test-relationship-id');

      expect(result?.source.metadata).toEqual({ birthplace: 'Gascony' });
      expect(result?.target.metadata).toEqual({ nobility: true });
    });
  });

  describe('metadata parsing', () => {
    it('should parse JSON string metadata', async () => {
      mockReadQuery.mockResolvedValue([
        {
          r: { ...sampleRelationshipRaw, metadata: '{"custom": "data"}' },
          source: sampleSourceEntity,
          target: sampleTargetEntity,
        },
      ]);

      const result = await getRelationship('test-relationship-id');

      expect(result?.metadata).toEqual({ custom: 'data' });
    });

    it('should handle object metadata', async () => {
      mockReadQuery.mockResolvedValue([
        {
          r: { ...sampleRelationshipRaw, metadata: { direct: 'object' } },
          source: sampleSourceEntity,
          target: sampleTargetEntity,
        },
      ]);

      const result = await getRelationship('test-relationship-id');

      expect(result?.metadata).toEqual({ direct: 'object' });
    });

    it('should return empty object for null metadata', async () => {
      mockReadQuery.mockResolvedValue([
        {
          r: { ...sampleRelationshipRaw, metadata: null },
          source: sampleSourceEntity,
          target: sampleTargetEntity,
        },
      ]);

      const result = await getRelationship('test-relationship-id');

      expect(result?.metadata).toEqual({});
    });

    it('should return empty object for invalid JSON metadata', async () => {
      mockReadQuery.mockResolvedValue([
        {
          r: { ...sampleRelationshipRaw, metadata: 'not-valid-json' },
          source: sampleSourceEntity,
          target: sampleTargetEntity,
        },
      ]);

      const result = await getRelationship('test-relationship-id');

      expect(result?.metadata).toEqual({});
    });
  });

  describe('strength validation', () => {
    it('should default to strength 3 when not provided', async () => {
      mockReadQuery.mockResolvedValue([
        {
          r: { ...sampleRelationshipRaw, strength: null },
          source: sampleSourceEntity,
          target: sampleTargetEntity,
        },
      ]);

      const result = await getRelationship('test-relationship-id');

      expect(result?.strength).toBe(3);
    });
  });
});
