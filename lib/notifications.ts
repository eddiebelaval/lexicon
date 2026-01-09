/**
 * Notification System
 *
 * In-app notifications for digest alerts, cast news, and system updates.
 * Works alongside email delivery for users who prefer that channel.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Notification, UserPreferences, NotificationType } from '@/types';

// Lazy-initialize Supabase client (untyped for new tables)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: SupabaseClient<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(): SupabaseClient<any> {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    _supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return _supabase;
}

/**
 * Convert database row to Notification type
 */
function parseNotificationFromDb(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as NotificationType,
    title: row.title as string,
    message: row.message as string,
    actionUrl: row.action_url as string | null,
    actionLabel: row.action_label as string | null,
    digestId: row.digest_id as string | null,
    storylineId: row.storyline_id as string | null,
    readAt: row.read_at ? new Date(row.read_at as string) : null,
    dismissedAt: row.dismissed_at ? new Date(row.dismissed_at as string) : null,
    priority: row.priority as number,
    createdAt: new Date(row.created_at as string),
  };
}

/**
 * Convert database row to UserPreferences type
 */
function parsePreferencesFromDb(row: Record<string, unknown>): UserPreferences {
  return {
    userId: row.user_id as string,
    emailDigests: row.email_digests as boolean,
    emailFrequency: row.email_frequency as UserPreferences['emailFrequency'],
    showConfidenceScores: row.show_confidence_scores as boolean,
    autoExpandUpdates: row.auto_expand_updates as boolean,
    monitoringEnabled: row.monitoring_enabled as boolean,
    timezone: row.timezone as string,
    updatedAt: new Date(row.updated_at as string),
  };
}

// ============================================
// Notification CRUD
// ============================================

/**
 * Create a notification for a user
 */
export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  digestId?: string;
  storylineId?: string;
  priority?: number;
}): Promise<Notification | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      action_url: input.actionUrl || null,
      action_label: input.actionLabel || null,
      digest_id: input.digestId || null,
      storyline_id: input.storylineId || null,
      priority: input.priority ?? 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }

  return parseNotificationFromDb(data as Record<string, unknown>);
}

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  options: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Notification[]> {
  const { unreadOnly = false, limit = 50, offset = 0 } = options;
  const supabase = getSupabase();

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .is('dismissed_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.is('read_at', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) =>
    parseNotificationFromDb(row)
  );
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = getSupabase();

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)
    .is('dismissed_at', null);

  if (error) {
    console.error('Error counting unread notifications:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = getSupabase();

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const supabase = getSupabase();

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
}

/**
 * Dismiss a notification
 */
export async function dismissNotification(notificationId: string): Promise<void> {
  const supabase = getSupabase();

  await supabase
    .from('notifications')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', notificationId);
}

/**
 * Dismiss all notifications for a user
 */
export async function dismissAll(userId: string): Promise<void> {
  const supabase = getSupabase();

  await supabase
    .from('notifications')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('dismissed_at', null);
}

// ============================================
// User Preferences
// ============================================

/**
 * Get user preferences, creating defaults if they don't exist
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error fetching user preferences:', error);
  }

  if (data) {
    return parsePreferencesFromDb(data as Record<string, unknown>);
  }

  // Create default preferences
  const defaults: UserPreferences = {
    userId,
    emailDigests: true,
    emailFrequency: 'daily',
    showConfidenceScores: true,
    autoExpandUpdates: false,
    monitoringEnabled: true,
    timezone: 'America/New_York',
    updatedAt: new Date(),
  };

  const { data: newData, error: insertError } = await supabase
    .from('user_preferences')
    .insert({
      user_id: userId,
      email_digests: defaults.emailDigests,
      email_frequency: defaults.emailFrequency,
      show_confidence_scores: defaults.showConfidenceScores,
      auto_expand_updates: defaults.autoExpandUpdates,
      monitoring_enabled: defaults.monitoringEnabled,
      timezone: defaults.timezone,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating user preferences:', insertError);
    return defaults;
  }

  return parsePreferencesFromDb(newData as Record<string, unknown>);
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  updates: Partial<Omit<UserPreferences, 'userId' | 'updatedAt'>>
): Promise<UserPreferences | null> {
  const supabase = getSupabase();

  const dbUpdates: Record<string, unknown> = {};

  if (updates.emailDigests !== undefined) {
    dbUpdates.email_digests = updates.emailDigests;
  }
  if (updates.emailFrequency !== undefined) {
    dbUpdates.email_frequency = updates.emailFrequency;
  }
  if (updates.showConfidenceScores !== undefined) {
    dbUpdates.show_confidence_scores = updates.showConfidenceScores;
  }
  if (updates.autoExpandUpdates !== undefined) {
    dbUpdates.auto_expand_updates = updates.autoExpandUpdates;
  }
  if (updates.monitoringEnabled !== undefined) {
    dbUpdates.monitoring_enabled = updates.monitoringEnabled;
  }
  if (updates.timezone !== undefined) {
    dbUpdates.timezone = updates.timezone;
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .update(dbUpdates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user preferences:', error);
    return null;
  }

  return parsePreferencesFromDb(data as Record<string, unknown>);
}

// ============================================
// Notification Helpers
// ============================================

/**
 * Create a digest ready notification
 */
export async function notifyDigestReady(
  userId: string,
  digestId: string,
  updatesCount: number
): Promise<Notification | null> {
  return createNotification({
    userId,
    type: 'digest_ready',
    title: 'Daily Digest Ready',
    message: `Your daily digest is ready with ${updatesCount} new update${updatesCount === 1 ? '' : 's'}.`,
    actionUrl: `/digest/${digestId}`,
    actionLabel: 'View Digest',
    digestId,
    priority: 1,
  });
}

/**
 * Create a cast news notification
 */
export async function notifyCastNews(
  userId: string,
  castName: string,
  storylineId: string,
  headline: string
): Promise<Notification | null> {
  return createNotification({
    userId,
    type: 'cast_news',
    title: `News: ${castName}`,
    message: headline,
    actionUrl: `/storylines/${storylineId}`,
    actionLabel: 'View Storyline',
    storylineId,
    priority: 2,
  });
}

/**
 * Create a storyline update notification
 */
export async function notifyStorylineUpdate(
  userId: string,
  storylineTitle: string,
  storylineId: string,
  updateSummary: string
): Promise<Notification | null> {
  return createNotification({
    userId,
    type: 'storyline_update',
    title: `Update: ${storylineTitle}`,
    message: updateSummary,
    actionUrl: `/storylines/${storylineId}`,
    actionLabel: 'View Updates',
    storylineId,
    priority: 1,
  });
}

/**
 * Create a system notification
 */
export async function notifySystem(
  userId: string,
  title: string,
  message: string,
  actionUrl?: string
): Promise<Notification | null> {
  return createNotification({
    userId,
    type: 'system',
    title,
    message,
    actionUrl,
    priority: 0,
  });
}
