/**
 * Wiki Enrichment API Route
 *
 * POST /api/wiki/enrich
 * Fetches web data to enrich entity descriptions using Firecrawl search
 * Falls back to Claude AI for contextual enrichment when Firecrawl isn't configured
 *
 * This endpoint is designed to be called when the user enables "Web Enhanced" mode
 * in the Wiki view. It searches the web for relevant information about entities
 * and returns structured enrichment data.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { ApiResponse, ApiError } from '@/types';

/**
 * Web enrichment data for a single entity
 */
interface WebEnrichment {
  summary?: string;
  imageUrl?: string;
  facts?: string[];
  source?: string;
}

/**
 * Request body for enrichment
 */
interface EnrichmentRequest {
  entities: {
    id: string;
    name: string;
    type: string;
    description?: string;
  }[];
  universeContext?: string; // e.g., "The Three Musketeers by Alexandre Dumas"
  maxEntities?: number; // Limit how many entities to enrich (default: 10)
}

/**
 * Response data
 */
interface EnrichmentResponse {
  enrichments: Record<string, WebEnrichment>;
  timing: {
    totalMs: number;
    searchMs: number;
  };
  enrichedCount: number;
  skippedCount: number;
}

// Firecrawl API configuration
const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1/search';
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

/**
 * Search the web using Firecrawl for entity information
 */
async function searchForEntity(
  entityName: string,
  entityType: string,
  universeContext?: string
): Promise<WebEnrichment | null> {
  if (!FIRECRAWL_API_KEY) {
    console.warn('FIRECRAWL_API_KEY not configured, skipping web enrichment');
    return null;
  }

  try {
    // Build search query with context
    const query = universeContext
      ? `"${entityName}" ${entityType} ${universeContext}`
      : `"${entityName}" ${entityType} character biography facts`;

    const response = await fetch(FIRECRAWL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        limit: 3, // Get top 3 results
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
        },
      }),
    });

    if (!response.ok) {
      console.error(`Firecrawl search failed: ${response.status}`);
      return null;
    }

    const result = await response.json();

    if (!result.success || !result.data || result.data.length === 0) {
      return null;
    }

    // Extract enrichment from search results
    const topResult = result.data[0];
    const enrichment: WebEnrichment = {
      source: topResult.url,
    };

    // Extract facts from the markdown content
    if (topResult.markdown) {
      const facts = extractFacts(topResult.markdown, entityName);
      if (facts.length > 0) {
        enrichment.facts = facts.slice(0, 5); // Max 5 facts
      }

      // Try to extract a summary from the first paragraph
      const summary = extractSummary(topResult.markdown, entityName);
      if (summary) {
        enrichment.summary = summary;
      }
    }

    // Look for an image URL in metadata
    if (topResult.metadata?.ogImage) {
      enrichment.imageUrl = topResult.metadata.ogImage;
    }

    return enrichment;
  } catch (error) {
    console.error(`Error searching for entity ${entityName}:`, error);
    return null;
  }
}

/**
 * Extract relevant facts from markdown content
 */
function extractFacts(markdown: string, entityName: string): string[] {
  const facts: string[] = [];
  const lines = markdown.split('\n');

  // Look for bullet points or short sentences mentioning the entity
  for (const line of lines) {
    const trimmed = line.trim();

    // Skip headers and empty lines
    if (trimmed.startsWith('#') || trimmed.length < 20) continue;

    // Look for bullet points
    if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.match(/^\d+\./)) {
      const fact = trimmed.replace(/^[-*]\s*|\d+\.\s*/, '').trim();
      if (fact.length > 20 && fact.length < 200) {
        facts.push(fact);
      }
    }
    // Or sentences that mention the entity name
    else if (
      trimmed.toLowerCase().includes(entityName.toLowerCase()) &&
      trimmed.length > 30 &&
      trimmed.length < 250
    ) {
      // Clean up the fact
      const cleaned = trimmed
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
        .replace(/\*([^*]+)\*/g, '$1'); // Remove italic

      if (cleaned && !facts.includes(cleaned)) {
        facts.push(cleaned);
      }
    }

    if (facts.length >= 8) break; // Gather extra to filter later
  }

  return facts;
}

/**
 * Extract a summary from markdown content
 */
function extractSummary(markdown: string, entityName: string): string | null {
  const lines = markdown.split('\n');

  // Look for the first substantial paragraph
  for (const line of lines) {
    const trimmed = line.trim();

    // Skip headers, lists, and short lines
    if (
      trimmed.startsWith('#') ||
      trimmed.startsWith('-') ||
      trimmed.startsWith('*') ||
      trimmed.match(/^\d+\./) ||
      trimmed.length < 50
    ) {
      continue;
    }

    // Found a paragraph - clean it up
    const cleaned = trimmed
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1'); // Remove italic

    // Return first 2-3 sentences if it mentions the entity
    if (cleaned.toLowerCase().includes(entityName.toLowerCase().split(' ')[0])) {
      const sentences = cleaned.match(/[^.!?]+[.!?]+/g);
      if (sentences && sentences.length > 0) {
        return sentences.slice(0, 3).join(' ').trim();
      }
      return cleaned.slice(0, 300) + (cleaned.length > 300 ? '...' : '');
    }
  }

  return null;
}

/**
 * Claude AI singleton
 */
let claudeClient: Anthropic | null = null;

