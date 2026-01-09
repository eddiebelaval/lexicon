/**
 * NewsAPI Integration
 *
 * Backup/supplementary source for entertainment news.
 * Good for catching mainstream media coverage.
 */

import type { MonitoringRawResult, NewsAPIResponse } from '../types';

// Lazy environment validation
function getNewsApiKey(): string {
  const key = process.env.NEWSAPI_KEY;
  if (!key) {
    throw new Error('Missing NEWSAPI_KEY environment variable');
  }
  return key;
}

/**
 * Search for news about a cast member via NewsAPI
 *
 * @param castName - Full name of the cast member
 * @param showContext - Show name for additional context
 * @param maxResults - Maximum results to return
 */
export async function searchCastNewsAPI(
  castName: string,
  showContext: string,
  maxResults: number = 5
): Promise<MonitoringRawResult[]> {
  const apiKey = getNewsApiKey();

  // Combine cast name with show context for better targeting
  const query = `"${castName}" AND ("${showContext}" OR "reality TV" OR "TLC")`;

  // Get news from the last 7 days
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);
  const fromDateStr = fromDate.toISOString().split('T')[0];

  try {
    const params = new URLSearchParams({
      q: query,
      from: fromDateStr,
      sortBy: 'publishedAt',
      language: 'en',
      pageSize: maxResults.toString(),
      apiKey,
    });

    const response = await fetch(
      `https://newsapi.org/v2/everything?${params.toString()}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NewsAPI error: ${response.status} - ${errorText}`);
    }

    const data: NewsAPIResponse = await response.json();

    if (data.status !== 'ok') {
      throw new Error(`NewsAPI returned status: ${data.status}`);
    }

    return data.articles.map((article) => ({
      sourceType: 'newsapi' as const,
      sourceName: article.source.name,
      sourceUrl: article.url,
      title: article.title,
      content: article.content || article.description || '',
      snippet: article.description || '',
      publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
      rawData: {
        castName,
        showContext,
        author: article.author,
        imageUrl: article.urlToImage,
      },
    }));
  } catch (error) {
    console.error(`NewsAPI search error for ${castName}:`, error);
    throw error;
  }
}

/**
 * Search for general show news (not cast-specific)
 */
export async function searchShowNews(
  showName: string,
  maxResults: number = 10
): Promise<MonitoringRawResult[]> {
  const apiKey = getNewsApiKey();

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);
  const fromDateStr = fromDate.toISOString().split('T')[0];

  try {
    const params = new URLSearchParams({
      q: `"${showName}"`,
      from: fromDateStr,
      sortBy: 'publishedAt',
      language: 'en',
      pageSize: maxResults.toString(),
      apiKey,
    });

    const response = await fetch(
      `https://newsapi.org/v2/everything?${params.toString()}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NewsAPI error: ${response.status} - ${errorText}`);
    }

    const data: NewsAPIResponse = await response.json();

    if (data.status !== 'ok') {
      throw new Error(`NewsAPI returned status: ${data.status}`);
    }

    return data.articles.map((article) => ({
      sourceType: 'newsapi' as const,
      sourceName: article.source.name,
      sourceUrl: article.url,
      title: article.title,
      content: article.content || article.description || '',
      snippet: article.description || '',
      publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
      rawData: {
        showName,
        author: article.author,
        imageUrl: article.urlToImage,
      },
    }));
  } catch (error) {
    console.error(`NewsAPI search error for show ${showName}:`, error);
    throw error;
  }
}

/**
 * Check if NewsAPI is available (has API key)
 */
export function isNewsAPIAvailable(): boolean {
  return !!process.env.NEWSAPI_KEY;
}
