---
last-reconciled: 2026-03-26
status: CURRENT
Build stage: Stage 9 (Launch Prep)
Drift status: CURRENT
vision-alignment: 75%
version: v0.9.0-beta
---

# SPEC

## Identity

Lexicon is a production intelligence platform for unscripted TV, deployed at lexicon-phi.vercel.app. Its entity, Lexi, operates as institutional memory and operational agent across web UI and Telegram. The platform manages the full production lifecycle through typed asset state machines and a 62-tool agent surface. Built on Next.js 15 + Supabase + Neo4j + Claude, with 227 tests and 62 API route handlers.

**v0.9.0-beta changes (Mar 20-21):** Production-first shell with sidebar navigation, warm-dark design system (Playfair Display + Outfit + Burnt Coral #CD6B5A), BLUF dashboard, all 13 production pages live (zero placeholders), document templates system with Word-native rendering, landing page with Feedback Loop shader, 62 Lexi tools, Excel import with web enrichment.

## Current Capabilities

### 1. Entity Management (CRUD 4/4)

- **Entity Types:** 5 types: character, location, event, object, faction.
- **Full CRUD:** Create, read, update, delete with Zod validation.
- **Search:** By name, aliases, description (regex).
- **Status Tracking:** Entity counts by type, active/inactive/deceased.
- **UI:** EntityList, EntityCard, EntityDetail, EntityForm, EntityTypeBadge.

### 2. Relationship Mapping (CRUD 4/4)

- **Typed Relationships:** 9 types: knows, loves, opposes, works_for, family_of, located_at, participated_in, possesses, member_of.
- **Strength Scoring:** 1-5 with context metadata, start/end dates.
- **Path Finding:** Shortest path up to 5 hops, N-hop subgraph extraction.
- **Bidirectional Support:** Relationships traversable in both directions.

### 3. AI-Powered Search

- **Intent Parsing:** Claude parses intent, extracts entities, determines web search need.
- **Graph Queries:** Neo4j graph queries + storyline search.
- **Synthesis:** Synthesized answers with source citations.
- **UI:** 300ms debounced, Cmd/Ctrl+K shortcut, 15-second timeout with graceful fallback.
- **Web Augmentation:** Live web search path designed but not active.

### 4. Graph Visualization (688 LOC)

- **D3.js Force-Directed:** Interactive: zoom, pan, drag (fixed after drag).
- **Click-to-Select:** Yellow highlight on selection.
- **Filtering:** By entity type, color-coded (5 colors).
- **Controls:** Zoom in/out, fit-to-view, layout reset.
- **Legend:** Entity types, relationships, interaction hints.
- **Cleanup:** AbortController on unmount, 30-second timeout with retry.

### 5. CSV/Excel Import

- **Auto-Detect:** Delimiters (CSV, TSV, pipe), header row detection.
- **Type Inference:** String, date, number, boolean. Field mapping.
- **Excel Support:** SheetJS (xlsx) for Excel import with auto-detect for cast/crew/schedule sheets.
- **Wizard UI:** Multi-step with progress tracking. Bulk import for entities and storylines.

### 6. Chat Interface

- **Perplexity-Style:** Sidebar conversation list, SSE streaming responses.
- **Citations:** Inline citations, entity preview in chat.
- **Mode Toggle:** 'universe' (original Lexicon) vs 'production' (Lexi).
- **Conversations:** Create, read, list, update title, delete.

### 7. Wiki View

- **Wikipedia-Style:** Entity articles with relationship matrices.
- **Infoboxes:** Table of contents, web data badges.

### 8. Storylines (CRUD 4/4)

- **Full CRUD:** With cast (entity) linking.
- **Search & Pagination:** Plus CSV bulk import.

### 9. Notifications (CRUD 4/4)

- **Full System:** Create, list, mark read, dismiss, mark all read, unread count.
- **Preferences:** User notification preferences.

### 10. Production Management

- **Productions:** CRUD for production seasons linked to universes.
- **Scenes:** 20 scenes seeded. CRUD with cast linking, date/time/location, status tracking (scheduled/shot/cancelled/postponed/self_shot), equipment notes.
- **Crew:** 10 crew members seeded. Roles: staff, ac, producer, fixer, editor, coordinator.
- **Scene Assignments:** Link crew to scenes with role and status.
- **Cast Contracts:** 15 contracts seeded. Status tracking (signed/pending/offer_sent/dnc/email_sent/declined), payment type (daily/flat), completion tracking (shoot/interview/pickup/payment done).
- **Crew Availability:** 50 entries seeded. Daily status: available, ooo, dark, holding, booked.
- **Upload Tasks:** Track footage pickup and upload logistics.

### 11. Asset Lifecycle Engine

- **Typed State Machines:** 5 tables backing typed lifecycle stages with transitions, timestamps, owners.
- **Equipment:** 6-stage lifecycle (At Gear House -> Checked Out -> On Location -> Downloading -> In Transit -> Returned). Chain of custody with owner + location metadata.
- **Footage:** 7-stage lifecycle (Shot -> Downloaded -> In Transit -> Uploaded -> Delivered to Post -> In Edit -> Final). Rich metadata (scene, camera, card, AC notes).
- **Documents:** 5-stage lifecycle (Draft -> Sent -> Acknowledged -> Signed -> Filed). For scripts, releases, NDAs.
- **Custom Types:** Show-defined asset types with custom stage definitions.

### 12. Lexi Entity

- **Production-Aware Prompt:** System prompt with gear/footage/document context (lib/lexi.ts).
- **Live Context Injection:** buildProductionContext() injects live production state into Claude.
- **46 Agent Tools:** Create/update/delete assets, productions, crew, contracts, scenes, documents, registration codes.
- **RBAC:** 8 roles x 33 capabilities, tool-level enforcement.
- **6 Query Functions:** Production-aware answering.
- **Telegram Bot:** @LexiProductionBot with crew registration, tool execution, activity logging.

### 13. Production UI

- **Dashboard** (`/universe/[id]/production`): Stat cards, upcoming scenes, incomplete contracts.
- **Calendar** (`/universe/[id]/production/calendar`): Week/month, scene chips, status color coding.
- **Cast Board** (`/universe/[id]/production/cast`): Contract table, interactive completion checkboxes.
- **Crew Board** (`/universe/[id]/production/crew`): Weekly availability grid, click-to-cycle.
- **Gear Board** (`/universe/[id]/production/gear`): Stage-grouped columns for Equipment + Footage, overdue detection (isTerminal/isInitial flags), custody + location per asset.
- **Post Board** (`/universe/[id]/production/post`): Footage timeline with rich metadata (scene, camera, card, AC notes, shot date), expandable with transition history, cast/stage filtering.
- **Call Sheet** (`/universe/[id]/production/call-sheet`): Auto-generated from schedule + crew.
- **Team** (`/universe/[id]/production/team`): Telegram registration codes.
- **Scene Editor:** Modal form with cast assignment, all scheduling fields.
- **Production Layout:** 8-tab navigation (Dashboard, Calendar, Cast, Crew, Gear, Post, Call Sheet, Team).

### 14. Automated Triggers

- **10 Alert Detectors:** Unsigned contracts, double-booked crew, overdue deliverables, stuck stages, unassigned scenes, gear overdue (48h/96h), footage not downloaded (24h), footage not uploaded (48h), approaching deadlines (3d/1d), idle cast (14d).
- **Cron Route:** `/api/cron/triggers` every 4 hours via Vercel Cron.
- **Telegram Delivery:** Routed by crew role, fallback to coordinator/staff.
- **Deduplication:** Via activity_log (4-hour window).

### 15. Onboarding

- **Lexi-as-Conversation:** State machine engine (18 states, no LLM calls).
- **Excel/CSV Import:** Via SheetJS with auto-detect for cast/crew/schedule sheets.
- **Batch Creation API:** Universe + production + cast + crew + asset types in one POST.

### 16. Infrastructure

- **Auth:** Supabase Email OTP, universe isolation.
- **API Surface:** 62 route handlers, consistent response format: `{ success, data?, error? }`.
- **Agent-Native Tools:** 62 tools with Pattern 6 completion signals.
- **Cron Jobs:** 3 Vercel cron jobs (monitoring 6AM, digest 7AM, triggers every 4h).
- **UI:** Dark mode (ThemeProvider), Geist font, error handling (retry buttons, loading skeletons, auto-dismiss error banners).
- **Shared Utilities:** hoursSince(), formatRelativeHours(), verifyCronSecret().

## Architecture Contract

### Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 15, React 19, TypeScript 5.7, Tailwind CSS 3.4, shadcn/ui | App Router |
| Graph DB | Neo4j Aura (managed, free tier, ID: 0078a27e) | DOWN -- instance hibernated after 66 days |
| Production DB | Supabase (PostgreSQL) -- 7 production tables | LIVE -- migration applied, data seeded with Diaries S7 |
| User DB | Supabase (PostgreSQL) -- auth, universes, storylines, chat, notifications | Implemented |
| AI | Claude API (@anthropic-ai/sdk 0.80.0) -- search synthesis, query parsing, Lexi intelligence | Implemented |
| Graph Viz | D3.js 7.9 -- force-directed graph (688 LOC, 5 files) | Implemented |
| Web Enrichment | Firecrawl + Claude | Partial -- wiki enrichment implemented, live search web augmentation pending |
| Telegram | grammY 1.41 | @LexiProductionBot LIVE |
| Email | Resend | Partial |
| Deployment | Vercel | Deployed (lexicon-phi.vercel.app) |
| Unit/Integration | Vitest 2.1 | 227 tests passing |
| E2E | Playwright 1.49 | 17 tests |

### System Role

Lexicon is the production operations layer for id8Labs entertainment projects. It sits alongside Homer (relationship dashboard) and Parallax (companion platform) as a domain-specific product using the shared entity architecture (Lexi = Ava = Dae pattern). Diaries S8 production team is the first consumer.

### Primary Actors

- `Coordinator` -- manages day-to-day: schedules scenes, tracks contracts, checks gear
- `AC (Assistant Coordinator)` -- field operations: picks up footage, checks out gear, manages on-location logistics
- `Producer` -- oversight: reviews dashboards, assigns crew, approves call sheets
- `Showrunner` -- strategic: monitors overall production health, cast dynamics
- `Post Supervisor` -- receives footage, tracks edit progress, manages deliverables
- `Lexi (Agent)` -- answers queries, executes tools, sends alerts, generates call sheets
- `Cron (System)` -- runs monitoring (6AM), digest (7AM), triggers (every 4h)

### Data Flow

```
Excel/CSV Import ─────┐
                       v
Lexi Onboarding ──> Universe + Production Setup
                       │
                       v
Cast/Crew/Schedule ──> Supabase (7 production tables)
                       │              │
                       v              v
Neo4j (cast graph) <── Lexi ──> Production UI (8 pages)
                       │              │
                       v              v
Automated Triggers ──> Telegram Alerts + Activity Log
                       │
                       v
Call Sheet Generator ──> Printable Output
```

### Core Entities

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| productions | Season-level container | universe_id, name, status, start_date, end_date |
| scenes | Individual shooting events | production_id, title, date, location, status, cast[] |
| crew_members | Production team roster | production_id, name, role, phone, email |
| cast_contracts | Cast contract lifecycle | production_id, cast_member, status, payment_type, completion flags |
| crew_availability | Daily crew scheduling | crew_id, date, status (available/ooo/dark/holding/booked) |
| asset_types | Show-defined lifecycle definitions | production_id, name, stages[], initial_stage, terminal_stages |
| assets | Individual tracked items (gear, footage, docs) | type_id, current_stage, metadata, owner, location |

### Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| Supabase | Production data + auth + realtime | LIVE |
| Neo4j Aura | Cast knowledge graph | DOWN (hibernated) |
| Claude API | Lexi intelligence + search synthesis | LIVE |
| Telegram (grammY) | Crew alerts + tool execution | LIVE |
| Vercel Cron | Monitoring, digest, triggers | LIVE |
| Firecrawl | Wiki enrichment | Partial |
| Resend | Email notifications | Partial |
| SheetJS (xlsx) | Excel import | LIVE |

## API Surface

| Domain | Endpoints | CRUD |
|--------|-----------|------|
| Entities | 7 | 4/4 |
| Relationships | 5 | 4/4 |
| Storylines | 6 | 4/4 |
| Chat/Conversations | 5 | 4/4 |
| Notifications | 6 | 4/4 |
| Search & AI | 5 | Complete |
| Preferences | 2 | 2/2 |
| Productions | 2 | 4/4 |
| Scenes | 2 | 4/4 |
| Crew | 2 | 4/4 |
| Cast Contracts | 2 | 4/4 |
| Crew Availability | 2 | 4/4 |
| Infrastructure | 3 | Complete |

Full audit: see `PARITY_MAP.md`

## Current Boundaries

- Does NOT have a landing page or custom domain -- new users hit raw app UI
- Does NOT have auth on `/api/onboard` (TODO placeholder user ID)
- Does NOT have CI/CD pipeline
- Does NOT have error monitoring or analytics
- Does NOT have Neo4j operational -- graph-first features degraded
- Does NOT have live web search augmentation in search path
- Does NOT support cross-show crew sharing or calendar overlay (see Multi-Show Architecture status below)
- Does NOT have mobile-optimized views for field use
- Does NOT handle payroll, invoicing, or financial transactions

## Multi-Show Architecture Status

**VISION Pillar 5 — PARTIAL (40%)**

Multi-Show Architecture is the largest gap between the current build and the VISION. This section documents what exists, what's missing, and what's required.

### What's Built (the 40%)

- **Multiple productions per universe:** The `productions` table supports multiple records per `universe_id`. A user can create several productions (seasons) within one universe.
- **Production isolation:** Each production has its own crew, scenes, contracts, availability, and asset instances — clean separation by `production_id` FK constraints.
- **Production switcher design:** The IA redesign (workspace/prep/2026-03-20-ia-redesign.md) specifies a sidebar dropdown for switching between productions. Not yet implemented in code.
- **`listProductions()` accepts optional `universeId`:** When omitted, returns all productions — the raw query path for a cross-production list exists.

### What's Missing

#### Crew Sharing Across Shows
- **Current:** `crew_members` has a hard FK to `production_id`. Each crew member belongs to exactly one production. If the same person works two shows, they exist as two separate records with no link.
- **Needed:** A shared crew identity layer. Options:
  1. **Crew pool table** (`crew_pool`): production-agnostic crew profiles. `crew_members` becomes an assignment junction table linking pool entries to productions.
  2. **Cross-reference by Telegram ID:** Crew who register via Telegram already have a `telegram_user_id`. This could serve as a natural cross-production identifier without a new table.
- **Depends on:** A `listProductionsForUser(userId)` query (not yet built) so the system knows which productions to check for shared crew.

#### Cross-Show Calendar Overlay
- **Current:** The calendar view (`/production/calendar`) queries scenes for a single `productionId`. No API supports querying scenes across multiple productions.
- **Needed:**
  1. API endpoint: `GET /api/scenes?productionIds=id1,id2` (multi-production scene query).
  2. Calendar UI: color-coded by production, toggle visibility per show.
  3. Conflict detection: crew member assigned to overlapping scenes across different productions.
- **Depends on:** Crew sharing (above) — conflict detection requires knowing that "Jane" in Production A and "Jane" in Production B are the same person.

#### Supporting Infrastructure (Not Yet Built)
- `listProductionsForUser(userId)`: joins universes to productions for a user's full portfolio.
- Production switcher dropdown in sidebar (designed, not coded).
- Cross-production availability rollup (crew availability aggregated across shows).
- Trigger: double-booked crew across productions (extends existing double-booking detector).

### Implementation Path (Phase 2)

Per VISION Phase 2, Multi-Show Architecture ships after Production Beta validates with Diaries S8. The recommended build order:

1. **Production switcher** — sidebar dropdown, `listProductionsForUser()` query.
2. **Crew pool** — shared identity layer, assignment junction, migration.
3. **Cross-show calendar** — multi-production scene query, overlay UI.
4. **Conflict detection** — cross-production double-booking alerts.

This is Phase 2 work. Phase 1 (Production Beta) focuses on validating the single-show experience with Diaries S8.

## Verification Surface

### Entity & Graph
- [ ] Create character entity, edit, delete, verify in list
- [ ] Link two entities with relationship, verify in graph, path find
- [ ] "Who knows the location of X?" returns synthesized answer with citations

### Graph Visualization
- [ ] Open graph, nodes + edges render, zoom/pan/drag functional

### Import
- [ ] Upload CSV, entities appear in list
- [ ] Upload Excel file via onboarding, cast/crew auto-detected

### Chat & Wiki
- [ ] Send message to Lexi, streaming response with citations
- [ ] Entity wiki article renders with infobox and relationship matrix

### Production Management
- [ ] Dashboard shows stat cards, upcoming scenes, incomplete contracts
- [ ] Calendar renders month view with scene chips and status colors
- [ ] Cast board shows 15 contracts with interactive checkboxes
- [ ] Crew board shows 10 crew with weekly availability grid
- [ ] Gear board shows equipment grouped by stage with overdue detection
- [ ] Post board shows footage timeline with transition history

### Automated Triggers
- [ ] `/api/cron/triggers` detects unsigned contracts and sends Telegram alert
- [ ] Deduplication prevents duplicate alerts within 4-hour window

### Onboarding
- [ ] Lexi onboarding wizard completes 18-state flow without errors
- [ ] Batch creation API creates universe + production + cast + crew in one POST

### Infrastructure
- [ ] `npm run build` succeeds
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run test -- --run` -- 227 tests passing
- [ ] `/api/health` reports `healthy`/`unhealthy` with `mode: production-beta` and optional Neo4j component detail
- [ ] lexicon-phi.vercel.app loads

**Current read:** Private production beta is credible; full graph-first public launch still blocked by Neo4j and live web search.

## Environment Dependencies

```env
NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
ANTHROPIC_API_KEY
PERPLEXITY_API_KEY, NEWSAPI_KEY
RESEND_API_KEY, RESEND_FROM_EMAIL
NEXT_PUBLIC_APP_URL, CRON_SECRET
```

## Drift Log

| Date | Section | What Changed | Why | VISION Impact |
|------|---------|-------------|-----|---------------|
| 2026-03-15 | All | Original Triad understated build (missing 6+ features, 129 tests, 97% parity) | SPEC updated from PIPELINE_STATUS.md + PARITY_MAP.md + codebase audit | None -- VISION already accurate |
| 2026-03-15 | Infrastructure | All services potentially down after 66-day dormancy | Supabase: LIVE. Neo4j: DOWN (hibernated). Vercel: pending | None |
| 2026-03-16 | Identity, Capabilities | Strategic pivot: Lexicon expanding to production management with Lexi entity | 7 production tables, 10 API routes, Lexi system prompt, 5 agent tools built overnight | Soul rewritten. Pillars expanded. |
| 2026-03-16 | Stack | Neo4j Aura instance dead (0078a27e) | Confirmed down. Production features work on Supabase alone. Re-provision later for cast graph. | Pillar 6 remains REALIZED (Supabase carries the load) |
| 2026-03-16 | Infrastructure | Supabase migration conflicts on shared project | Repaired migration history, applied production schema successfully | None |
| 2026-03-16 | Capabilities | Bug: lexi.ts and production-queries.ts referenced `prod_scenes` instead of `scenes` | Fixed -- table name aligned with migration | None |
| 2026-03-16 | Capabilities (13) | Phase 2 Production UI built | 13 components, 4 pages, 1 layout. Dashboard, calendar, cast board, crew board, scene editor. | None |
| 2026-03-16 | Capabilities (13) | Cast board API parsing bug | Fixed -- was treating ApiResponse as raw array, causing productionId=undefined | None |
| 2026-03-16 | All | Pipeline advanced to Stage 9 (Launch Prep) | All feature blocks complete. Remaining: polish, deploy, onboard. | None |
| 2026-03-17 | Infrastructure | Beta-hardening pass removed fake demo IDs from key entry points | Home, dashboard, header, and settings now distinguish public beta visitors from signed-in users | None |
| 2026-03-17 | Infrastructure | Health route was misclassifying beta readiness | Supabase added as core dependency, Neo4j treated as degraded optional service for production beta | None |
| 2026-03-17 | Verification | Production verification lagged behind shipped surface | Added health route tests and call-sheet smoke coverage; suite now passes at 196 tests | None |
| 2026-03-18 | Capabilities (10-15) | Session 2: 5 PRs shipped -- onboarding, gear, footage, triggers, post, documents, tool parity | Lexi: 27 -> 62 tools. Asset types: 3 -> 7. UI pages: 6 -> 8. Cron jobs: 2 -> 3. 4,600+ lines shipped. | Pillars 1, 3 confirmed REALIZED |
| 2026-03-20 | Structure | v2 format upgrade | Triad template standardization across all projects | Parallel upgrade |
| 2026-03-20 | Capabilities (15-19) | Redesign session: 6 PRs, ~7,200 lines | BLUF dashboard, production-first shell, sidebar nav, warm-dark design, landing page, Excel import, web enrichment. Lexi: 46 -> 60 tools. | Design system locked |
| 2026-03-21 | Capabilities | Finish build: 5 pages + templates | Chat, graph, settings, episodes, knowledge pages. Document templates system (docxtemplater). Lexi: 60 -> 62 tools. Episodes API routes. All placeholders eliminated. | v0.9.0-beta feature-complete |
| 2026-03-20 | Multi-Show Architecture | Added detailed status section for Pillar 5 | Heal session: documented what's built (40%), what's missing (crew sharing, calendar overlay), and Phase 2 implementation path | Pillar 5 status clarified, remains PARTIAL |
