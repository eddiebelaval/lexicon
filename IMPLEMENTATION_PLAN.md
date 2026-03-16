# Implementation Plan — Lexi Production Management

## Overview
Expand Lexicon into a production management platform for unscripted TV. Phase 1 (schema) + Phase 2 (Lexi entity).

## Architecture
- Supabase (PostgreSQL) for all production data
- Neo4j stays for cast knowledge graph (entities, relationships)
- Claude for Lexi intelligence (query parsing, synthesis)
- Existing patterns: Zod validation, ApiResponse format, Pattern 6 tools

## Implementation Steps

### Step 1: Supabase Migration
- Files: supabase/migrations/20260315_production_schema.sql
- Create tables: productions, scenes, crew_members, scene_assignments, cast_contracts, crew_availability, upload_tasks
- Include RLS policies for universe-level isolation
- Verification: SQL syntax valid, follows existing migration patterns

### Step 2: TypeScript Production Types
- Files: types/production.ts, types/index.ts (re-export)
- Interfaces: Production, Scene, CrewMember, SceneAssignment, CastContract, CrewAvailability, UploadTask
- Each with Create/Update input types
- Verification: npx tsc --noEmit

### Step 3: Zod Validation Schemas
- Files: lib/validation/production.ts
- Schemas for all create/update operations
- Follow patterns in lib/validation/entity.ts
- Verification: npx tsc --noEmit

### Step 4: Production API Routes
- Files: app/api/productions/route.ts, app/api/productions/[id]/route.ts, app/api/scenes/route.ts, app/api/scenes/[id]/route.ts, app/api/crew/route.ts, app/api/crew/[id]/route.ts, app/api/cast-contracts/route.ts, app/api/cast-contracts/[id]/route.ts, app/api/crew-availability/route.ts, app/api/crew-availability/[id]/route.ts
- POST+GET on collections, GET+PUT+DELETE on [id]
- Use Supabase client, Zod validation, ApiResponse format
- Verification: npx tsc --noEmit

### Step 5: Seed Data (Diaries S7)
- Files: seed/diaries-s7.ts, package.json (add seed:diaries script)
- ~15 cast, ~10 crew/ACs, ~20 scenes with dates
- Verification: npx tsc --noEmit

### Step 6: Lexi System Prompt + Context Builder
- Files: lib/lexi.ts
- System prompt describing Lexi's role as production intelligence
- buildProductionContext() fetches current production state
- Verification: npx tsc --noEmit

### Step 7: Production Query Functions
- Files: lib/production-queries.ts
- Functions: getUpcomingScenes, getCastCompletionStatus, getCrewAvailabilityForDate, getScenesForCastMember, getIncompleteContracts, getScenesByStatus
- Verification: npx tsc --noEmit

### Step 8: Chat Integration (Lexi Mode)
- Files: app/api/chat/route.ts (modify existing)
- Add 'mode' parameter: 'universe' | 'production'
- In production mode, inject Lexi context
- Preserve all existing SSE streaming
- Verification: npx tsc --noEmit

### Step 9: Production Agent Tools (Pattern 6)
- Files: lib/tools.ts (extend existing)
- Tools: query_scenes, query_cast_status, query_crew_availability, get_production_summary, search_schedule
- shouldContinue signals on each
- Verification: npx tsc --noEmit, npm run build

## Dependencies
- Existing Supabase client (lib/supabase.ts)
- Existing Claude integration (lib/claude.ts)
- Existing chat API (app/api/chat/route.ts)
- Existing tools (lib/tools.ts)

## Risks & Mitigations
- Services may be down: Code against types, don't test against live DB
- Scope creep: Stick to exactly these 9 steps, nothing more
- Pattern drift: Read existing files first, match exactly
