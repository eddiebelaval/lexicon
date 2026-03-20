import type { CastProfile, EnrichmentResult } from './types';
import { enrichCastWithPerplexity } from './perplexity';
import { enrichCastWithGrok } from './grok';

function generateEntityId(castName: string): string {
  return (
    'cast-' +
    castName
      .toLowerCase()
      .replace(/\s*&\s*/g, '+')
      .replace(/[^a-z0-9+]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

export async function enrichCastMember(
  castName: string
): Promise<EnrichmentResult> {
  const errors: string[] = [];
  const entityId = generateEntityId(castName);

  // Run both engines in parallel
  const [perplexityResult, grokResult] = await Promise.allSettled([
    enrichCastWithPerplexity(castName),
    enrichCastWithGrok(castName),
  ]);

  const perplexity =
    perplexityResult.status === 'fulfilled' ? perplexityResult.value : {};
  const grok = grokResult.status === 'fulfilled' ? grokResult.value : {};

  if (perplexityResult.status === 'rejected') {
    errors.push(`Perplexity: ${perplexityResult.reason}`);
  }
  if (grokResult.status === 'rejected') {
    errors.push(`Grok: ${grokResult.reason}`);
  }

  // Merge results: Perplexity is primary for deep data, Grok supplements with real-time
  const mergedNews = [
    ...(perplexity.recentNews ?? []),
    ...(grok.recentNews ?? []),
  ];

  // Deduplicate news by URL
  const seenUrls = new Set<string>();
  const dedupedNews = mergedNews.filter((item) => {
    if (seenUrls.has(item.url)) return false;
    seenUrls.add(item.url);
    return true;
  });

  const profile: CastProfile = {
    castName,
    entityId,

    // Perplexity provides the deep data
    photoUrl: perplexity.photoUrl ?? null,
    photoSource: perplexity.photoSource ?? null,
    bio: perplexity.bio ?? null,
    age: perplexity.age ?? null,
    occupation: perplexity.occupation ?? null,
    location: perplexity.location ?? null,
    showHistory: perplexity.showHistory ?? [],
    socialMedia: perplexity.socialMedia ?? {},
    relationships: perplexity.relationships ?? [],

    // Merged news from both engines
    recentNews: dedupedNews,

    // Combined sources
    sources: [...(perplexity.sources ?? []), ...(grok.sources ?? [])],

    enrichedAt: new Date().toISOString(),
  };

  return {
    success: errors.length === 0 || profile.bio !== null, // Success if we got at least a bio
    profile,
    errors,
  };
}

export async function enrichCastBatch(
  castNames: string[],
  onProgress?: (completed: number, total: number, current: string) => void
): Promise<EnrichmentResult[]> {
  const results: EnrichmentResult[] = [];

  // Process in batches of 3 to avoid rate limits
  const BATCH_SIZE = 3;
  for (let i = 0; i < castNames.length; i += BATCH_SIZE) {
    const batch = castNames.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((name) => enrichCastMember(name))
    );
    results.push(...batchResults);

    if (onProgress) {
      onProgress(results.length, castNames.length, batch[batch.length - 1]);
    }

    // Rate limit pause between batches (not after the last one)
    if (i + BATCH_SIZE < castNames.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
