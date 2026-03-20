/**
 * Lexi Brief API Route
 *
 * GET /api/lexi-brief?productionId=X
 * Returns a one-paragraph first-person brief from Lexi (Claude-generated).
 * Falls back to a computed brief if the Claude call fails.
 * Cached for 5 minutes per production.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildProductionSummary } from '@/lib/lexi';

// Simple 5-minute cache keyed by productionId + time bucket
const cache = new Map<string, { text: string; generatedAt: string }>();

function getCacheKey(productionId: string): string {
  const bucket = Math.floor(Date.now() / (5 * 60 * 1000));
  return `${productionId}:${bucket}`;
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

    // Check cache
    const cacheKey = getCacheKey(productionId);
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
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
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY');

      const client = new Anthropic({ apiKey });
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
      // Computed fallback: no API dependency
      text = `**${summary.signedCast}/${summary.totalCast}** contracts signed. **${summary.scenesShot}/${summary.totalScenes}** scenes shot. **${summary.totalCrew}** active crew.`;
    }

    const generatedAt = new Date().toISOString();
    const result = { text, generatedAt };

    // Store in cache
    cache.set(cacheKey, result);

    return NextResponse.json({ success: true, data: result });
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
