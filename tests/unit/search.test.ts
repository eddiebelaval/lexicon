/**
 * Unit tests for lib/search.ts
 *
 * Tests search orchestration with mocked Neo4j and Claude.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  search,
  executeGraphSearch,
  findEntity,
  getUniverseEntities,
} from '@/lib/search';
import type { QueryUnderstanding, SynthesizedAnswer } from '@/lib/claude';

// Mock the neo4j module
vi.mock('@/lib/neo4j', () => ({
  readQuery: vi.fn(),
  writeQuery: vi.fn(),
}));

// Mock the claude module
vi.mock('@/lib/claude', () => ({
  parseQuery: vi.fn(),
  synthesizeAnswer: vi.fn(),
}));

// Import mocked modules
import { readQuery } from '@/lib/neo4j';
import { parseQuery, synthesizeAnswer } from '@/lib/claude';

const mockReadQuery = vi.mocked(readQuery);
const mockParseQuery = vi.mocked(parseQuery);
const mockSynthesizeAnswer = vi.mocked(synthesizeAnswer);

// Sample data for tests
const sampleGraphEntity = {
  id: 'entity-1',
  name: "D'Artagnan",
  type: 'character',
  description: 'A young musketeer from Gascony',
  aliases: ['Gascon'],
  status: 'active',
  imageUrl: null,
  metadata: '{}',
  universeId: 'universe-123',
  createdAt: '2026-01-08T10:00:00.000Z',
  updatedAt: '2026-01-08T10:00:00.000Z',
};

const sampleGraphRelationship = {
  id: 'rel-1',
  from: 'entity-1',
  to: 'entity-2',
  fromName: "D'Artagnan",
  toName: 'Athos',
  type: 'knows',
  context: 'Fellow musketeers',
};

const sampleQueryUnderstanding: QueryUnderstanding = {
  intent: 'entity_lookup',
  entities: ["D'Artagnan"],
  webSearchRecommended: false,
};

const sampleSynthesizedAnswer: SynthesizedAnswer = {
  answer: "D'Artagnan is a young musketeer from Gascony who befriended the three musketeers.",
  sources: [{ type: 'entity', name: "D'Artagnan" }],
  confidence: 'high',
};

describe('lib/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search (main orchestration)', () => {
    it('should execute the full search flow', async () => {
      // Mock parseQuery
      mockParseQuery.mockResolvedValue(sampleQueryUnderstanding);

      // Mock graph search - entity lookup
      mockReadQuery
        .mockResolvedValueOnce([{ e: sampleGraphEntity }]) // Entity search
        .mockResolvedValueOnce([
          {
            r: sampleGraphRelationship,
            fromName: "D'Artagnan",
            toName: 'Athos',
          },
        ]); // Relationship search

      // Mock synthesize answer
      mockSynthesizeAnswer.mockResolvedValue(sampleSynthesizedAnswer);

      const result = await search("Tell me about D'Artagnan", {
        universeId: 'universe-123',
      });

      // Verify orchestration flow
      expect(mockParseQuery).toHaveBeenCalledWith("Tell me about D'Artagnan");
      expect(mockReadQuery).toHaveBeenCalled();
      expect(mockSynthesizeAnswer).toHaveBeenCalled();

      // Verify result structure
      expect(result.query).toBe("Tell me about D'Artagnan");
      expect(result.understanding).toEqual(sampleQueryUnderstanding);
      expect(result.answer).toEqual(sampleSynthesizedAnswer);
      expect(result.rawGraphData.entities).toHaveLength(1);
      expect(result.rawGraphData.relationships).toHaveLength(1);

      // Verify timing data exists
      expect(result.timing.parseMs).toBeGreaterThanOrEqual(0);
      expect(result.timing.graphMs).toBeGreaterThanOrEqual(0);
      expect(result.timing.synthesisMs).toBeGreaterThanOrEqual(0);
      expect(result.timing.totalMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle general intent with no specific entities', async () => {
      const generalUnderstanding: QueryUnderstanding = {
        intent: 'general',
        entities: [],
        webSearchRecommended: false,
      };

      mockParseQuery.mockResolvedValue(generalUnderstanding);
      mockReadQuery.mockResolvedValue([{ e: sampleGraphEntity }]);
      mockSynthesizeAnswer.mockResolvedValue(sampleSynthesizedAnswer);

      const result = await search('What is this universe about?', {
        universeId: 'universe-123',
      });

      expect(result.understanding.intent).toBe('general');
      // General queries should still return some entities
      expect(result.rawGraphData.entities).toBeDefined();
    });

    it('should skip web search when not recommended', async () => {
      mockParseQuery.mockResolvedValue({
        ...sampleQueryUnderstanding,
        webSearchRecommended: false,
      });
      mockReadQuery.mockResolvedValue([{ e: sampleGraphEntity }]);
      mockSynthesizeAnswer.mockResolvedValue(sampleSynthesizedAnswer);

      const result = await search('Who is Athos?', {
        universeId: 'universe-123',
        includeWebSearch: true, // User wants web search
      });

      // No web results because not recommended
      expect(result.webResults).toBeUndefined();
      expect(result.timing.webMs).toBeUndefined();
    });

    it('should respect maxEntities and maxRelationships options', async () => {
      mockParseQuery.mockResolvedValue(sampleQueryUnderstanding);
      mockReadQuery.mockResolvedValue([{ e: sampleGraphEntity }]);
      mockSynthesizeAnswer.mockResolvedValue(sampleSynthesizedAnswer);

      await search('Query', {
        universeId: 'universe-123',
        maxEntities: 5,
        maxRelationships: 10,
      });

      // Verify limits are passed to queries
      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ limit: 5 })
      );
    });
  });

  describe('executeGraphSearch', () => {
    it('should search entities by name', async () => {
      mockReadQuery.mockResolvedValue([{ e: sampleGraphEntity }]);

      const results = await executeGraphSearch('universe-123', "D'Artagnan");

      expect(results.entities).toHaveLength(1);
      expect(results.entities[0].name).toBe("D'Artagnan");

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.stringContaining('e.name =~'),
        expect.objectContaining({
          universeId: 'universe-123',
          search: "D'Artagnan",
        })
      );
    });

    it('should search entities by description', async () => {
      mockReadQuery.mockResolvedValue([{ e: sampleGraphEntity }]);

      await executeGraphSearch('universe-123', 'musketeer');

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.stringContaining('e.description =~'),
        expect.any(Object)
      );
    });

    it('should return relationships between found entities', async () => {
      // First query: find entities
      mockReadQuery.mockResolvedValueOnce([
        { e: sampleGraphEntity },
        { e: { ...sampleGraphEntity, id: 'entity-2', name: 'Athos' } },
      ]);

      // Second query: find relationships
      mockReadQuery.mockResolvedValueOnce([
        {
          r: sampleGraphRelationship,
          fromName: "D'Artagnan",
          toName: 'Athos',
        },
      ]);

      const results = await executeGraphSearch('universe-123', 'musketeer');

      expect(results.entities).toHaveLength(2);
      expect(results.relationships).toHaveLength(1);
      expect(results.relationships[0].fromName).toBe("D'Artagnan");
      expect(results.relationships[0].toName).toBe('Athos');
    });

    it('should return empty results for empty query', async () => {
      const results = await executeGraphSearch('universe-123', '');

      expect(results.entities).toEqual([]);
      expect(results.relationships).toEqual([]);
      expect(mockReadQuery).not.toHaveBeenCalled();
    });

    it('should return empty results for whitespace-only query', async () => {
      const results = await executeGraphSearch('universe-123', '   ');

      expect(results.entities).toEqual([]);
      expect(results.relationships).toEqual([]);
      expect(mockReadQuery).not.toHaveBeenCalled();
    });

    it('should trim search query', async () => {
      mockReadQuery.mockResolvedValue([]);

      await executeGraphSearch('universe-123', '  Athos  ');

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ search: 'Athos' })
      );
    });

    it('should not query relationships when no entities found', async () => {
      mockReadQuery.mockResolvedValue([]);

      const results = await executeGraphSearch('universe-123', 'nonexistent');

      expect(results.entities).toEqual([]);
      expect(results.relationships).toEqual([]);
      // Only one query (entity search), no relationship query
      expect(mockReadQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('findEntity', () => {
    it('should find entity by exact name', async () => {
      mockReadQuery.mockResolvedValue([{ e: sampleGraphEntity }]);

      const result = await findEntity("D'Artagnan", 'universe-123');

      expect(result).not.toBeNull();
      expect(result?.name).toBe("D'Artagnan");

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.stringContaining("e.name =~ '(?i)^' + $name + '$'"),
        expect.objectContaining({
          universeId: 'universe-123',
          name: "D'Artagnan",
        })
      );
    });

    it('should find entity by alias', async () => {
      mockReadQuery.mockResolvedValue([{ e: sampleGraphEntity }]);

      const result = await findEntity('Gascon', 'universe-123');

      expect(result).not.toBeNull();
      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.stringContaining('$name IN e.aliases'),
        expect.any(Object)
      );
    });

    it('should return null when entity not found', async () => {
      mockReadQuery.mockResolvedValue([]);

      const result = await findEntity('NonexistentCharacter', 'universe-123');

      expect(result).toBeNull();
    });
  });

  describe('getUniverseEntities', () => {
    it('should return all entities in a universe', async () => {
      mockReadQuery.mockResolvedValue([
        { e: sampleGraphEntity },
        { e: { ...sampleGraphEntity, id: 'entity-2', name: 'Athos' } },
        { e: { ...sampleGraphEntity, id: 'entity-3', name: 'Porthos' } },
      ]);

      const results = await getUniverseEntities('universe-123');

      expect(results).toHaveLength(3);
      expect(results[0].name).toBe("D'Artagnan");
    });

    it('should filter by type when specified', async () => {
      mockReadQuery.mockResolvedValue([{ e: sampleGraphEntity }]);

      await getUniverseEntities('universe-123', 'character');

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.stringContaining('e.type = $type'),
        expect.objectContaining({ type: 'character' })
      );
    });

    it('should use default limit of 100', async () => {
      mockReadQuery.mockResolvedValue([]);

      await getUniverseEntities('universe-123');

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ limit: 100 })
      );
    });

    it('should respect custom limit', async () => {
      mockReadQuery.mockResolvedValue([]);

      await getUniverseEntities('universe-123', undefined, 50);

      expect(mockReadQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ limit: 50 })
      );
    });

    it('should return empty array when no entities exist', async () => {
      mockReadQuery.mockResolvedValue([]);

      const results = await getUniverseEntities('empty-universe');

      expect(results).toEqual([]);
    });
  });

  describe('timing metrics', () => {
    it('should track timing for each phase', async () => {
      mockParseQuery.mockImplementation(async () => {
        // Simulate some processing time
        await new Promise((resolve) => setTimeout(resolve, 1));
        return sampleQueryUnderstanding;
      });

      mockReadQuery.mockResolvedValue([{ e: sampleGraphEntity }]);

      mockSynthesizeAnswer.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return sampleSynthesizedAnswer;
      });

      const result = await search('Test query', { universeId: 'universe-123' });

      expect(result.timing.parseMs).toBeGreaterThan(0);
      expect(result.timing.graphMs).toBeGreaterThanOrEqual(0);
      expect(result.timing.synthesisMs).toBeGreaterThan(0);
      expect(result.timing.totalMs).toBeGreaterThanOrEqual(
        result.timing.parseMs + result.timing.graphMs + result.timing.synthesisMs
      );
    });
  });

  describe('error handling', () => {
    it('should propagate errors from parseQuery', async () => {
      mockParseQuery.mockRejectedValue(new Error('Claude API error'));

      await expect(
        search('Test query', { universeId: 'universe-123' })
      ).rejects.toThrow('Claude API error');
    });

    it('should propagate errors from graph queries', async () => {
      mockParseQuery.mockResolvedValue(sampleQueryUnderstanding);
      mockReadQuery.mockRejectedValue(new Error('Neo4j connection error'));

      await expect(
        search('Test query', { universeId: 'universe-123' })
      ).rejects.toThrow('Neo4j connection error');
    });

    it('should propagate errors from synthesizeAnswer', async () => {
      mockParseQuery.mockResolvedValue(sampleQueryUnderstanding);
      mockReadQuery.mockResolvedValue([{ e: sampleGraphEntity }]);
      mockSynthesizeAnswer.mockRejectedValue(new Error('Synthesis failed'));

      await expect(
        search('Test query', { universeId: 'universe-123' })
      ).rejects.toThrow('Synthesis failed');
    });
  });

  describe('entity data transformation', () => {
    it('should properly format entities for synthesis', async () => {
      mockParseQuery.mockResolvedValue(sampleQueryUnderstanding);
      mockReadQuery.mockResolvedValue([{ e: sampleGraphEntity }]);
      mockSynthesizeAnswer.mockResolvedValue(sampleSynthesizedAnswer);

      await search('Test', { universeId: 'universe-123' });

      expect(mockSynthesizeAnswer).toHaveBeenCalledWith(
        'Test',
        expect.objectContaining({
          entities: expect.arrayContaining([
            expect.objectContaining({
              name: "D'Artagnan",
              description: 'A young musketeer from Gascony',
              type: 'character',
            }),
          ]),
        }),
        undefined // No web results
      );
    });

    it('should properly format relationships for synthesis', async () => {
      mockParseQuery.mockResolvedValue(sampleQueryUnderstanding);

      // First: entity search
      mockReadQuery.mockResolvedValueOnce([
        { e: sampleGraphEntity },
        { e: { ...sampleGraphEntity, id: 'entity-2', name: 'Athos' } },
      ]);

      // Second: relationship search
      mockReadQuery.mockResolvedValueOnce([
        {
          r: sampleGraphRelationship,
          fromName: "D'Artagnan",
          toName: 'Athos',
        },
      ]);

      mockSynthesizeAnswer.mockResolvedValue(sampleSynthesizedAnswer);

      await search('Test', { universeId: 'universe-123' });

      expect(mockSynthesizeAnswer).toHaveBeenCalledWith(
        'Test',
        expect.objectContaining({
          relationships: expect.arrayContaining([
            expect.objectContaining({
              from: "D'Artagnan",
              to: 'Athos',
              type: 'knows',
              context: 'Fellow musketeers',
            }),
          ]),
        }),
        undefined
      );
    });
  });
});