function getClaudeClient(): Anthropic | null {
  if (!claudeClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return null;
    }
    claudeClient = new Anthropic({ apiKey });
  }
  return claudeClient;
}

/**
 * Use Claude AI to generate contextual enrichment when Firecrawl isn't available
 */
async function enrichWithClaude(
  entities: Array<{ id: string; name: string; type: string; description?: string }>,
  universeContext?: string
): Promise<Record<string, WebEnrichment>> {
  const client = getClaudeClient();
  if (!client) {
    console.warn('ANTHROPIC_API_KEY not configured, skipping Claude enrichment');
    return {};
  }

  try {
    const entityList = entities
      .map((e) => `- ${e.name} (${e.type}): ${e.description || 'No description'}`)
      .join('\n');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a helpful assistant enriching entity information for a story universe wiki.

Universe context: ${universeContext || 'Unknown'}

For each entity below, provide 3-5 interesting facts that would be found in an encyclopedia or wiki article. Focus on facts relevant to the story/narrative context.

Entities:
${entityList}

Respond in this exact JSON format (no markdown, just JSON):
{
  "enrichments": {
    "EntityName1": {
      "facts": ["fact 1", "fact 2", "fact 3"]
    },
    "EntityName2": {
      "facts": ["fact 1", "fact 2", "fact 3"]
    }
  }
}

Use the exact entity names as keys. Only include factual, encyclopedia-style information relevant to the story context.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return {};
    }

    // Extract JSON from the response (handle markdown code blocks)
    let jsonText = content.text.trim();

    // Remove markdown code block if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    // Parse the JSON response
    const parsed = JSON.parse(jsonText);
    const enrichments: Record<string, WebEnrichment> = {};

    console.log('Claude response parsed, keys:', Object.keys(parsed.enrichments || {}));

    // Map by entity name to entity ID
    for (const entity of entities) {
      // Try exact match first
      let enrichment = parsed.enrichments?.[entity.name];

      if (!enrichment && parsed.enrichments) {
        const keys = Object.keys(parsed.enrichments);
        // Try case-insensitive match
        let matchKey = keys.find(
          (k) => k.toLowerCase() === entity.name.toLowerCase()
        );
        // Try matching with type suffix like "Athos (character)"
        if (!matchKey) {
          matchKey = keys.find(
            (k) =>
              k.toLowerCase().startsWith(entity.name.toLowerCase()) ||
              k.toLowerCase().includes(entity.name.toLowerCase())
          );
        }
        if (matchKey) {
          enrichment = parsed.enrichments[matchKey];
        }
      }

      if (enrichment?.facts && enrichment.facts.length > 0) {
        enrichments[entity.id] = {
          facts: enrichment.facts.slice(0, 5),
          source: 'Claude AI Knowledge',
        };
      }
    }

    console.log(`Claude enriched ${Object.keys(enrichments).length} entities`);
    return enrichments;
  } catch (error) {
    console.error('Claude enrichment error:', error);
    if (error instanceof SyntaxError) {
      console.error('JSON parse error - Claude response may not be valid JSON');
    }
    return {};
  }
}

/**
 * POST /api/wiki/enrich
 * Enrich entities with web data using Firecrawl search
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<EnrichmentResponse> | ApiError>> {
  const startTime = Date.now();

  try {
    const body: EnrichmentRequest = await request.json();
    const { entities, universeContext, maxEntities = 10 } = body;

    // Validate request
    if (!entities || !Array.isArray(entities) || entities.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'entities array is required',
          },
        },
        { status: 400 }
      );
    }

    // Limit entities to prevent timeout
    const entitiesToEnrich = entities.slice(0, maxEntities);
    const enrichments: Record<string, WebEnrichment> = {};
    let enrichedCount = 0;
    let skippedCount = 0;

    const searchStart = Date.now();

    // Try Firecrawl first if API key is configured
    if (FIRECRAWL_API_KEY) {
      // Process entities in parallel with concurrency limit
      const CONCURRENCY = 3;
      for (let i = 0; i < entitiesToEnrich.length; i += CONCURRENCY) {
        const batch = entitiesToEnrich.slice(i, i + CONCURRENCY);

        const results = await Promise.allSettled(
          batch.map(async (entity) => {
            const enrichment = await searchForEntity(
              entity.name,
              entity.type,
              universeContext
            );
            return { id: entity.id, enrichment };
          })
        );

        for (const result of results) {
          if (result.status === 'fulfilled' && result.value.enrichment) {
            enrichments[result.value.id] = result.value.enrichment;
            enrichedCount++;
          } else {
            skippedCount++;
          }
        }
      }
    } else {
      // Fall back to Claude AI enrichment
      console.log('Firecrawl not configured, using Claude AI for enrichment');
      const claudeEnrichments = await enrichWithClaude(
        entitiesToEnrich,
        universeContext
      );

      Object.assign(enrichments, claudeEnrichments);
      enrichedCount = Object.keys(claudeEnrichments).length;
      skippedCount = entitiesToEnrich.length - enrichedCount;
    }

    const searchMs = Date.now() - searchStart;
    const totalMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        enrichments,
        timing: {
          totalMs,
          searchMs,
        },
        enrichedCount,
        skippedCount: entities.length - enrichedCount,
      },
    });
  } catch (error) {
    console.error('Error enriching entities:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to enrich entities',
        },
      },
      { status: 500 }
    );
  }
}
