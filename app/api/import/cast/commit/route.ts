/**
 * Cast Import Commit API Route
 *
 * POST /api/import/cast/commit - Takes parsed cast rows (from the parse step)
 * and commits them to the database as cast_contracts entries.
 *
 * PII fields (phone, email, address, legal name, etc.) are stored as structured
 * JSON in the notes field until a dedicated metadata JSONB column is added to
 * the cast_contracts table.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import type { ParsedCastRow } from '@/lib/import/cast-spreadsheet-parser';

/**
 * Generate a stable entity ID from a cast name.
 * "Kara & Guillermo" -> "cast-kara+guillermo"
 */
function castNameToEntityId(name: string): string {
  return 'cast-' + name
    .toLowerCase()
    .replace(/\s*&\s*/g, '+')
    .replace(/[^a-z0-9+]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Format rich PII data as structured text for the notes field.
 * This preserves all imported data until we add a metadata column.
 */
function formatMetadataAsNotes(row: ParsedCastRow, existingNotes: string | null): string {
  const sections: string[] = [];

  if (existingNotes) {
    sections.push(existingNotes);
    sections.push('---');
  }

  sections.push(`[Imported ${new Date().toISOString().split('T')[0]}]`);

  if (row.legalName) sections.push(`Legal Name: ${row.legalName}`);
  if (row.phone) sections.push(`Phone: ${row.phone}`);
  if (row.email) sections.push(`Email: ${row.email}`);
  if (row.address) sections.push(`Address: ${row.address}`);
  if (row.hometown) sections.push(`Hometown: ${row.hometown}`);
  if (row.birthdays) sections.push(`Birthday: ${row.birthdays}`);
  if (row.weddingDate) sections.push(`Wedding Date: ${row.weddingDate}`);
  if (row.socialMedia) sections.push(`Social Media: ${row.socialMedia}`);
  if (row.pastSeasons.length > 0) sections.push(`Past Seasons: ${row.pastSeasons.join(', ')}`);
  if (row.currentSeason) sections.push(`Current Season: ${row.currentSeason}`);
  if (row.upcoming) sections.push(`Upcoming: ${row.upcoming}`);
  if (row.beingConsidered) sections.push(`Being Considered For: ${row.beingConsidered}`);

  return sections.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productionId, rows } = body as {
      productionId: string;
      rows: ParsedCastRow[];
    };

    if (!productionId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'productionId is required' } },
        { status: 400 }
      );
    }

    if (!rows?.length) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No rows to import' } },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Verify the production exists
    const { data: production, error: prodError } = await supabase
      .from('productions')
      .select('id')
      .eq('id', productionId)
      .maybeSingle();

    if (prodError || !production) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Production not found' } },
        { status: 404 }
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const entityId = castNameToEntityId(row.castName);

        // Check for existing contract (unique constraint: production_id + cast_entity_id)
        const { data: existing } = await supabase
          .from('cast_contracts')
          .select('id')
          .eq('production_id', productionId)
          .eq('cast_entity_id', entityId)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        // Build notes with all the rich data
        const notes = formatMetadataAsNotes(row, row.notes);

        const { error: insertError } = await supabase
          .from('cast_contracts')
          .insert({
            production_id: productionId,
            cast_entity_id: entityId,
            cast_name: row.castName,
            contract_status: 'pending',
            notes,
          });

        if (insertError) {
          errors.push(`${row.castName}: ${insertError.message}`);
          continue;
        }

        imported++;
      } catch (err) {
        errors.push(`${row.castName}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        imported,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
        total: rows.length,
      },
    });
  } catch (error) {
    console.error('Cast import commit error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'COMMIT_ERROR',
          message: 'Failed to commit cast import',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
