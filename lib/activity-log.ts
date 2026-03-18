/**
 * Activity Log — WHO did WHAT, WHEN, via WHERE
 *
 * Every Lexi action gets an audit entry. The dashboard shows a live feed
 * of changes with attribution: "Marcus (AC) marked Chantel's shoot done via Telegram at 3:42pm"
 */

import { getServiceSupabase } from './supabase';

// ============================================
// Types
// ============================================

export type ActivityChannel = 'telegram' | 'web' | 'system' | 'api';

export interface ActivityEntry {
  id: string;
  productionId: string;
  actorName: string;
  actorRole: string | null;
  actorCrewId: string | null;
  channel: ActivityChannel;
  action: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface LogActivityInput {
  productionId: string;
  actorName: string;
  actorRole?: string;
  actorCrewId?: string;
  channel: ActivityChannel;
  action: string;
  details?: Record<string, unknown>;
}

// ============================================
// Core Operations
// ============================================

/**
 * Log an activity entry. Called after every Lexi action.
 */
export async function logActivity(input: LogActivityInput): Promise<ActivityEntry | null> {
  try {
    const db = getServiceSupabase();
    const { data, error } = await db
      .from('activity_log')
      .insert({
        production_id: input.productionId,
        actor_name: input.actorName,
        actor_role: input.actorRole || null,
        actor_crew_id: input.actorCrewId || null,
        channel: input.channel,
        action: input.action,
        details: input.details || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to log activity:', error);
      return null;
    }

    return mapRow(data);
  } catch (err) {
    console.error('Activity log error:', err);
    return null;
  }
}

/**
 * Get recent activity for a production, optionally filtered by channel.
 */
export async function getRecentActivity(
  productionId: string,
  limit = 20,
  channel?: ActivityChannel
): Promise<ActivityEntry[]> {
  const db = getServiceSupabase();
  let query = db
    .from('activity_log')
    .select('*')
    .eq('production_id', productionId);

  if (channel) {
    query = query.eq('channel', channel);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch activity:', error);
    return [];
  }

  return (data || []).map(mapRow);
}

/**
 * Get activity filtered by channel (e.g., "telegram" only).
 * @deprecated Use getRecentActivity with channel parameter instead.
 */
export async function getActivityByChannel(
  productionId: string,
  channel: ActivityChannel,
  limit = 20
): Promise<ActivityEntry[]> {
  return getRecentActivity(productionId, limit, channel);
}

// ============================================
// Helpers
// ============================================

function mapRow(row: Record<string, unknown>): ActivityEntry {
  return {
    id: row.id as string,
    productionId: row.production_id as string,
    actorName: row.actor_name as string,
    actorRole: row.actor_role as string | null,
    actorCrewId: row.actor_crew_id as string | null,
    channel: row.channel as ActivityChannel,
    action: row.action as string,
    details: (row.details as Record<string, unknown>) || {},
    createdAt: row.created_at as string,
  };
}

/**
 * Format an activity entry for human display.
 * "Marcus (AC) marked Chantel's shoot done via Telegram"
 */
export function formatActivity(entry: ActivityEntry): string {
  const role = entry.actorRole ? ` (${entry.actorRole.toUpperCase()})` : '';
  const channel = entry.channel === 'telegram' ? ' via Telegram' : '';
  return `${entry.actorName}${role} ${entry.action}${channel}`;
}
