/**
 * Lexi Telegram Bot
 *
 * Each crew member speaks to Lexi via Telegram.
 * Changes appear on the dashboard in real-time for everyone.
 * Full audit trail: who did what, when, via what channel.
 *
 * Flow:
 *   Crew message -> identify crew member -> Lexi intelligence
 *   -> tool execution -> Supabase write -> Realtime broadcast
 *   -> activity log -> Telegram reply
 *
 * Registration:
 *   /start <code> — links Telegram account to crew record
 *   Codes generated from the dashboard (24h expiry, single use)
 */

import { Bot, webhookCallback } from 'grammy';
import type { Context } from 'grammy';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sendChatMessage } from './chat';
import { logActivity } from './activity-log';
import { buildRoleInstructions, getRoleDisplayName } from './permissions';
import type { CrewMember } from '@/types';

// ============================================
// Bot Instance (singleton)
// ============================================

let _bot: Bot | null = null;

export function getBot(): Bot {
  if (!_bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN');
    _bot = new Bot(token);
    registerHandlers(_bot);
  }
  return _bot;
}

/**
 * Get the webhook handler for Next.js API route.
 */
export function getTelegramWebhookHandler() {
  return webhookCallback(getBot(), 'std/http');
}

// ============================================
// Supabase Client
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: SupabaseClient<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDb(): SupabaseClient<any> {
  if (!_db) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing Supabase env vars');
    _db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _db;
}

// ============================================
// Crew Member Lookup
// ============================================

interface CrewWithProduction extends CrewMember {
  production: { id: string; universeId: string; name: string };
}

async function findCrewByTelegramId(telegramUserId: string): Promise<CrewWithProduction | null> {
  const db = getDb();
  const { data, error } = await db
    .from('crew_members')
    .select('*, productions!inner(id, universe_id, name)')
    .eq('telegram_user_id', telegramUserId)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    productionId: data.production_id,
    name: data.name,
    role: data.role,
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    production: {
      id: data.productions.id,
      universeId: data.productions.universe_id,
      name: data.productions.name,
    },
  };
}

// ============================================
// Registration
// ============================================

async function handleRegistration(ctx: Context, code: string): Promise<void> {
  const telegramUserId = ctx.from?.id?.toString();
  const telegramUsername = ctx.from?.username || null;

  if (!telegramUserId) {
    await ctx.reply('Could not identify your Telegram account.');
    return;
  }

  const db = getDb();

  // Check if already registered
  const { data: existing } = await db
    .from('crew_members')
    .select('name, role')
    .eq('telegram_user_id', telegramUserId)
    .single();

  if (existing) {
    await ctx.reply(
      `You're already registered as ${existing.name} (${existing.role.toUpperCase()}). Just send me a message and I'll help.`
    );
    return;
  }

  // Find valid registration code
  const { data: regCode, error: codeError } = await db
    .from('telegram_registration_codes')
    .select('*, crew_members!inner(id, name, role, production_id)')
    .eq('code', code.trim())
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (codeError || !regCode) {
    await ctx.reply(
      'Invalid or expired registration code. Ask your production coordinator for a new one from the Lexicon dashboard.'
    );
    return;
  }

  // Link Telegram account to crew member
  const { error: updateError } = await db
    .from('crew_members')
    .update({
      telegram_user_id: telegramUserId,
      telegram_username: telegramUsername,
    })
    .eq('id', regCode.crew_members.id);

  if (updateError) {
    console.error('Registration update error:', updateError);
    await ctx.reply('Registration failed. Please try again or contact your coordinator.');
    return;
  }

  // Mark code as used
  await db
    .from('telegram_registration_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', regCode.id);

  // Log the registration
  await logActivity({
    productionId: regCode.crew_members.production_id,
    actorName: regCode.crew_members.name,
    actorRole: regCode.crew_members.role,
    actorCrewId: regCode.crew_members.id,
    channel: 'telegram',
    action: `registered Telegram account (@${telegramUsername || telegramUserId})`,
  });

  const roleName = getRoleDisplayName(regCode.crew_members.role);
  await ctx.reply(
    `Welcome, ${regCode.crew_members.name}! You're connected as ${roleName}.\n\nJust message me naturally — "What scenes are scheduled this week?" or "Mark Chantel's shoot as done."\n\nI'll tailor what I show you to your role. Everything I do shows up on the team dashboard with your name and timestamp.`
  );
}

// ============================================
// Message Handler (Core Loop)
// ============================================

