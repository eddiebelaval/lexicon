/**
 * Monitoring Orchestration
 *
 * Main entry point for the monitoring system.
 * Coordinates source searches, relevance filtering, and storage.
 */

import { searchMultipleCast } from './sources/perplexity';
import { searchShowNews, isNewsAPIAvailable } from './sources/newsapi';
import { filterRelevantUpdates } from './relevance';
import { createStorylineUpdate, listStorylines } from '../storylines';
import { getUniverseEntities } from '../search';
import type {
  MonitoringConfig,
  MonitoringJobResult,
  MonitoringError,
  MonitoringRawResult,
  ProcessedUpdate,
} from './types';
import type { Storyline } from '@/types';

// Re-export types
export type {
  MonitoringConfig,
  MonitoringJobResult,
  MonitoringError,
  MonitoringRawResult,
  ProcessedUpdate,
} from './types';

/**
 * Run a full monitoring job for a universe
 *
 * This is the main function called by the cron job.
 */
export async function runMonitoringJob(
  config: MonitoringConfig
): Promise<MonitoringJobResult> {
  const startedAt = new Date();
  const errors: MonitoringError[] = [];
  let rawResultsFound = 0;
  let relevantUpdates = 0;
  let updatesStored = 0;

  console.log(`[Monitoring] Starting job for universe ${config.universeId}`);

  // Step 1: Get cast names to monitor
  let castNames = config.castNames;

  if (castNames.length === 0) {
    // If no cast specified, get all characters from the universe
    try {
      const entities = await getUniverseEntities(config.universeId, 'character', 100);
      castNames = entities.map((e) => e.name);
      console.log(`[Monitoring] Found ${castNames.length} characters to monitor`);
    } catch (error) {
      errors.push({
        stage: 'search',
        message: 'Failed to fetch universe entities',
        details: error,
      });
    }
  }

  // Step 2: Get storylines for relevance matching
  let storylines: Storyline[] = [];
  try {
    const storylinesResponse = await listStorylines(config.universeId, { limit: 100 });
    storylines = storylinesResponse.items;
    console.log(`[Monitoring] Found ${storylines.length} storylines for matching`);
  } catch (error) {
    errors.push({
      stage: 'relevance',
      message: 'Failed to fetch storylines',
      details: error,
    });
  }

  // Step 3: Search for news via Perplexity
  const allRawResults: MonitoringRawResult[] = [];

  if (castNames.length > 0) {
    try {
      // TODO: Get show context from universe metadata
      const showContext = '90 Day Fiance'; // Default for now

      const perplexityResults = await searchMultipleCast(
        castNames,
        showContext,
        config.maxResultsPerCast ?? 3
      );

      for (const [castName, results] of perplexityResults) {
        console.log(`[Monitoring] ${castName}: ${results.length} results from Perplexity`);
        allRawResults.push(...results);
      }
    } catch (error) {
      errors.push({
        stage: 'search',
        message: 'Perplexity search failed',
        details: error,
      });
    }
  }

  // Step 4: Optionally supplement with NewsAPI
  if (isNewsAPIAvailable()) {
    try {
      const showContext = '90 Day Fiance';
      const newsApiResults = await searchShowNews(showContext, 10);
      console.log(`[Monitoring] ${newsApiResults.length} results from NewsAPI`);
      allRawResults.push(...newsApiResults);
    } catch (error) {
      // NewsAPI is supplementary, don't fail the job
      console.warn('[Monitoring] NewsAPI search failed:', error);
    }
  }

  rawResultsFound = allRawResults.length;
  console.log(`[Monitoring] Total raw results: ${rawResultsFound}`);

  // Step 5: Filter for relevance
  const processedUpdates: ProcessedUpdate[] = [];

  if (allRawResults.length > 0 && storylines.length > 0) {
    try {
      const showContext = '90 Day Fiance';
      const minConfidence = config.minConfidenceScore ?? 0.6;

      // Group results by cast member for better relevance assessment
      const resultsByCast = new Map<string, MonitoringRawResult[]>();

      for (const result of allRawResults) {
        const castName = (result.rawData?.castName as string) || 'unknown';
        const existing = resultsByCast.get(castName) || [];
        existing.push(result);
        resultsByCast.set(castName, existing);
      }

      for (const [castName, results] of resultsByCast) {
        // Get storylines for this cast member
        const castStorylines = storylines.filter(
          (s) =>
            s.primaryCast.some((id) =>
              storylines.find(
                (st) =>
                  st.id === s.id &&
                  st.primaryCast.includes(id)
              )
            ) ||
            s.title.toLowerCase().includes(castName.toLowerCase())
        );

        const filtered = await filterRelevantUpdates(
          results,
          castName,
          castStorylines.length > 0 ? castStorylines : storylines,
          showContext,
          minConfidence
        );

        processedUpdates.push(...filtered);
      }

      relevantUpdates = processedUpdates.length;
      console.log(`[Monitoring] Relevant updates after filtering: ${relevantUpdates}`);
    } catch (error) {
      errors.push({
        stage: 'relevance',
        message: 'Relevance filtering failed',
        details: error,
      });
    }
  }

  // Step 6: Store updates
  for (const update of processedUpdates) {
    try {
      await createStorylineUpdate({
        storylineId: update.storylineId,
        updateType: update.updateType,
        sourceUrl: update.sourceUrl,
        sourceName: update.sourceName,
        title: update.title,
        content: update.content,
        summary: update.summary,
        confidenceScore: update.confidenceScore,
        publishedAt: update.publishedAt || undefined,
      });
      updatesStored++;
    } catch (error) {
      errors.push({
        stage: 'storage',
        message: `Failed to store update: ${update.title}`,
        details: error,
      });
    }
  }

  console.log(`[Monitoring] Stored ${updatesStored} updates`);

  return {
    universeId: config.universeId,
    startedAt,
    completedAt: new Date(),
    castsSearched: castNames.length,
    rawResultsFound,
    relevantUpdates,
    updatesStored,
    errors,
  };
}

/**
 * Run monitoring for all active universes
 */
export async function runGlobalMonitoring(): Promise<MonitoringJobResult[]> {
  // TODO: Get list of universes with monitoring enabled
  // For now, this is a placeholder
  console.log('[Monitoring] Global monitoring not yet implemented');
  return [];
}
