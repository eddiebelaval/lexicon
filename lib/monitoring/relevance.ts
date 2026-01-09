/**
 * Claude Relevance Filtering
 *
 * Filters raw monitoring results to determine:
 * 1. Is this actually about our cast member (not someone with same name)?
 * 2. Is this relevant to their storyline (not random celebrity gossip)?
 * 3. Which storylines does this relate to?
 * 4. How confident are we in this assessment?
 */

import Anthropic from '@anthropic-ai/sdk';
import type { MonitoringRawResult, RelevanceResult, ProcessedUpdate } from './types';
import type { Storyline } from '@/types';

// Singleton client instance
let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY environment variable');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

/**
 * Filter a single monitoring result for relevance
 */
export async function assessRelevance(
  result: MonitoringRawResult,
  castName: string,
  storylines: Array<Pick<Storyline, 'id' | 'title' | 'synopsis' | 'primaryCast'>>,
  showContext: string
): Promise<RelevanceResult> {
  const storylineContext = storylines
    .map((s) => `- "${s.title}": ${s.synopsis || 'No synopsis'}`)
    .join('\n');

  const prompt = `You are filtering news results for a reality TV production team.

CAST MEMBER: ${castName}
SHOW: ${showContext}

KNOWN STORYLINES FOR THIS CAST:
${storylineContext || 'No storylines defined yet'}

NEWS ITEM TO EVALUATE:
Title: ${result.title}
Source: ${result.sourceName}
Content: ${result.content}

EVALUATE THIS NEWS ITEM:
1. Is this actually about ${castName} from ${showContext}? (not someone with a similar name)
2. Is this relevant to their storyline or the show? (not unrelated celebrity gossip)
3. Which of the known storylines does this relate to? (list IDs, or empty if none)
4. Summarize the key update in 1-2 sentences.

Respond in JSON format:
{
  "isRelevant": true/false,
  "confidenceScore": 0.0-1.0,
  "relevanceReason": "Why this is or isn't relevant",
  "storylineMatches": ["storyline-id-1", "storyline-id-2"],
  "suggestedSummary": "1-2 sentence summary of the update",
  "entityMentions": ["Other cast members mentioned"]
}`;

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch {
    // Fallback if parsing fails
    return {
      isRelevant: false,
      confidenceScore: 0,
      relevanceReason: 'Failed to parse relevance assessment',
      storylineMatches: [],
      suggestedSummary: '',
      entityMentions: [],
    };
  }
}

/**
 * Batch filter multiple results for relevance
 */
export async function filterRelevantUpdates(
  results: MonitoringRawResult[],
  castName: string,
  storylines: Array<Pick<Storyline, 'id' | 'title' | 'synopsis' | 'primaryCast'>>,
  showContext: string,
  minConfidence: number = 0.6
): Promise<ProcessedUpdate[]> {
  const processedUpdates: ProcessedUpdate[] = [];

  // Process in batches to avoid rate limits
  const batchSize = 5;

  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);

    const assessments = await Promise.allSettled(
      batch.map((result) =>
        assessRelevance(result, castName, storylines, showContext)
      )
    );

    for (let j = 0; j < batch.length; j++) {
      const result = batch[j];
      const assessment = assessments[j];

      if (assessment.status !== 'fulfilled') {
        console.error(`Failed to assess relevance:`, assessment.reason);
        continue;
      }

      const relevance = assessment.value;

      // Skip if not relevant or low confidence
      if (!relevance.isRelevant || relevance.confidenceScore < minConfidence) {
        continue;
      }

      // Create processed update for each matching storyline
      // If no storyline matches, create a general update
      const targetStorylines =
        relevance.storylineMatches.length > 0
          ? relevance.storylineMatches
          : storylines.length > 0
            ? [storylines[0].id] // Default to first storyline
            : [];

      for (const storylineId of targetStorylines) {
        processedUpdates.push({
          storylineId,
          updateType: 'news',
          sourceUrl: result.sourceUrl,
          sourceName: result.sourceName,
          title: result.title,
          content: result.content,
          summary: relevance.suggestedSummary,
          confidenceScore: relevance.confidenceScore,
          publishedAt: result.publishedAt,
        });
      }
    }

    // Rate limit delay between batches
    if (i + batchSize < results.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return processedUpdates;
}

/**
 * Quick relevance check without full analysis
 * Used for initial filtering before detailed assessment
 */
export async function quickRelevanceCheck(
  title: string,
  snippet: string,
  castName: string,
  showContext: string
): Promise<boolean> {
  const prompt = `Quick check: Is this news about ${castName} from ${showContext}?

Title: ${title}
Snippet: ${snippet}

Answer only "yes" or "no".`;

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 10,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    return false;
  }

  return content.text.toLowerCase().includes('yes');
}
