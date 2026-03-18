/**
 * Telegram Webhook Endpoint
 *
 * POST /api/telegram/webhook
 *
 * Manual handler (not grammy webhookCallback) for full error visibility.
 * Processes updates directly: identifies crew, calls Claude, replies.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { ToolUseBlock, TextBlock, ToolResultBlockParam, MessageParam, ContentBlock } from '@anthropic-ai/sdk/resources/messages';
import { getServiceSupabase } from '@/lib/supabase';
import { lexiconTools, executeToolCall } from '@/lib/tools';
import { LEXI_SYSTEM_PROMPT, buildProductionContext } from '@/lib/lexi';
import { logActivity } from '@/lib/activity-log';
import { buildRoleInstructions, getRoleDisplayName } from '@/lib/permissions';
import { formatToolAction, splitMessage } from '@/lib/telegram';
import type { CrewRole } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

// ---- Telegram helpers ----
async function sendTelegramMessage(chatId: number, text: string) {
  // Split long messages
  const chunks = text.length > 4000 ? splitMessage(text, 4000) : [text];
  for (const chunk of chunks) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: chunk }),
    });
  }
}

async function sendTyping(chatId: number) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
  });
}

// ---- Main handler ----
export async function POST(request: NextRequest) {
  // Validate request is from Telegram via secret token
  const secretToken = request.headers.get('x-telegram-bot-api-secret-token');
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let chatId = 0;

  try {
    const update = await request.json();
    const message = update.message;
    if (!message?.text || !message.from?.id) {
      return NextResponse.json({ ok: true });
    }

    chatId = message.chat.id;
    const telegramUserId = String(message.from.id);
    const messageText = message.text as string;

    // Handle /start command
    if (messageText.startsWith('/start')) {
      const code = messageText.replace('/start', '').trim();
      if (code) {
        await handleRegistration(chatId!, telegramUserId, message.from.username || null, code);
      } else {
        await sendTelegramMessage(chatId!,
          "I'm Lexi, your production intelligence manager.\n\n" +
          "To get started, use your registration code:\n" +
          "/start <your-code>\n\n" +
          "Your production coordinator can generate a code from the Lexicon dashboard."
        );
      }
      return NextResponse.json({ ok: true });
    }

    // Handle /help
    if (messageText === '/help') {
      await sendTelegramMessage(chatId!,
        "I'm Lexi. Here's what I can do:\n\n" +
        "Ask me anything:\n" +
        '- "What scenes are scheduled this week?"\n' +
        '- "Who\'s available Thursday?"\n' +
        '- "What\'s left for Chantel?"\n\n' +
        "Tell me to do things:\n" +
        '- "Mark Chantel\'s shoot as done"\n' +
        '- "Schedule a scene for Kobe next Tuesday"\n' +
        '- "Set Ryan to OOO on Friday"\n\n' +
        "Everything I do shows up on the team dashboard with your name and timestamp."
      );
      return NextResponse.json({ ok: true });
    }

    // Look up crew member
    const db = getServiceSupabase();
    const { data: crew, error: crewErr } = await db
      .from('crew_members')
      .select('*, productions!inner(id, universe_id, name)')
      .eq('telegram_user_id', telegramUserId)
      .eq('is_active', true)
      .single();

    if (crewErr || !crew) {
      await sendTelegramMessage(chatId,
        "I don't recognize your Telegram account. Use /start <code> with the registration code from your Lexicon dashboard to connect."
      );
      return NextResponse.json({ ok: true });
    }

    // Send typing indicator
    await sendTyping(chatId);

    // Build system prompt
    const productionContext = await buildProductionContext(crew.production_id);
    const roleInstructions = buildRoleInstructions(crew.name, crew.role as CrewRole);
    const systemPrompt = LEXI_SYSTEM_PROMPT + '\n\n' + productionContext + '\n\n' + roleInstructions;

    // Call Claude with tool loop (capped at 10 iterations to prevent runaway)
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const messages: MessageParam[] = [{ role: 'user', content: messageText }];
    let fullResponseText = '';
    let continueLoop = true;
    let loopCount = 0;
    const MAX_TOOL_LOOPS = 10;
    const executedTools: { name: string; result: unknown }[] = [];
    const crewRole = crew.role as CrewRole;

    while (continueLoop) {
      if (loopCount++ >= MAX_TOOL_LOOPS) {
        console.warn(`Tool loop cap reached after ${MAX_TOOL_LOOPS} iterations`);
        break;
      }
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        tools: lexiconTools,
        messages,
      });

      const toolUseBlocks = response.content.filter(
        (block): block is ToolUseBlock => block.type === 'tool_use'
      );
      const textBlocks = response.content.filter(
        (block): block is TextBlock => block.type === 'text'
      );
      for (const tb of textBlocks) fullResponseText += tb.text;

      if (toolUseBlocks.length > 0) {
        messages.push({ role: 'assistant', content: response.content as ContentBlock[] });
        const toolResults: ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          // RBAC enforcement at tool execution layer
          const { canUseTool } = await import('@/lib/permissions');
          if (!canUseTool(crewRole, toolUse.name)) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify({ success: false, error: `Your role (${getRoleDisplayName(crewRole)}) does not have permission to use ${toolUse.name}` }),
              is_error: true,
            });
            continue;
          }

          const result = await executeToolCall(
            toolUse.name,
            toolUse.input as Record<string, unknown>,
            crew.productions.universe_id
          );
          executedTools.push({ name: toolUse.name, result: result.result });
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
            is_error: !result.success,
          });
        }

        messages.push({ role: 'user', content: toolResults });
      } else {
        continueLoop = false;
      }
    }

    // Reply
    await sendTelegramMessage(chatId, fullResponseText || 'Done.');

    // Log activity
    for (const tool of executedTools) {
      await logActivity({
        productionId: crew.production_id,
        actorName: crew.name,
        actorRole: crew.role,
        actorCrewId: crew.id,
        channel: 'telegram',
        action: formatToolAction(tool.name),
        details: { toolName: tool.name, result: tool.result, originalMessage: messageText },
      });
    }
    if (executedTools.length === 0) {
      await logActivity({
        productionId: crew.production_id,
        actorName: crew.name,
        actorRole: crew.role,
        actorCrewId: crew.id,
        channel: 'telegram',
        action: `asked Lexi: "${messageText.slice(0, 80)}${messageText.length > 80 ? '...' : ''}"`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    // Try to notify user
    if (chatId) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      await sendTelegramMessage(chatId, `Error: ${errMsg.slice(0, 200)}`).catch(() => {});
    }
    return NextResponse.json({ ok: false, error: String(error) }, { status: 200 });
  }
}

// ---- Registration ----
async function handleRegistration(chatId: number, telegramUserId: string, username: string | null, code: string) {
  const db = getServiceSupabase();

  const { data: existing } = await db
    .from('crew_members')
    .select('name, role')
    .eq('telegram_user_id', telegramUserId)
    .single();

  if (existing) {
    await sendTelegramMessage(chatId,
      `You're already registered as ${existing.name} (${existing.role.toUpperCase()}). Just send me a message and I'll help.`
    );
    return;
  }

  const { data: regCode, error: codeError } = await db
    .from('telegram_registration_codes')
    .select('*, crew_members!inner(id, name, role, production_id)')
    .eq('code', code.trim())
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (codeError || !regCode) {
    await sendTelegramMessage(chatId,
      'Invalid or expired registration code. Ask your production coordinator for a new one.'
    );
    return;
  }

  await db.from('crew_members')
    .update({ telegram_user_id: telegramUserId, telegram_username: username })
    .eq('id', regCode.crew_members.id)
    .is('telegram_user_id', null);

  await db.from('telegram_registration_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', regCode.id);

  const roleName = getRoleDisplayName(regCode.crew_members.role as CrewRole);
  await sendTelegramMessage(chatId,
    `Welcome, ${regCode.crew_members.name}! You're connected as ${roleName}.\n\nJust message me naturally. Everything I do shows up on the team dashboard.`
  );
}

export async function GET() {
  return NextResponse.json({ ok: true, bot: 'lexi' });
}
