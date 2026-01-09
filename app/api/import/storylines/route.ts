/**
 * Storyline Import API Route
 *
 * POST /api/import/storylines - Import storylines from CSV with cast name resolution
 */

import { NextRequest, NextResponse } from 'next/server';
import { createStorylinesBatch } from '@/lib/storylines';
import { searchEntities } from '@/lib/entities';
import type { ApiResponse, ApiError, CreateStorylineInput } from '@/types';
import type {
  MappedStorylineRow,
  StorylineImportResult,
} from '@/lib/validation/import';
import { z } from 'zod';

/**
 * Request body schema for storyline import
 */
const importRequestSchema = z.object({
  universeId: z.string().uuid('Invalid universe ID'),
  storylines: z.array(
    z.object({
      title: z.string().min(1).max(500),
      synopsis: z.string().max(5000).default(''),
      narrative: z.string().max(500000).default(''),
      primaryCastNames: z.array(z.string()).default([]),
      supportingCastNames: z.array(z.string()).default([]),
      season: z.string().max(50).optional(),
      episodeRange: z.string().max(50).optional(),
      tags: z.array(z.string().max(50)).max(20).default([]),
      status: z.enum(['active', 'archived', 'developing']).default('active'),
    })
  ),
  createMissingCast: z.boolean().optional().default(false),
});

/**
 * POST /api/import/storylines
 * Import storylines with cast name resolution
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<StorylineImportResult> | ApiError>> {
  try {
    const body = await request.json();

    // Validate request
    const parseResult = importRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid import data',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { universeId, storylines } = parseResult.data;

    // Collect all unique cast names for resolution
    const allCastNames = new Set<string>();
    for (const storyline of storylines) {
      storyline.primaryCastNames.forEach((name) => allCastNames.add(name.toLowerCase()));
      storyline.supportingCastNames.forEach((name) => allCastNames.add(name.toLowerCase()));
    }

    // Resolve cast names to entity IDs
    const castNameToId = new Map<string, string>();
    const unmatchedCast: string[] = [];

    // Search for each cast name in the universe's entities
    for (const name of allCastNames) {
      const results = await searchEntities(universeId, name, {
        type: 'character',
        limit: 1,
      });

      if (results.length > 0) {
        // Check for exact match (case-insensitive)
        const exactMatch = results.find(
          (e) =>
            e.name.toLowerCase() === name ||
            e.aliases.some((a) => a.toLowerCase() === name)
        );
        if (exactMatch) {
          castNameToId.set(name, exactMatch.id);
        } else {
          // Accept fuzzy match if it's close enough
          castNameToId.set(name, results[0].id);
        }
      } else {
        unmatchedCast.push(name);
      }
    }

    // Prepare storylines for batch creation
    const storylinesToCreate: CreateStorylineInput[] = storylines.map(
      (storyline: MappedStorylineRow) => {
        // Resolve primary cast names to IDs
        const primaryCast = storyline.primaryCastNames
          .map((name) => castNameToId.get(name.toLowerCase()))
          .filter((id): id is string => id !== undefined);

        // Resolve supporting cast names to IDs
        const supportingCast = storyline.supportingCastNames
          .map((name) => castNameToId.get(name.toLowerCase()))
          .filter((id): id is string => id !== undefined);

        return {
          universeId,
          title: storyline.title,
          synopsis: storyline.synopsis || undefined,
          narrative: storyline.narrative || undefined,
          primaryCast,
          supportingCast,
          season: storyline.season,
          episodeRange: storyline.episodeRange,
          tags: storyline.tags,
          status: storyline.status as 'active' | 'archived' | 'developing',
        };
      }
    );

    // Create storylines in batch
    const batchResult = await createStorylinesBatch(storylinesToCreate);

    // Calculate results
    const result: StorylineImportResult = {
      success: true,
      storylinesCreated: batchResult.created.length,
      storylinesSkipped: storylines.length - batchResult.created.length,
      castResolution: {
        matched: castNameToId.size,
        unmatched: unmatchedCast,
      },
      errors: batchResult.errors.map((e) => ({ row: e.index + 2, message: e.message })),
    };

    // Add warnings for unmatched cast if any
    if (unmatchedCast.length > 0) {
      result.errors.push({
        row: 0,
        message: `${unmatchedCast.length} cast member(s) not found: ${unmatchedCast.slice(0, 5).join(', ')}${unmatchedCast.length > 5 ? '...' : ''}`,
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error importing storylines:', error);

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'One or more storylines with these titles already exist',
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to import storylines',
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
