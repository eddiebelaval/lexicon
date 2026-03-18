/**
 * Telegram Registration Code API
 *
 * POST /api/telegram/register
 * Body: { crewMemberId: string }
 *
 * Generates a 6-character code that a crew member uses with /start <code>
 * in the Lexi Telegram bot to link their account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationCode } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { crewMemberId } = await request.json();

    if (!crewMemberId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'crewMemberId is required' } },
        { status: 400 }
      );
    }

    const code = await generateRegistrationCode(crewMemberId);

    if (!code) {
      return NextResponse.json(
        { success: false, error: { code: 'GENERATION_FAILED', message: 'Failed to generate code' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        code,
        instructions: `Send this to the crew member: Open Telegram, find @LexiProductionBot, and type /start ${code}`,
        expiresIn: '24 hours',
      },
    });
  } catch (error) {
    console.error('Registration code error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate registration code' } },
      { status: 500 }
    );
  }
}
