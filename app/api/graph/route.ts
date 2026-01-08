/**
 * Graph API Routes - Visualization Data
 *
 * GET /api/graph - Get graph data (nodes + links) for D3.js visualization
 *
 * Query params:
 * - universeId (required): UUID of the universe
 *
 * Returns all entities as nodes and all relationships as links,
 * formatted for D3.js force-directed graph visualization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readQuery } from '@/lib/neo4j';
import { z } from 'zod';
import type { ApiResponse, ApiError, EntityType, EntityStatus } from '@/types';

/**
 * Validation schema for graph query parameters
 */
const graphQuerySchema = z.object({
  universeId: z.string().uuid('Invalid universe ID'),
});

/**
 * Graph node structure for D3.js
 */
interface GraphNode {
  id: string;
  name: string;
  type: EntityType;
  status: EntityStatus;
}

/**
 * Graph link structure for D3.js
 */
interface GraphLink {
  id: string;
  source: string; // entity ID
  target: string; // entity ID
  type: string; // relationship type
  strength: number;
}

/**
 * Complete graph data response
 */
interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * Raw Neo4j query result structure
 */
interface Neo4jGraphResult {
  e: {
    id: string;
    name: string;
    type: EntityType;
    status: EntityStatus;
  };
  r: {
    type: string;
    strength: number;
  } | null;
  connected: {
    id: string;
  } | null;
  relId: string | null;
}

/**
 * GET /api/graph
 * Returns all entities and relationships for a universe as graph data
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<GraphData> | ApiError>> {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const parseResult = graphQuerySchema.safeParse(params);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { universeId } = parseResult.data;

    // Query Neo4j for all entities and their relationships
    // This returns each relationship twice (once from each direction)
    // We'll deduplicate them later
    const results = await readQuery<Neo4jGraphResult>(
      `
      MATCH (e:Entity {universeId: $universeId})
      OPTIONAL MATCH (e)-[r]-(connected:Entity {universeId: $universeId})
      RETURN e, r, connected, id(r) as relId
      ORDER BY e.name
      `,
      { universeId }
    );

    // Handle empty universe
    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          nodes: [],
          links: [],
        },
      });
    }

    // Deduplicate nodes using a Map
    const nodesMap = new Map<string, GraphNode>();

    // Deduplicate links using relationship ID
    // We use relId from Neo4j to ensure we only include each relationship once
    const linksMap = new Map<string, GraphLink>();

    for (const result of results) {
      // Add node if not already present
      if (!nodesMap.has(result.e.id)) {
        nodesMap.set(result.e.id, {
          id: result.e.id,
          name: result.e.name,
          type: result.e.type,
          status: result.e.status,
        });
      }

      // Add connected node if it exists and not already present
      if (result.connected && !nodesMap.has(result.connected.id)) {
        // We'll encounter this node in its own row later, skip for now
        // This prevents incomplete node data
      }

      // Add relationship if it exists and not already present
      if (result.r && result.connected && result.relId) {
        const relKey = result.relId;

        if (!linksMap.has(relKey)) {
          // Determine source and target based on alphabetical order
          // This ensures consistency in undirected relationships
          const ids = [result.e.id, result.connected.id].sort();

          linksMap.set(relKey, {
            id: relKey,
            source: ids[0],
            target: ids[1],
            type: result.r.type,
            strength: result.r.strength || 1,
          });
        }
      }
    }

    // Convert maps to arrays
    const nodes = Array.from(nodesMap.values());
    const links = Array.from(linksMap.values());

    return NextResponse.json({
      success: true,
      data: {
        nodes,
        links,
      },
    });
  } catch (error) {
    console.error('Error fetching graph data:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch graph data',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
