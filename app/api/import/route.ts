/**
 * Import API Route
 *
 * POST /api/import - Batch import entities from CSV data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDriver } from '@/lib/neo4j';
import { generateId } from '@/lib/utils';
import { importRequestSchema, type ImportResult } from '@/lib/validation/import';
import type { ApiResponse, ApiError, EntityType, EntityStatus } from '@/types';

const BATCH_SIZE = 50;

/**
 * POST /api/import
 * Batch import entities into the knowledge graph
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ImportResult> | ApiError>> {
  const driver = getDriver();
  const session = driver.session();

  try {
    const body = await request.json();

    // Validate input
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

    const { universeId, entities } = parseResult.data;

    // Process entities in batches using a transaction
    const errors: { row: number; message: string }[] = [];
    let entitiesCreated = 0;
    let entitiesSkipped = 0;

    // Process in batches
    for (let i = 0; i < entities.length; i += BATCH_SIZE) {
      const batch = entities.slice(i, i + BATCH_SIZE);
      const batchStartIndex = i;

      try {
        // Use a transaction for each batch
        const tx = session.beginTransaction();

        try {
          for (let j = 0; j < batch.length; j++) {
            const entity = batch[j];
            const rowNumber = batchStartIndex + j + 2; // +2 for 1-indexed and header row

            try {
              const id = generateId();
              const now = new Date().toISOString();

              // Check if entity with same name already exists in universe
              const existingResult = await tx.run(
                `
                MATCH (e:Entity {universeId: $universeId})
                WHERE toLower(e.name) = toLower($name)
                RETURN e.id as id
                LIMIT 1
                `,
                { universeId, name: entity.name }
              );

              if (existingResult.records.length > 0) {
                entitiesSkipped++;
                errors.push({
                  row: rowNumber,
                  message: `Entity "${entity.name}" already exists in this universe`,
                });
                continue;
              }

              // Create the entity
              await tx.run(
                `
                CREATE (e:Entity {
                  id: $id,
                  type: $type,
                  name: $name,
                  aliases: $aliases,
                  description: $description,
                  status: $status,
                  imageUrl: $imageUrl,
                  metadata: $metadata,
                  universeId: $universeId,
                  createdAt: datetime($createdAt),
                  updatedAt: datetime($updatedAt)
                })
                RETURN e.id as id
                `,
                {
                  id,
                  type: entity.type as EntityType,
                  name: entity.name,
                  aliases: entity.aliases || [],
                  description: entity.description || '',
                  status: (entity.status || 'active') as EntityStatus,
                  imageUrl: entity.imageUrl || null,
                  metadata: '{}',
                  universeId,
                  createdAt: now,
                  updatedAt: now,
                }
              );

              entitiesCreated++;
            } catch (entityError) {
              const errorMessage =
                entityError instanceof Error
                  ? entityError.message
                  : 'Unknown error';
              errors.push({
                row: rowNumber,
                message: `Failed to create entity "${entity.name}": ${errorMessage}`,
              });
            }
          }

          // Commit the batch transaction
          await tx.commit();
        } catch (txError) {
          // Rollback on transaction error
          await tx.rollback();
          throw txError;
        }
      } catch (batchError) {
        const errorMessage =
          batchError instanceof Error ? batchError.message : 'Unknown error';

        // Add error for all entities in the failed batch
        for (let j = 0; j < batch.length; j++) {
          const rowNumber = batchStartIndex + j + 2;
          errors.push({
            row: rowNumber,
            message: `Batch import failed: ${errorMessage}`,
          });
        }
      }
    }

    const result: ImportResult = {
      success: entitiesCreated > 0 || entities.length === 0,
      entitiesCreated,
      entitiesSkipped,
      errors,
    };

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: entitiesCreated > 0 ? 201 : 200 }
    );
  } catch (error) {
    console.error('Error importing entities:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to import entities',
        },
      },
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}
