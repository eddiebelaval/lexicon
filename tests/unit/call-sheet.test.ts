import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateCallSheet } from '@/lib/call-sheet';

vi.mock('@/lib/supabase', () => ({
  getServiceSupabase: vi.fn(),
}));

vi.mock('@/lib/entities', () => ({
  getEntitiesByIds: vi.fn(),
}));

import { getServiceSupabase } from '@/lib/supabase';
import { getEntitiesByIds } from '@/lib/entities';

const mockGetServiceSupabase = vi.mocked(getServiceSupabase);
const mockGetEntitiesByIds = vi.mocked(getEntitiesByIds);

type TableRow = Record<string, unknown>;

function createSupabaseMock(tables: Record<string, TableRow[]>) {
  return {
    from(tableName: string) {
      const sourceRows = tables[tableName] ?? [];
      const filters: Array<{ field: string; value: unknown }> = [];

      const applyFilters = () =>
        sourceRows.filter((row) =>
          filters.every(({ field, value }) => row[field] === value)
        );

      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn((field: string, value: unknown) => {
          filters.push({ field, value });
          return builder;
        }),
        in: vi.fn((field: string, values: unknown[]) => {
          const data = applyFilters().filter((row) => values.includes(row[field]));
          return Promise.resolve({ data, error: null });
        }),
        single: vi.fn(() => {
          const data = applyFilters()[0];

          return Promise.resolve(
            data
              ? { data, error: null }
              : { data: null, error: { message: `${tableName} not found` } }
          );
        }),
        order: vi.fn((field: string, options?: { ascending?: boolean }) => {
          const direction = options?.ascending === false ? -1 : 1;
          const data = [...applyFilters()].sort((a, b) => {
            const left = String(a[field] ?? '');
            const right = String(b[field] ?? '');
            return left.localeCompare(right) * direction;
          });

          return Promise.resolve({ data, error: null });
        }),
      };

      return builder;
    },
  };
}

describe('generateCallSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds a call sheet with crew and cast names', async () => {
    mockGetServiceSupabase.mockReturnValue(
      createSupabaseMock({
        productions: [
          {
            id: 'prod-1',
            universe_id: 'universe-1',
            name: 'Diaries S8',
            season: '8',
            status: 'active',
            start_date: '2026-03-01',
            end_date: null,
            notes: 'Keep talent parking on the east lot.',
            created_at: '2026-03-01T10:00:00.000Z',
            updated_at: '2026-03-01T10:00:00.000Z',
            created_by: null,
          },
        ],
        scenes: [
          {
            id: 'scene-1',
            production_id: 'prod-1',
            scene_number: 'S8-101',
            title: 'Chantel interview',
            description: 'Opening sit-down interview.',
            cast_entity_ids: ['cast-1'],
            scheduled_date: '2026-03-17',
            scheduled_time: '09:00:00',
            location: 'Miami',
            location_details: 'Stage A',
            status: 'scheduled',
            equipment_notes: 'Two cameras',
            is_self_shot: false,
            created_at: '2026-03-01T10:00:00.000Z',
            updated_at: '2026-03-01T10:00:00.000Z',
          },
        ],
        scene_assignments: [
          {
            id: 'assign-1',
            scene_id: 'scene-1',
            crew_member_id: 'crew-1',
            role: 'producer',
            notes: 'Handle talent release',
            status: 'confirmed',
            created_at: '2026-03-01T10:00:00.000Z',
          },
        ],
        crew_members: [
          {
            id: 'crew-1',
            production_id: 'prod-1',
            name: 'Casey Producer',
            role: 'producer',
            contact_email: 'casey@example.com',
            contact_phone: null,
            is_active: true,
            created_at: '2026-03-01T10:00:00.000Z',
            updated_at: '2026-03-01T10:00:00.000Z',
          },
        ],
      }) as never
    );

    mockGetEntitiesByIds.mockResolvedValue([
      {
        id: 'cast-1',
        name: 'Chantel',
      } as never,
    ]);

    const callSheet = await generateCallSheet('prod-1', '2026-03-17');

    expect(callSheet.productionName).toBe('Diaries S8');
    expect(callSheet.entries).toHaveLength(1);
    expect(callSheet.entries[0].crewAssignments).toEqual([
      {
        crewName: 'Casey Producer',
        role: 'producer',
        notes: 'Handle talent release',
      },
    ]);
    expect(callSheet.entries[0].castNames).toEqual(['Chantel']);
  });

  it('returns an empty call sheet when no scenes are scheduled for the date', async () => {
    mockGetServiceSupabase.mockReturnValue(
      createSupabaseMock({
        productions: [
          {
            id: 'prod-1',
            universe_id: 'universe-1',
            name: 'Diaries S8',
            season: '8',
            status: 'active',
            start_date: '2026-03-01',
            end_date: null,
            notes: null,
            created_at: '2026-03-01T10:00:00.000Z',
            updated_at: '2026-03-01T10:00:00.000Z',
            created_by: null,
          },
        ],
        scenes: [],
        scene_assignments: [],
        crew_members: [],
      }) as never
    );

    mockGetEntitiesByIds.mockResolvedValue([]);

    const callSheet = await generateCallSheet('prod-1', '2026-03-18');

    expect(callSheet.entries).toEqual([]);
    expect(callSheet.generalNotes).toBeNull();
  });
});
