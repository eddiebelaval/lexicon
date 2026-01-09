/**
 * Monitoring System Type Definitions
 *
 * Types for the web monitoring, relevance filtering, and digest system.
 */

/**
 * Raw result from a monitoring source (Perplexity, NewsAPI, etc.)
 */
export interface MonitoringRawResult {
  sourceType: 'perplexity' | 'newsapi' | 'firecrawl';
  sourceName: string;
  sourceUrl: string;
  title: string;
  content: string;
  snippet?: string;
  publishedAt: Date | null;
  rawData?: Record<string, unknown>;
}

/**
 * Result after Claude relevance filtering
 */
export interface RelevanceResult {
  isRelevant: boolean;
  confidenceScore: number; // 0.0 - 1.0
  relevanceReason: string;
  storylineMatches: string[]; // IDs of storylines this relates to
  suggestedSummary: string;
  entityMentions: string[]; // Names of entities detected
}

/**
 * Monitoring result ready for storage
 */
export interface ProcessedUpdate {
  storylineId: string;
  updateType: 'news' | 'social_media' | 'manual' | 'ai_enrichment';
  sourceUrl: string;
  sourceName: string;
  title: string;
  content: string;
  summary: string;
  confidenceScore: number;
  publishedAt: Date | null;
}

/**
 * Monitoring job configuration
 */
export interface MonitoringConfig {
  universeId: string;
  castNames: string[];
  storylineIds: string[];
  maxResultsPerCast?: number;
  minConfidenceScore?: number;
}

/**
 * Monitoring job result
 */
export interface MonitoringJobResult {
  universeId: string;
  startedAt: Date;
  completedAt: Date;
  castsSearched: number;
  rawResultsFound: number;
  relevantUpdates: number;
  updatesStored: number;
  errors: MonitoringError[];
}

/**
 * Monitoring error
 */
export interface MonitoringError {
  stage: 'search' | 'relevance' | 'storage';
  castName?: string;
  message: string;
  details?: unknown;
}

/**
 * Digest configuration
 */
export interface DigestConfig {
  userId: string;
  universeId?: string; // Optional - null means all universes
  periodHours?: number; // Default 24
  maxUpdates?: number;
}

/**
 * Digest content ready for delivery
 */
export interface DigestContent {
  title: string;
  summary: string;
  fullContent: string;
  updatesCount: number;
  storylinesCount: number;
  periodStart: Date;
  periodEnd: Date;
  updateIds: string[];
}

/**
 * Perplexity API response structure
 */
export interface PerplexityResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
  citations?: string[];
}

/**
 * NewsAPI response structure
 */
export interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: Array<{
    source: { id: string | null; name: string };
    author: string | null;
    title: string;
    description: string;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string;
  }>;
}
