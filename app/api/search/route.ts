/**
 * Search API Route
 *
 * GET /api/search?universeId={id}&q={query}
 * Performs graph search on entities and relationships
 *
 * GET /api/search?universeId={id}&q={query}&ai=true
 * Performs AI-powered search with Claude synthesis
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  executeGraphSearch,
  search as aiSearch,
  type GraphSearchResult,
  type SearchResult as AISearchResult,
} from '@/lib/search';
import type { ApiResponse, ApiError, SynthesizedAnswer } from '@/types';

/**
 * Basic search response (without AI)
 */
interface BasicSearchResponse {
  mode: 'basic';
  query: string;
  entities: GraphSearchResult['entities'];
  relationships: GraphSearchResult['relationships'];
  timing: {
    graphMs: number;
    totalMs: number;
  };
}

/**
 * AI search response (with Claude synthesis)
 */
interface AISearchResponse {
  mode: 'ai';
  query: string;
  aiAnswer: SynthesizedAnswer;
  understanding: AISearchResult['understanding'];
  entities: GraphSearchResult['entities'];
  relationships: GraphSearchResult['relationships'];
  webResults?: AISearchResult['webResults'];
  timing: AISearchResult['timing'];
}

type SearchResponse = BasicSearchResponse | AISearchResponse;

/**
 * GET /api/search
 * Search entities and relationships in the knowledge graph
 *
 * Query params:
 * - universeId (required): UUID of the universe
 * - q (required): Search query string
 * - ai (optional): Set to 'true' to enable AI-powered search with Claude synthesis
 * - includeWeb (optional): Set to 'true' to include web search results (only with ai=true)
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SearchResponse> | ApiError>> {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const universeId = searchParams.get('universeId');
    const query = searchParams.get('q');
    const aiMode = searchParams.get('ai') === 'true';
    const includeWeb = searchParams.get('includeWeb') === 'true';

    // Validate required parameters
    if (!universeId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'universeId parameter is required',
          },
        },
        { status: 400 }
      );
    }

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'q parameter is required',
          },
        },
        { status: 400 }
      );
    }

    // AI-powered search mode
    if (aiMode) {
      try {
        const result = await aiSearch(query, {
          universeId,
          includeWebSearch: includeWeb,
          maxEntities: 20,
          maxRelationships: 50,
        });

        return NextResponse.json({
          success: true,
          data: {
            mode: 'ai',
            query,
            aiAnswer: result.answer,
            understanding: result.understanding,
            entities: result.rawGraphData.entities,
            relationships: result.rawGraphData.relationships,
            webResults: result.webResults,
            timing: result.timing,
          },
        });
      } catch (aiError) {
        // If AI search fails, log and fall back to basic search
        console.error('AI search failed, falling back to basic search:', aiError);

        // Fall through to basic search
      }
    }

    // Basic graph search (default or fallback)
    const graphStart = Date.now();
    const { entities, relationships } = await executeGraphSearch(
      universeId,
      query
    );
    const graphMs = Date.now() - graphStart;

    const totalMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        mode: 'basic',
        query,
        entities,
        relationships,
        timing: {
          graphMs,
          totalMs,
        },
      },
    });
  } catch (error) {
    console.error('Error executing search:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to execute search',
        },
      },
      { status: 500 }
    );
  }
}
