/**
 * Lexi Brief API Route
 *
 * GET /api/lexi-brief?productionId=X
 * Returns a one-paragraph first-person brief from Lexi (Claude-generated).
 * Falls back to a computed brief if the Claude call fails.
 * Cached for 5 minutes per production.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/claude';
import { buildProductionSummary } from '@/lib/lexi';

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 100;

const cache = new Map<string, { text: string; generatedAt: string; expiresAt: number }>();

function evictExpired() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productionId = searchParams.get('productionId');

    if (!productionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'productionId query parameter is required',
          },
        },
        { status: 400 }
      );
    }

    // Check cache (evict stale entries first)
    evictExpired();
    const cached = cache.get(productionId);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({
        success: true,
        data: { text: cached.text, generatedAt: cached.generatedAt },
      });
    }

    // Build production summary
    const summary = await buildProductionSummary(productionId);
    if (!summary) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Production not found',
          },
        },
        { status: 404 }
      );
    }

    let text: string;

    try {
      const client = getClient();
      const response = await client.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: `You are Lexi, the production intelligence for this show. Summarize the current production status in ONE paragraph, first person. Bold key numbers with **markdown**. Under 50 words. Here is the data: ${JSON.stringify(summary)}`,
          },
        ],
      });

      const block = response.content[0];
      text = block.type === 'text' ? block.text : '';
    } catch (err) {
      console.error('Lexi brief Claude call failed, using fallback:', err);
      text = `**${summary.signedCast}/${summary.totalCast}** contracts signed. **${summary.scenesShot}/${summary.totalScenes}** scenes shot. **${summary.totalCrew}** active crew.`;
    }

    const generatedAt = new Date().toISOString();

    // Cap cache size to prevent unbounded growth
    if (cache.size >= MAX_CACHE_SIZE) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }

    cache.set(productionId, { text, generatedAt, expiresAt: Date.now() + CACHE_TTL_MS });

    return NextResponse.json({ success: true, data: { text, generatedAt } });
  } catch (error) {
    console.error('Error generating Lexi brief:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate Lexi brief',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
