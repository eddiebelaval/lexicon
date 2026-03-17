'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Mail,
  Clock,
  Eye,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useViewerContext } from '@/lib/hooks/use-viewer-context';
import type { UserPreferences, EmailFrequency } from '@/types';

function buildDefaultPreferences(userId: string): UserPreferences {
  return {
    userId,
    emailDigests: true,
    emailFrequency: 'daily',
    showConfidenceScores: true,
    autoExpandUpdates: false,
    monitoringEnabled: true,
    timezone: 'America/New_York',
    updatedAt: new Date(),
  };
}

export default function NotificationSettingsPage() {
  const { userId, loading: viewerLoading } = useViewerContext();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!viewerLoading) {
      if (userId) {
        void fetchPreferences(userId);
      } else {
        setLoading(false);
      }
    }
  }, [userId, viewerLoading]);

  async function fetchPreferences(currentUserId: string) {
    try {
      const res = await fetch(`/api/preferences?userId=${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences ?? buildDefaultPreferences(currentUserId));
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
      setPreferences(buildDefaultPreferences(currentUserId));
    } finally {
      setLoading(false);
    }
  }

  async function updatePreference(key: keyof UserPreferences, value: unknown) {
    if (!preferences) return;

    // Optimistic update
    setPreferences({ ...preferences, [key]: value });
    setSaving(true);
    setSaveStatus('idle');

    try {
      const res = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          [key]: value,
        }),
      });

      if (res.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Failed to update preference:', error);
      setSaveStatus('error');
      // Revert on error
      if (userId) {
        void fetchPreferences(userId);
      }
    } finally {
      setSaving(false);
    }
  }

  if (viewerLoading || loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#666]" />
          </div>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-[#666] hover:text-white text-sm mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-semibold text-white mb-2">
              Notification Settings
            </h1>
            <p className="text-[#666]">
              Notification preferences unlock after sign-in is connected for private beta users.
            </p>
          </div>

          <section className="rounded-xl border border-[#252525] bg-[#141414] p-6">
            <p className="text-sm text-[#888] leading-relaxed">
              The current beta keeps public browsing separate from personal digests,
              monitoring, and notification settings. Once account wiring is live, this page
              will pick up your real preferences instead of a placeholder user.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-[#666] hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-2">
                Notification Settings
              </h1>
              <p className="text-[#666]">
                Manage how you receive updates about your storylines
              </p>
            </div>
            {saveStatus !== 'idle' && (
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
                  saveStatus === 'success' && 'bg-green-500/10 text-green-500',
                  saveStatus === 'error' && 'bg-red-500/10 text-red-500'
                )}
              >
                {saveStatus === 'success' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Error saving
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Email Notifications */}
          <section className="rounded-xl border border-[#252525] bg-[#141414] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1f1f1f]">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#38bdf8]" />
                <h2 className="text-lg font-medium text-white">Email Notifications</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Enable Digests */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Daily Digests</p>
                  <p className="text-[#666] text-sm mt-1">
                    Receive a summary of all storyline updates
                  </p>
                </div>
                <Toggle
                  checked={preferences?.emailDigests ?? true}
                  onChange={(checked) => updatePreference('emailDigests', checked)}
                  disabled={saving}
                />
              </div>

              {/* Frequency */}
              {preferences?.emailDigests && (
                <div>
                  <p className="text-white font-medium mb-3">Digest Frequency</p>
                  <div className="grid grid-cols-3 gap-3">
                    {(['daily', 'weekly', 'never'] as EmailFrequency[]).map((freq) => (
                      <button
                        key={freq}
                        onClick={() => updatePreference('emailFrequency', freq)}
                        disabled={saving}
                        className={cn(
                          'px-4 py-3 rounded-lg border text-sm font-medium transition-all',
                          preferences.emailFrequency === freq
                            ? 'bg-[#38bdf8]/10 border-[#38bdf8] text-[#38bdf8]'
                            : 'bg-[#1a1a1a] border-[#252525] text-[#999] hover:border-[#333] hover:text-white'
                        )}
                      >
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* In-App Notifications */}
          <section className="rounded-xl border border-[#252525] bg-[#141414] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1f1f1f]">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-[#38bdf8]" />
                <h2 className="text-lg font-medium text-white">In-App Notifications</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Monitoring */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Enable Monitoring</p>
                  <p className="text-[#666] text-sm mt-1">
                    Automatically search for news about your cast
                  </p>
                </div>
                <Toggle
                  checked={preferences?.monitoringEnabled ?? true}
                  onChange={(checked) => updatePreference('monitoringEnabled', checked)}
                  disabled={saving}
                />
              </div>
            </div>
          </section>

          {/* Display Preferences */}
          <section className="rounded-xl border border-[#252525] bg-[#141414] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1f1f1f]">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-[#38bdf8]" />
                <h2 className="text-lg font-medium text-white">Display Preferences</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Confidence Scores */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Show Confidence Scores</p>
                  <p className="text-[#666] text-sm mt-1">
                    Display AI confidence levels on updates
                  </p>
                </div>
                <Toggle
                  checked={preferences?.showConfidenceScores ?? true}
                  onChange={(checked) => updatePreference('showConfidenceScores', checked)}
                  disabled={saving}
                />
              </div>

              {/* Auto Expand */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Auto-Expand Updates</p>
                  <p className="text-[#666] text-sm mt-1">
                    Automatically show full update content
                  </p>
                </div>
                <Toggle
                  checked={preferences?.autoExpandUpdates ?? false}
                  onChange={(checked) => updatePreference('autoExpandUpdates', checked)}
                  disabled={saving}
                />
              </div>
            </div>
          </section>

          {/* Timezone */}
          <section className="rounded-xl border border-[#252525] bg-[#141414] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1f1f1f]">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#38bdf8]" />
                <h2 className="text-lg font-medium text-white">Timezone</h2>
              </div>
            </div>
            <div className="p-6">
              <select
                value={preferences?.timezone || 'America/New_York'}
                onChange={(e) => updatePreference('timezone', e.target.value)}
                disabled={saving}
                className={cn(
                  'w-full px-4 py-3 rounded-lg',
                  'bg-[#1a1a1a] border border-[#252525]',
                  'text-white text-sm',
                  'focus:outline-none focus:border-[#38bdf8]',
                  'disabled:opacity-50'
                )}
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="America/Anchorage">Alaska Time (AKT)</option>
                <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
              <p className="text-[#666] text-sm mt-3">
                Digests will be sent at 7 AM in your selected timezone
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/**
 * Toggle switch component
 */
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors',
        checked ? 'bg-[#38bdf8]' : 'bg-[#333]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
          checked && 'translate-x-5'
        )}
      />
    </button>
  );
}
