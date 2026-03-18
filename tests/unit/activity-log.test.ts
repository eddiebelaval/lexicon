import { describe, it, expect } from 'vitest';
import { formatActivity } from '@/lib/activity-log';
import type { ActivityEntry } from '@/lib/activity-log';

describe('activity-log', () => {
  describe('formatActivity', () => {
    it('formats a telegram activity with role', () => {
      const entry: ActivityEntry = {
        id: '1',
        productionId: 'prod-1',
        actorName: 'Marcus',
        actorRole: 'ac',
        actorCrewId: 'crew-1',
        channel: 'telegram',
        action: "marked Chantel's shoot done",
        details: {},
        createdAt: '2026-03-18T15:42:00Z',
      };
      expect(formatActivity(entry)).toBe(
        "Marcus (AC) marked Chantel's shoot done via Telegram"
      );
    });

    it('formats a web activity without role', () => {
      const entry: ActivityEntry = {
        id: '2',
        productionId: 'prod-1',
        actorName: 'Eddie',
        actorRole: null,
        actorCrewId: null,
        channel: 'web',
        action: 'scheduled a scene',
        details: {},
        createdAt: '2026-03-18T16:00:00Z',
      };
      expect(formatActivity(entry)).toBe('Eddie scheduled a scene');
    });

    it('formats a system activity', () => {
      const entry: ActivityEntry = {
        id: '3',
        productionId: 'prod-1',
        actorName: 'Lexi',
        actorRole: null,
        actorCrewId: null,
        channel: 'system',
        action: 'detected 3 unsigned contracts with upcoming shoots',
        details: {},
        createdAt: '2026-03-18T09:00:00Z',
      };
      expect(formatActivity(entry)).toBe(
        'Lexi detected 3 unsigned contracts with upcoming shoots'
      );
    });
  });
});
