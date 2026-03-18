/**
 * Production Triggers Cron Job
 *
 * Runs every 4 hours via Vercel Cron.
 * Checks all active productions for time-based alerts:
 * - Gear checked out >48h
 * - Footage not downloaded >24h
 * - Footage not uploaded >48h
 * - Approaching deadlines (3d, 1d)
 * - Idle cast (no scenes in 14d)
 *
 * Sends alerts via Telegram to the appropriate crew role.
 * Deduplicates against activity_log to prevent spam.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getAllAlerts, type ProductionAlert } from '@/lib/production-alerts';
import { logActivity } from '@/lib/activity-log';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DEDUP_HOURS = 4; // Don't resend the same alert within this window

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

async function sendTelegramAlert(chatId: string, text: string): Promise<boolean> {
  if (!BOT_TOKEN) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function formatAlertMessage(alert: ProductionAlert, productionName: string): string {
  const severityIcon = alert.severity === 'critical' ? '[CRITICAL]'
    : alert.severity === 'warning' ? '[WARNING]'
    : '[INFO]';

  return `${severityIcon} <b>${alert.title}</b>\n${alert.description}\n\n<i>${productionName}</i>`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Cron:Triggers] Starting trigger check');
  const db = getServiceSupabase();
  const stats = { productions: 0, alertsFound: 0, alertsSent: 0, errors: 0 };

  try {
    // Get all active productions
    const { data: productions, error: pErr } = await db
      .from('productions')
      .select('id, name, universe_id')
      .eq('status', 'active');

    if (pErr || !productions) {
      throw new Error(`Failed to fetch productions: ${pErr?.message}`);
    }

    stats.productions = productions.length;

    // Get recently sent alert IDs to deduplicate
    const dedupeWindow = new Date(Date.now() - DEDUP_HOURS * 60 * 60 * 1000).toISOString();
    const { data: recentLogs } = await db
      .from('activity_log')
      .select('details')
      .eq('channel', 'system')
      .eq('action', 'trigger_alert_sent')
      .gte('created_at', dedupeWindow);

    const recentAlertIds = new Set<string>();
    for (const log of recentLogs || []) {
      const details = log.details as Record<string, unknown> | null;
      if (details?.alertId) {
        recentAlertIds.add(details.alertId as string);
      }
    }

    // Process each production
    for (const production of productions) {
      try {
        const alerts = await getAllAlerts(production.id);
        stats.alertsFound += alerts.length;

        // Filter to alerts that have a notifyRole and haven't been sent recently
        const newAlerts = alerts.filter(
          (a) => a.notifyRole && !recentAlertIds.has(a.id)
        );

        if (newAlerts.length === 0) continue;

        // Group alerts by notifyRole to batch lookups
        const alertsByRole = new Map<string, ProductionAlert[]>();
        for (const alert of newAlerts) {
          const role = alert.notifyRole!;
          if (!alertsByRole.has(role)) alertsByRole.set(role, []);
          alertsByRole.get(role)!.push(alert);
        }

        // For each role, find crew with Telegram and send alerts
        for (const [role, roleAlerts] of alertsByRole) {
          // Find crew members with this role who have Telegram linked
          const { data: crewMembers } = await db
            .from('crew_members')
            .select('id, name, telegram_user_id')
            .eq('production_id', production.id)
            .eq('role', role)
            .eq('is_active', true)
            .not('telegram_user_id', 'is', null);

          if (!crewMembers || crewMembers.length === 0) {
            // No crew with Telegram for this role — try coordinators as fallback
            if (role !== 'coordinator' && role !== 'staff') {
              const { data: fallbackCrew } = await db
                .from('crew_members')
                .select('id, name, telegram_user_id')
                .eq('production_id', production.id)
                .in('role', ['coordinator', 'staff'])
                .eq('is_active', true)
                .not('telegram_user_id', 'is', null);

              if (fallbackCrew && fallbackCrew.length > 0) {
                for (const alert of roleAlerts) {
                  for (const crew of fallbackCrew) {
                    const sent = await sendTelegramAlert(
                      crew.telegram_user_id as string,
                      formatAlertMessage(alert, production.name)
                    );
                    if (sent) stats.alertsSent++;
                    else stats.errors++;
                  }

                  // Log that this alert was sent (for dedup)
                  await logActivity({
                    productionId: production.id,
                    actorName: 'Lexi',
                    actorRole: 'staff',
                    channel: 'system',
                    action: 'trigger_alert_sent',
                    details: { alertId: alert.id, alertType: alert.type, notifyRole: role },
                  });
                }
              }
            }
            continue;
          }

          // Send each alert to all matching crew
          for (const alert of roleAlerts) {
            for (const crew of crewMembers) {
              const sent = await sendTelegramAlert(
                crew.telegram_user_id as string,
                formatAlertMessage(alert, production.name)
              );
              if (sent) stats.alertsSent++;
              else stats.errors++;
            }

            // Log for dedup
            await logActivity({
              productionId: production.id,
              actorName: 'Lexi',
              actorRole: 'staff',
              channel: 'system',
              action: 'trigger_alert_sent',
              details: { alertId: alert.id, alertType: alert.type, notifyRole: role },
            });
          }
        }
      } catch (err) {
        console.error(`[Cron:Triggers] Error processing ${production.name}:`, err);
        stats.errors++;
      }
    }

    console.log(`[Cron:Triggers] Done. ${stats.productions} productions, ${stats.alertsFound} alerts found, ${stats.alertsSent} sent, ${stats.errors} errors`);

    return NextResponse.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    console.error('[Cron:Triggers] Fatal error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Trigger cron failed' },
      { status: 500 }
    );
  }
}
