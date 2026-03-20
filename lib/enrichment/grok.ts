// ENV: GROK_API_KEY must be set in Vercel environment variables for production.
// Currently stubbed: returns empty data when GROK_API_KEY is not configured.

import type { CastProfile } from './types';

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';

export async function searchGrok(query: string): Promise<string> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    // Grok not configured yet, return empty
    return '';
  }

  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-3',
      messages: [
        {
          role: 'system',
          content:
            'You are a real-time research assistant with access to X/Twitter data and current events. Return structured data about reality TV cast members. Be factual. Return JSON when asked.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Grok API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

export async function enrichCastWithGrok(
  castName: string
): Promise<Partial<CastProfile>> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    // Grok not available, return empty profile
    return { sources: [] };
  }

  // Grok excels at real-time X/Twitter data and very recent events
  const query = `Search for the latest news, social media posts, and real-time updates about "${castName}" from 90 Day Fiance (TLC). Focus on:
1. Their most recent X/Twitter or social media activity
2. Any news from the last 30 days
3. Current relationship status if recently changed
4. Any upcoming show appearances

Return JSON:
{
  "recentNews": [{"title": "headline", "url": "url", "date": "YYYY-MM-DD", "source": "source"}],
  "recentSocialActivity": "brief summary of recent social media activity",
  "currentStatus": "any notable current status updates"
}
Return valid JSON only.`;

  try {
    const result = await searchGrok(query);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { sources: [] };

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      recentNews: Array.isArray(parsed.recentNews) ? parsed.recentNews : [],
      sources: [
        {
          engine: 'grok' as const,
          query: `${castName} 90 Day Fiance recent`,
          timestamp: new Date().toISOString(),
        },
      ],
    };
  } catch (err) {
    console.error('Grok enrichment failed:', err);
    return { sources: [] };
  }
}
