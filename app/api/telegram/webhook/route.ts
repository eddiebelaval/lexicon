/**
 * Telegram Webhook Endpoint
 *
 * POST /api/telegram/webhook
 *
 * Receives Telegram updates and routes them through Lexi.
 * Secured by the webhook secret path — Telegram only sends
 * updates to the exact URL we registered.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTelegramWebhookHandler } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const handler = getTelegramWebhookHandler();
    return handler(request);
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// Telegram sends a GET to verify the webhook URL
export async function GET() {
  return NextResponse.json({ ok: true, bot: 'lexi' });
}
