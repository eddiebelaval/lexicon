/**
 * Universe API Routes - Individual Universe Operations
 *
 * GET /api/universes/[id] - Get universe metadata and stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDriver } from '@/lib/neo4j';
import type { ApiResponse, ApiError } from '@/types';

interface UniverseData {
  id: string;
  name: string;
  description: string;
  stats: {
    entityCount: number;
    relationshipCount: number;
  };
}

/**
 * GET /api/universes/[id]
 * Get universe metadata and stats from Neo4j
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<UniverseData> | ApiError>> {
  const { id: universeId } = await params;

  if (!universeId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Universe ID is required',
        },
      },
      { status: 400 }
    );
  }

  try {
    const driver = getDriver();
    const session = driver.session();

    try {
      // Get entity and relationship counts for this universe
      const result = await session.run(
        `
        MATCH (e:Entity {universeId: $universeId})
        WITH count(e) as entityCount
        OPTIONAL MATCH ()-[r:RELATES_TO {universeId: $universeId}]->()
        RETURN entityCount, count(r) as relationshipCount
        `,
        { universeId }
      );

      const record = result.records[0];
      const entityCount = record?.get('entityCount')?.toNumber() || 0;
      const relationshipCount = record?.get('relationshipCount')?.toNumber() || 0;

      // For now, use a default name based on the universe
      // In a full implementation, this would come from PostgreSQL/Supabase
      const universeName = universeId === '11111111-1111-1111-1111-111111111111'
        ? 'The Three Musketeers'
        : 'Story Universe';

      return NextResponse.json({
        success: true,
        data: {
          id: universeId,
          name: universeName,
          description: 'A story universe in Lexicon',
          stats: {
            entityCount,
            relationshipCount,
          },
        },
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error fetching universe:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch universe data',
        },
      },
      { status: 500 }
    );
  }
}
