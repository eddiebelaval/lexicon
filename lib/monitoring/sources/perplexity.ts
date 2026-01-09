/**
 * Perplexity API Integration
 *
 * Uses Perplexity's sonar-pro model for AI-powered news search.
 * This is our primary monitoring source - it understands context
 * and returns synthesized, relevant results.
 */

import type { MonitoringRawResult, PerplexityResponse } from '../types';

// Lazy environment validation
function getPerplexityApiKey(): string {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) {
    throw new Error('Missing PERPLEXITY_API_KEY environment variable');
  }
  return key;
}

/**
 * Search for news about a specific cast member
 *
 * @param castName - Full name of the cast member
 * @param showContext - Show/universe context (e.g., "90 Day Fiance")
 * @param maxResults - Maximum results to return
 */
export async function searchCastNews(
  castName: string,
  showContext: string,
  maxResults: number = 5
): Promise<MonitoringRawResult[]> {
  const apiKey = getPerplexityApiKey();

  // Craft a focused search query
  const searchQuery = `
    Find the latest news, social media updates, or announcements about ${castName}
    from ${showContext}. Focus on:
    - Relationship updates or drama
    - New episodes or appearances
    - Social media posts or statements
    - Interviews or media coverage
    - Any drama or conflicts with other cast members

    Only include news from the last 7 days. Provide sources.
  `.trim();

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: `You are a reality TV news researcher. Find and summarize recent news
                   about cast members. Be factual and cite sources. Format each piece of
                   news clearly with title, summary, and source URL.`,
        },
        {
          role: 'user',
          content: searchQuery,
        },
      ],
      max_tokens: 2000,
      temperature: 0.2,
      return_citations: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
  }

  const data: PerplexityResponse = await response.json();

  // Parse the response into structured results
  return parsePerplexityResponse(data, castName, showContext, maxResults);
}

/**
 * Parse Perplexity response into structured monitoring results
 */
function parsePerplexityResponse(
  response: PerplexityResponse,
  castName: string,
  showContext: string,
  maxResults: number
): MonitoringRawResult[] {
  const results: MonitoringRawResult[] = [];

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return results;
  }

  const citations = response.citations || [];

  // Split content into news items
  // Perplexity typically formats with numbered lists or clear separations
  const newsItems = splitIntoNewsItems(content);

  for (let i = 0; i < Math.min(newsItems.length, maxResults); i++) {
    const item = newsItems[i];
    if (!item.title || !item.content) continue;

    results.push({
      sourceType: 'perplexity',
      sourceName: item.source || 'Perplexity AI Search',
      sourceUrl: citations[i] || item.sourceUrl || '',
      title: item.title,
      content: item.content,
      snippet: item.content.slice(0, 200),
      publishedAt: item.publishedAt || null,
      rawData: {
        castName,
        showContext,
        perplexityId: response.id,
        citationIndex: i,
      },
    });
  }

  return results;
}

/**
 * Split Perplexity's response into individual news items
 */
function splitIntoNewsItems(content: string): Array<{
  title: string;
  content: string;
  source?: string;
  sourceUrl?: string;
  publishedAt?: Date;
}> {
  const items: Array<{
    title: string;
    content: string;
    source?: string;
    sourceUrl?: string;
    publishedAt?: Date;
  }> = [];

  // Try to split by numbered items (1., 2., etc.)
  const numberedPattern = /\d+\.\s+\*\*(.+?)\*\*:?\s*([\s\S]*?)(?=\d+\.\s+\*\*|$)/g;
  let match;

  while ((match = numberedPattern.exec(content)) !== null) {
    const title = match[1].trim();
    const body = match[2].trim();

    // Try to extract source from the body
    const sourceMatch = body.match(/Source:\s*\[?([^\]\n]+)\]?\(?([^)\n]+)?\)?/i);

    items.push({
      title,
      content: body.replace(/Source:.*$/im, '').trim(),
      source: sourceMatch?.[1],
      sourceUrl: sourceMatch?.[2],
    });
  }

  // If no numbered items found, try bullet points
  if (items.length === 0) {
    const bulletPattern = /[-•]\s+\*\*(.+?)\*\*:?\s*([\s\S]*?)(?=[-•]\s+\*\*|$)/g;

    while ((match = bulletPattern.exec(content)) !== null) {
      const title = match[1].trim();
      const body = match[2].trim();

      items.push({
        title,
        content: body,
      });
    }
  }

  // If still no items, treat the whole content as one item
  if (items.length === 0 && content.length > 50) {
    // Extract first sentence as title
    const firstSentence = content.match(/^[^.!?]+[.!?]/)?.[0] || content.slice(0, 100);

    items.push({
      title: firstSentence,
      content: content,
    });
  }

  return items;
}

/**
 * Batch search for multiple cast members
 */
export async function searchMultipleCast(
  castNames: string[],
  showContext: string,
  maxResultsPerCast: number = 3
): Promise<Map<string, MonitoringRawResult[]>> {
  const results = new Map<string, MonitoringRawResult[]>();

  // Process in parallel with rate limiting
  const batchSize = 3; // Perplexity rate limits

  for (let i = 0; i < castNames.length; i += batchSize) {
    const batch = castNames.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map((name) => searchCastNews(name, showContext, maxResultsPerCast))
    );

    batch.forEach((name, index) => {
      const result = batchResults[index];
      if (result.status === 'fulfilled') {
        results.set(name, result.value);
      } else {
        console.error(`Failed to search for ${name}:`, result.reason);
        results.set(name, []);
      }
    });

    // Rate limit delay between batches
    if (i + batchSize < castNames.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
