# Lexi Production Management — Requirements

## Overview
Expand Lexicon (narrative universe knowledge platform) into a unified production management tool for unscripted TV. Entity name: Lexi.

## Phase 1: Production Schema
- Supabase tables: productions, scenes, crew_members, scene_assignments, cast_contracts, crew_availability, upload_tasks
- TypeScript interfaces for all production types with Create/Update inputs
- API routes with Zod validation, consistent response format
- Seed data from Diaries S7 (~15 cast, ~10 crew, ~20 scenes)

## Phase 2: Lexi Entity
- Production-aware system prompt + context builder
- Integration with existing chat (SSE streaming, citations)
- Production query functions (upcoming scenes, cast status, crew availability)
- Agent tools following Pattern 6 (shouldContinue signals)

## Constraints
- Supabase-only for production data (not Neo4j)
- Neo4j stays for cast knowledge graph
- Do NOT run migrations or test against live services
- npx tsc --noEmit after every file
- npm run build at the end
- Commit incrementally, do NOT push
