/**
 * Onboarding Batch Creation API
 *
 * POST /api/onboard
 *
 * Creates everything in one request:
 * 1. Universe
 * 2. Production
 * 3. Cast entities (Neo4j if available, fallback IDs) + contracts
 * 4. Crew members
 * 5. Default asset types + lifecycle stages
 *
 * Handles partial failures gracefully — if Neo4j is down,
 * cast still gets created as contracts with fallback entity IDs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createUniverse } from '@/lib/supabase';
import { createProduction } from '@/lib/productions';
import { createEntity } from '@/lib/entities';
import { createCrewMember } from '@/lib/crew';
import { createCastContract } from '@/lib/cast-contracts';
import { createAssetType, createLifecycleStage } from '@/lib/lifecycle';
import { DEFAULT_ASSET_TYPES } from '@/components/production/intake/intake-types';
import type { OnboardingData } from '@/lib/onboarding/engine';

interface OnboardResult {
  universeId: string;
  productionId: string;
  warnings: string[];
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<OnboardResult | { error: string }>> {
  try {
    const data = (await request.json()) as OnboardingData;
    const warnings: string[] = [];

    if (!data.showName?.trim()) {
      return NextResponse.json({ error: 'Show name is required' }, { status: 400 });
    }

    // 1. Create universe
    const universe = await createUniverse(
      {
        name: data.showName,
        description: `${data.showType || 'Production'} — Season ${data.season || '1'}`,
      },
      'onboarding-user' // TODO: real user ID from auth
    );

    if (!universe) {
      return NextResponse.json({ error: 'Failed to create universe' }, { status: 500 });
    }

    // 2. Create production
    const production = await createProduction({
      universeId: universe.id,
      name: data.showName,
      season: data.season || undefined,
      status: 'active',
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
    });

    // 3. Create cast entities + contracts (parallel per member)
    if (data.cast && data.cast.length > 0) {
      const castResults = await Promise.allSettled(
        data.cast.map(async (member) => {
          let entityId = `cast-${member.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

          // Direct lib call — no HTTP self-fetch
          try {
            const entity = await createEntity({
              universeId: universe.id,
              type: 'character',
              name: member.name,
              description: member.description || `Cast member for ${data.showName}`,
              metadata: member.location ? { location: member.location } : {},
            });
            entityId = entity.id;
          } catch {
            warnings.push(`Could not create graph entity for ${member.name}`);
          }

          try {
            await createCastContract({
              productionId: production.id,
              castEntityId: entityId,
              contractStatus: 'pending',
            });
          } catch {
            warnings.push(`Could not create contract for ${member.name}`);
          }
        })
      );

      castResults.forEach((r, i) => {
        if (r.status === 'rejected') {
          warnings.push(`Error with cast member ${data.cast[i]?.name || i}`);
        }
      });
    }

    // 4. Create crew members (parallel)
    if (data.crew && data.crew.length > 0) {
      const crewResults = await Promise.allSettled(
        data.crew.map((member) =>
          createCrewMember({
            productionId: production.id,
            name: member.name,
            role: member.role,
            contactEmail: member.contactEmail || undefined,
            contactPhone: member.contactPhone || undefined,
          })
        )
      );

      crewResults.forEach((r, i) => {
        if (r.status === 'rejected') {
          warnings.push(`Could not create crew member ${data.crew[i]?.name || i}`);
        }
      });
    }

    // 5. Create default asset types + lifecycle stages (parallel per type)
    const assetTypes = DEFAULT_ASSET_TYPES.filter((t) => t.enabled);
    if (assetTypes.length > 0) {
      const typeResults = await Promise.allSettled(
        assetTypes.map(async (at, i) => {
          const created = await createAssetType({
            productionId: production.id,
            name: at.name,
            slug: at.slug,
            icon: at.icon,
            color: at.color,
            sortOrder: i,
          });

          // Stages must be sequential (order matters)
          for (let j = 0; j < at.stages.length; j++) {
            const stage = at.stages[j];
            await createLifecycleStage({
              assetTypeId: created.id,
              name: stage.name,
              stageOrder: j,
              isInitial: stage.isInitial,
              isTerminal: stage.isTerminal,
              color: stage.color,
            });
          }
        })
      );

      typeResults.forEach((r, i) => {
        if (r.status === 'rejected') {
          warnings.push(`Could not create asset type "${assetTypes[i]?.name || i}"`);
        }
      });
    }

    return NextResponse.json(
      {
        universeId: universe.id,
        productionId: production.id,
        warnings,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Onboarding batch creation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Onboarding failed' },
      { status: 500 }
    );
  }
}
