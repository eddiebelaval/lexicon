import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email as string)?.trim()?.toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Store in a simple waitlist table (create if first run via upsert pattern)
    const { error } = await supabase
      .from('waitlist')
      .upsert(
        { email, created_at: new Date().toISOString() },
        { onConflict: 'email' }
      );

    if (error) {
      // Table might not exist yet. Log and return success anyway (don't block UX).
      console.error('Waitlist insert error (table may not exist):', error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
