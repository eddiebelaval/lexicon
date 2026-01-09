/**
 * Digest Generation
 *
 * Generates daily digest summaries from storyline updates.
 * Synthesizes multiple updates into a coherent briefing.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { DigestConfig, DigestContent } from './monitoring/types';
import type { StorylineUpdate, Digest } from '@/types';

// Singleton client instance
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY environment variable');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// Lazy-initialize Supabase client (untyped for new tables)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: SupabaseClient<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(): SupabaseClient<any> {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    _supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return _supabase;
}

/**
 * Convert database row to StorylineUpdate type
 */
function parseStorylineUpdateFromDb(row: Record<string, unknown>): StorylineUpdate {
  return {
    id: row.id as string,
    storylineId: row.storyline_id as string,
    updateType: row.update_type as StorylineUpdate['updateType'],
    sourceUrl: row.source_url as string | null,
    sourceName: row.source_name as string | null,
    title: row.title as string | null,
    content: row.content as string,
    summary: row.summary as string | null,
    confidenceScore: row.confidence_score as number | null,
    processedAt: row.processed_at ? new Date(row.processed_at as string) : null,
    includedInDigest: row.included_in_digest as boolean,
    publishedAt: row.published_at ? new Date(row.published_at as string) : null,
    createdAt: new Date(row.created_at as string),
  };
}

/**
 * Convert database row to Digest type
 */
function parseDigestFromDb(row: Record<string, unknown>): Digest {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    universeId: row.universe_id as string | null,
    title: row.title as string,
    summary: row.summary as string,
    fullContent: row.full_content as string,
    updatesCount: row.updates_count as number,
    storylinesCount: row.storylines_count as number,
    periodStart: new Date(row.period_start as string),
    periodEnd: new Date(row.period_end as string),
    generatedAt: new Date(row.generated_at as string),
    viewedAt: row.viewed_at ? new Date(row.viewed_at as string) : null,
    emailedAt: row.emailed_at ? new Date(row.emailed_at as string) : null,
    updateIds: (row.update_ids as string[]) || [],
  };
}

/**
 * Get unprocessed updates for a time period
 */
export async function getUpdatesForDigest(
  universeId: string | null,
  periodHours: number = 24
): Promise<StorylineUpdate[]> {
  const supabase = getSupabase();
  const periodStart = new Date();
  periodStart.setHours(periodStart.getHours() - periodHours);

  let query = supabase
    .from('storyline_updates')
    .select(`
      *,
      storylines!inner(universe_id)
    `)
    .eq('included_in_digest', false)
    .gte('created_at', periodStart.toISOString())
    .order('created_at', { ascending: false });

  if (universeId) {
    query = query.eq('storylines.universe_id', universeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching updates for digest:', error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) =>
    parseStorylineUpdateFromDb(row)
  );
}

/**
 * Generate digest content from updates
 */
export async function generateDigestContent(
  updates: StorylineUpdate[],
  config: DigestConfig
): Promise<DigestContent> {
  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setHours(periodStart.getHours() - (config.periodHours || 24));

  if (updates.length === 0) {
    return {
      title: 'No New Updates',
      summary: 'There were no new updates in this period.',
      fullContent: 'No storyline updates were found in the last 24 hours.',
      updatesCount: 0,
      storylinesCount: 0,
      periodStart,
      periodEnd,
      updateIds: [],
    };
  }

  // Group updates by storyline
  const byStoryline = new Map<string, StorylineUpdate[]>();
  for (const update of updates) {
    const existing = byStoryline.get(update.storylineId) || [];
    existing.push(update);
    byStoryline.set(update.storylineId, existing);
  }

  // Format updates for Claude
  const updatesText = Array.from(byStoryline.entries())
    .map(([storylineId, storylineUpdates]) => {
      const updatesList = storylineUpdates
        .map(
          (u) =>
            `- ${u.title || 'Update'} (${u.sourceName || 'Unknown source'})\n  ${u.summary || u.content.slice(0, 200)}`
        )
        .join('\n');
      return `Storyline ${storylineId}:\n${updatesList}`;
    })
    .join('\n\n');

  // Generate digest with Claude
  const prompt = `You are creating a daily digest for a reality TV production team.

UPDATES FROM THE LAST 24 HOURS:
${updatesText}

Create a professional digest with:
1. A compelling headline/title (10 words max)
2. An executive summary (2-3 sentences covering the most important updates)
3. A full content section organized by storyline with key details

Format your response as:
TITLE: [headline]

SUMMARY:
[executive summary]

FULL CONTENT:
[organized detailed content with headers for each storyline]`;

  const response = await getAnthropicClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  const text = content.text;

  // Parse response
  const titleMatch = text.match(/TITLE:\s*(.+)/i);
  const summaryMatch = text.match(/SUMMARY:\s*([\s\S]*?)(?=FULL CONTENT:|$)/i);
  const fullContentMatch = text.match(/FULL CONTENT:\s*([\s\S]*)/i);

  return {
    title: titleMatch?.[1]?.trim() || 'Daily Digest',
    summary: summaryMatch?.[1]?.trim() || 'Updates available.',
    fullContent: fullContentMatch?.[1]?.trim() || text,
    updatesCount: updates.length,
    storylinesCount: byStoryline.size,
    periodStart,
    periodEnd,
    updateIds: updates.map((u) => u.id),
  };
}

/**
 * Save a digest to the database
 */
export async function saveDigest(
  userId: string,
  universeId: string | null,
  content: DigestContent
): Promise<Digest | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('digests')
    .insert({
      user_id: userId,
      universe_id: universeId,
      title: content.title,
      summary: content.summary,
      full_content: content.fullContent,
      updates_count: content.updatesCount,
      storylines_count: content.storylinesCount,
      period_start: content.periodStart.toISOString(),
      period_end: content.periodEnd.toISOString(),
      update_ids: content.updateIds,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving digest:', error);
    return null;
  }

  // Mark updates as included in digest
  if (content.updateIds.length > 0) {
    await supabase
      .from('storyline_updates')
      .update({ included_in_digest: true })
      .in('id', content.updateIds);
  }

  return parseDigestFromDb(data as Record<string, unknown>);
}

/**
 * Get recent digests for a user
 */
export async function getUserDigests(
  userId: string,
  limit: number = 10
): Promise<Digest[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('digests')
    .select('*')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching user digests:', error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) =>
    parseDigestFromDb(row)
  );
}

/**
 * Mark a digest as viewed
 */
export async function markDigestViewed(digestId: string): Promise<void> {
  const supabase = getSupabase();

  await supabase
    .from('digests')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', digestId);
}

/**
 * Generate and save digest for a user
 */
export async function createUserDigest(
  userId: string,
  universeId: string | null = null,
  periodHours: number = 24
): Promise<Digest | null> {
  // Get updates
  const updates = await getUpdatesForDigest(universeId, periodHours);

  if (updates.length === 0) {
    console.log(`[Digest] No updates found for user ${userId}`);
    return null;
  }

  // Generate content
  const content = await generateDigestContent(updates, {
    userId,
    universeId: universeId || undefined,
    periodHours,
  });

  // Save digest
  return saveDigest(userId, universeId, content);
}
