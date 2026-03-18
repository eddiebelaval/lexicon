/**
 * Production Triggers Cron Job
 *
 * Runs every 4 hours via Vercel Cron.
 * Checks all active productions for time-based alerts and
 * sends new alerts via Telegram to the appropriate crew role.
 * Deduplicates against activity_log to prevent spam.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyCronSecret } from '@/lib/cron';
import { getAllAlerts, type ProductionAlert } from '@/lib/production-alerts';
import { logActivity } from '@/lib/activity-log';

const DEDUP_HOURS = 4;

async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.warn('[Cron:Triggers] TELEGRAM_BOT_TOKEN not configured');
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
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
  const severity = alert.severity === 'critical' ? '[CRITICAL]'
    : alert.severity === 'warning' ? '[WARNING]'
    : '[INFO]';

  return `${severity} <b>${alert.title}</b>\n${alert.description}\n\n<i>${productionName}</i>`;
}

interface CronStats {
  productions: number;
  alertsFound: number;
  alertsSent: number;
  errors: number;
}

/**
 * Send alerts to crew members and log for dedup — shared by both
 * the primary role path and the coordinator fallback path.
 */
async function sendAndLogAlerts(
  alerts: ProductionAlert[],
  crewMembers: Array<{ telegram_user_id: unknown }>,
  production: { id: string; name: string },
  role: string,
  stats: CronStats,
): Promise<void> {
  for (const alert of alerts) {
    // Send to all matching crew in parallel
    const results = await Promise.all(
      crewMembers.map((crew) =>
        sendTelegramMessage(
          crew.telegram_user_id as string,
          formatAlertMessage(alert, production.name),
        )
      )
    );

    for (const sent of results) {
      if (sent) stats.alertsSent++;
      else stats.errors++;
    }

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

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Cron:Triggers] Starting trigger check');
  const db = getServiceSupabase();
  const stats: CronStats = { productions: 0, alertsFound: 0, alertsSent: 0, errors: 0 };

  try {
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

        const newAlerts = alerts.filter(
          (a) => a.notifyRole && !recentAlertIds.has(a.id)
        );

        if (newAlerts.length === 0) continue;

        // Group alerts by notifyRole
        const alertsByRole = new Map<string, ProductionAlert[]>();
        for (const alert of newAlerts) {
          const role = alert.notifyRole!;
          if (!alertsByRole.has(role)) alertsByRole.set(role, []);
          alertsByRole.get(role)!.push(alert);
        }

        for (const [role, roleAlerts] of alertsByRole) {
          const { data: crewMembers } = await db
            .from('crew_members')
            .select('id, name, telegram_user_id')
            .eq('production_id', production.id)
            .eq('role', role)
            .eq('is_active', true)
            .not('telegram_user_id', 'is', null);

          if (crewMembers && crewMembers.length > 0) {
            await sendAndLogAlerts(roleAlerts, crewMembers, production, role, stats);
            continue;
          }

          // Fallback to coordinators/staff if target role has no Telegram
          if (role !== 'coordinator' && role !== 'staff') {
            const { data: fallbackCrew } = await db
              .from('crew_members')
              .select('id, name, telegram_user_id')
              .eq('production_id', production.id)
              .in('role', ['coordinator', 'staff'])
              .eq('is_active', true)
              .not('telegram_user_id', 'is', null);

            if (fallbackCrew && fallbackCrew.length > 0) {
              await sendAndLogAlerts(roleAlerts, fallbackCrew, production, role, stats);
            }
          }
        }
      } catch (err) {
        console.error(`[Cron:Triggers] Error processing ${production.name}:`, err);
        stats.errors++;
      }
    }

    console.log(`[Cron:Triggers] Done. ${stats.productions} productions, ${stats.alertsFound} alerts found, ${stats.alertsSent} sent, ${stats.errors} errors`);

    return NextResponse.json({ success: true, ...stats });
  } catch (error) {
    console.error('[Cron:Triggers] Fatal error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Trigger cron failed' },
      { status: 500 }
    );
  }
}