async function handleMessage(ctx: Context): Promise<void> {
  const telegramUserId = ctx.from?.id?.toString();
  const messageText = ctx.message?.text;

  if (!telegramUserId || !messageText) return;

  // Find crew member
  const crew = await findCrewByTelegramId(telegramUserId);

  if (!crew) {
    await ctx.reply(
      "I don't recognize your Telegram account. Use /start <code> with the registration code from your Lexicon dashboard to connect."
    );
    return;
  }

  // Send "typing" indicator while Lexi processes
  await ctx.replyWithChatAction('typing');

  try {
    // Augment the message with crew identity + role instructions
    const roleInstructions = buildRoleInstructions(crew.name, crew.role);
    const augmentedMessage = `[From: ${crew.name} (${getRoleDisplayName(crew.role)}) via Telegram]\n[Role Context: ${roleInstructions}]\n\n${messageText}`;

    // Use the existing chat service — same intelligence as the web UI
    const response = await sendChatMessage({
      universeId: crew.production.universeId,
      message: augmentedMessage,
      mode: 'production',
      productionId: crew.productionId,
    });

    const replyText = response.message.content || 'Done.';

    // Log activity for every tool that was executed
    const toolCalls = response.toolCallResults || [];
    for (const tool of toolCalls) {
      if (tool.success) {
        await logActivity({
          productionId: crew.productionId,
          actorName: crew.name,
          actorRole: crew.role,
          actorCrewId: crew.id,
          channel: 'telegram',
          action: formatToolAction(tool.toolCallId, tool.result),
          details: {
            toolCallId: tool.toolCallId,
            result: tool.result,
            originalMessage: messageText,
          },
        });
      }
    }

    // If no tools were called, still log the query
    if (toolCalls.length === 0) {
      await logActivity({
        productionId: crew.productionId,
        actorName: crew.name,
        actorRole: crew.role,
        actorCrewId: crew.id,
        channel: 'telegram',
        action: `asked Lexi: "${messageText.slice(0, 80)}${messageText.length > 80 ? '...' : ''}"`,
      });
    }

    // Telegram has a 4096 char limit per message
    if (replyText.length > 4000) {
      const chunks = splitMessage(replyText, 4000);
      for (const chunk of chunks) {
        await ctx.reply(chunk, { parse_mode: 'Markdown' });
      }
    } else {
      await ctx.reply(replyText, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Telegram message handler error:', error);
    await ctx.reply(
      "Something went wrong processing your request. The web dashboard is still available as a fallback. I've logged this error."
    );
  }
}

// ============================================
// Helpers
// ============================================

/**
 * Convert a tool call into a human-readable action string.
 */
function formatToolAction(toolName: string, _result: unknown): string {
  const actions: Record<string, string> = {
    schedule_scene: 'scheduled a scene',
    assign_crew: 'assigned crew to a scene',
    mark_contract: 'updated a contract',
    advance_asset_stage: 'advanced an asset stage',
    update_crew_availability: 'updated crew availability',
  };
  return actions[toolName] || `executed ${toolName}`;
}

/**
 * Split a long message into chunks that fit Telegram's 4096 char limit.
 */
function splitMessage(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Try to split at a newline
    let splitIdx = remaining.lastIndexOf('\n', maxLength);
    if (splitIdx === -1 || splitIdx < maxLength * 0.5) {
      // Fall back to splitting at a space
      splitIdx = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitIdx === -1) {
      splitIdx = maxLength;
    }

    chunks.push(remaining.slice(0, splitIdx));
    remaining = remaining.slice(splitIdx).trimStart();
  }

  return chunks;
}

// ============================================
// Bot Handler Registration
// ============================================

function registerHandlers(bot: Bot): void {
  // /start <code> — registration
  bot.command('start', async (ctx) => {
    const code = ctx.match?.trim();
    if (code) {
      await handleRegistration(ctx, code);
    } else {
      await ctx.reply(
        "I'm Lexi, your production intelligence manager.\n\n" +
        "To get started, use your registration code:\n" +
        "/start <your-code>\n\n" +
        "Your production coordinator can generate a code from the Lexicon dashboard."
      );
    }
  });

  // /status — quick production status
  bot.command('status', async (ctx) => {
    const telegramUserId = ctx.from?.id?.toString();
    if (!telegramUserId) return;

    const crew = await findCrewByTelegramId(telegramUserId);
    if (!crew) {
      await ctx.reply('Not registered. Use /start <code> first.');
      return;
    }

    // Delegate to Lexi — ask for a production overview
    ctx.message = { ...ctx.message!, text: 'Give me a quick production status overview.' };
    await handleMessage(ctx);
  });

  // /help
  bot.command('help', async (ctx) => {
    await ctx.reply(
      "I'm Lexi. Here's what I can do:\n\n" +
      "Ask me anything:\n" +
      '- "What scenes are scheduled this week?"\n' +
      '- "Who\'s available Thursday?"\n' +
      '- "What\'s left for Chantel?"\n\n' +
      "Tell me to do things:\n" +
      '- "Mark Chantel\'s shoot as done"\n' +
      '- "Schedule a scene for Kobe next Tuesday"\n' +
      '- "Set Ryan to OOO on Friday"\n\n' +
      "Commands:\n" +
      "/status - Quick production overview\n" +
      "/help - This message\n\n" +
      "Everything I do shows up on the team dashboard with your name and timestamp."
    );
  });

  // All other text messages — main handler
  bot.on('message:text', handleMessage);
}

// ============================================
// Registration Code Generation
// ============================================

/**
 * Generate a registration code for a crew member.
 * Called from the dashboard when a coordinator clicks "Connect Telegram".
 */
export async function generateRegistrationCode(crewMemberId: string): Promise<string | null> {
  const db = getDb();

  // Generate a 6-character alphanumeric code
  const code = Array.from({ length: 6 }, () =>
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
  ).join('');

  const { error } = await db
    .from('telegram_registration_codes')
    .insert({
      crew_member_id: crewMemberId,
      code,
    });

  if (error) {
    console.error('Failed to generate registration code:', error);
    return null;
  }

  return code;
}
