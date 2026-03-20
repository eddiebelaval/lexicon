// ENV: PERPLEXITY_API_KEY must be set in Vercel environment variables for production.
// Local: add to .env.local (already present).

import type { CastProfile } from './types';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

interface PerplexityResponse {
  choices: { message: { content: string } }[];
}

export async function searchPerplexity(query: string): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error('Missing PERPLEXITY_API_KEY');

  const response = await fetch(PERPLEXITY_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content:
            'You are a research assistant. Return structured data about reality TV cast members. Be factual and cite sources. Return JSON when asked.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Perplexity API error ${response.status}: ${text}`);
  }

  const data: PerplexityResponse = await response.json();
  return data.choices[0]?.message?.content ?? '';
}

function parseJsonFromText(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // fall through
      }
    }
  }
  return {};
}

function parseJsonArrayFromText(text: string): unknown[] {
  try {
    const result = JSON.parse(text);
    if (Array.isArray(result)) return result;
  } catch {
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        const result = JSON.parse(arrayMatch[0]);
        if (Array.isArray(result)) return result;
      } catch {
        // fall through
      }
    }
  }
  return [];
}

export async function enrichCastWithPerplexity(
  castName: string
): Promise<Partial<CastProfile>> {
  // Query 1: Bio + show history + social media
  const bioQuery = `Research "${castName}" from the 90 Day Fiance franchise (TLC reality TV show). Return a JSON object with these fields:
{
  "bio": "1-2 sentence bio",
  "age": number or null,
  "occupation": "their job/occupation" or null,
  "location": "city, state/country" or null,
  "showHistory": [{"show": "show name", "seasons": ["S1", "S2"]}],
  "socialMedia": {"instagram": "@handle or full URL", "tiktok": "@handle", "twitter": "@handle"},
  "relationships": [{"name": "partner/family name", "type": "spouse/partner/ex/family"}],
  "photoDescription": "description of a commonly used press photo of them"
}
Only include facts you are confident about. Return valid JSON only, no markdown.`;

  const bioResult = await searchPerplexity(bioQuery);
  const parsed = parseJsonFromText(bioResult);

  // Query 2: Recent news
  const newsQuery = `What are the most recent news articles or social media highlights about "${castName}" from 90 Day Fiance? Return a JSON array:
[{"title": "headline", "url": "article url", "date": "YYYY-MM-DD if known", "source": "publication name"}]
Only include real, verifiable articles from the last 6 months. Return valid JSON array only, no markdown.`;

  let recentNews: CastProfile['recentNews'] = [];
  try {
    const newsResult = await searchPerplexity(newsQuery);
    recentNews = parseJsonArrayFromText(newsResult) as CastProfile['recentNews'];
  } catch {
    // News is optional, don't fail
  }

  // Query 3: Photo URL (search for press photos/Instagram profile)
  const photoQuery = `What is the Instagram profile URL for "${castName}" from 90 Day Fiance? Also, find a publicly available press photo or profile image URL. Return JSON: {"instagramUrl": "url", "photoUrl": "direct image url if available", "photoSource": "where the photo is from"}. Return valid JSON only.`;

  let photoUrl: string | null = null;
  let photoSource: string | null = null;
  try {
    const photoResult = await searchPerplexity(photoQuery);
    const photoData = parseJsonFromText(photoResult);
    photoUrl = (photoData.photoUrl as string) || null;
    photoSource = (photoData.photoSource as string) || null;
    if (
      photoData.instagramUrl &&
      typeof parsed.socialMedia === 'object' &&
      parsed.socialMedia
    ) {
      (parsed.socialMedia as Record<string, string>).instagram =
        photoData.instagramUrl as string;
    }
  } catch {
    // Photo is optional
  }

  return {
    bio: (parsed.bio as string) || null,
    age: typeof parsed.age === 'number' ? parsed.age : null,
    occupation: (parsed.occupation as string) || null,
    location: (parsed.location as string) || null,
    showHistory: Array.isArray(parsed.showHistory)
      ? (parsed.showHistory as CastProfile['showHistory'])
      : [],
    socialMedia: (parsed.socialMedia as CastProfile['socialMedia']) || {},
    relationships: Array.isArray(parsed.relationships)
      ? (parsed.relationships as CastProfile['relationships'])
      : [],
    recentNews,
    photoUrl,
    photoSource,
    sources: [
      {
        engine: 'perplexity' as const,
        query: `${castName} 90 Day Fiance`,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
