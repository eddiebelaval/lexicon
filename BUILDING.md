# BUILDING.md — Lexicon

> How we got here. The build journal.

**Last updated:** March 16, 2026
**Product:** Lexicon
**Builder:** Eddie Belaval / ID8Labs

---

## Origin Story

Lexicon was born from a real gap: Eddie needed a place to store everything — ideas, theories, recipes, memories, insights from people alive and dead. A personal lexicon. The original conversation happened in September 2025.

The first impulse was a local tool. Python, SQLite, ChromaDB for vector search, a CLI interface. Personal second brain. Version B. Five agents were designed: Curator (intake), Cartographer (mapping), Optimizer (refinement), Oracle (retrieval), Trainer (learning).

Then the vision shifted. The higher-value play wasn't personal notes — it was narrative universe management at scale. Wikipedia + Perplexity for story worlds. Graph-powered, web-first, multi-tenant. Version A.

The tech stack pivoted entirely: Python to TypeScript, SQLite to Neo4j, CLI to Next.js web app, ChromaDB to Neo4j native graph queries + Claude synthesis.

---

## Build Timeline

### September 2025 — Conception
- Personal lexicon concept born from desire to store "my everything"
- Five-agent architecture designed (Curator, Cartographer, Optimizer, Oracle, Trainer)
- Tech spec: Python + SQLite + ChromaDB + Click CLI
- KRANG Brain Protocol and TMNT agent framework explored as meta-layer

### October–November 2025 — Early Build
- Phase 1 build started in Claude Code, paused on rate limits
- Notion source of truth pages created
- ID8Labs suite architecture formalized (Composer, DeepStack, Lexicon, MILO, Scout)

### January 5-6, 2026 — The Pivot + Foundation

**Decision:** Version A (Enterprise narrative platform) over Version B (personal tool).

**Stages 1-3 cleared in one day:**
- Concept locked: "Wikipedia + Perplexity for narrative worlds"
- Scope fenced: 5 core features, explicit NOT YET list (timeline, collab, versioning, API, mobile)
- Architecture: Neo4j (graph) + Supabase (users) + Claude (AI) — three-database split

**Stage 4 — Foundation Pour (Jan 6):**
- Next.js 15 + TypeScript + Tailwind + shadcn/ui scaffolded
- Neo4j Aura provisioned (id8Labs, ID: 0078a27e)
- Supabase wired (shared ID8Labs project)
- Deployed to Vercel (lexicon-phi.vercel.app)
- Key fix: Neo4j auth failing from trailing newlines in Vercel env vars — `.trim()` fix

### January 6-8, 2026 — The Sprint (Stages 5-8)

**Stage 5 — Feature Blocks:** Claude orchestrated 4 parallel agent sessions:
- Phase 1: Relationship CRUD + Graph API (parallel)
- Phase 2: Graph Visualization + Basic Search UI (parallel)
- Phase 3: AI Search with Claude synthesis
- Phase 4: CSV Import with multi-step wizard

6 vertical slices shipped in 2 days:
1. Entity CRUD — Neo4j operations, Zod validation, 5 UI components
2. Relationship CRUD — 9 typed edges, strength scoring, path finding
3. Basic Search — graph search, debounced UI, Cmd/Ctrl+K
4. Graph Visualization — D3.js force-directed, 360 LOC, interactive
5. AI Search — Claude synthesis + citations + web augmentation
6. CSV Import — delimiter detection, type inference, multi-step wizard

**Stage 6 — Integration Pass (Jan 8):**
- Search results wired to entity detail
- Graph node clicks to entity panel
- Import triggers graph + list refresh
- Type system aligned (DisplayEntity, GraphEntity)

**Stage 7 — Test Coverage (Jan 8):**
129 tests written and passing:
- Unit: CSV (18), entities (36), relationships (34), search (25)
- Integration: API entities (16)
- E2E: universe page (17, Playwright)

**Stage 8 — Polish & Harden (Jan 8):**
- AbortController cleanup on unmount
- Error boundaries with retry buttons
- Loading skeletons, auto-dismissing error banners
- API timeouts (15s AI, 30s graph)

### January 8-9, 2026 — Bonus Features

Beyond the 6 scoped slices, shipped during the sprint:
- **Chat** — Perplexity-style with sidebar, SSE streaming, citations
- **Wiki view** — Wikipedia-style entity articles, relationship matrices, infoboxes
- **Storylines** — CRUD with cast linking and CSV import
- **Notifications** — Full system with read/dismiss/count
- **Dark mode** — ID8Labs-style UI redesign
- **Web enrichment** — Firecrawl + Claude entity enrichment
- **Agent-native tools** — 19 tools with Pattern 6 completion signals (97% parity)
- **Navigation** — Consistent AppHeader across all pages
- **Parity audit** — PARITY_MAP.md created (41/42 actions covered)

### January–March 2026 — Dormant (66 days)
Focus shifted to Parallax launch (Anna signed up Mar 10), Homer, Research Lab, consciousness framework, open-source tools. No commits. Services likely hibernated.

### March 15, 2026 — Reactivation + Strategic Pivot

**Reactivation:**
- Triad documentation created and reconciled with actual codebase
- Full audit: 30,905 LOC, 55+ components, 28 API endpoints, 129 tests

**Strategic pivot:** Eddie's production team runs on Excel for Diaries (90 Day Fiance). The CSV tries to be 6 systems at once. Decision: consolidate into ONE product. Entity pattern (Ava, Dae) applied to production management.

**Entity: Lexi** — production intelligence. Same Chladni plate architecture. Supabase-only for production data. Entity-first build order (Lexi before UI). Must-have: Lexi chat.

### March 15-16, 2026 — Overnight Build (Ralph Auto Mode)

Blueprint: 8 phases, 27 tasks. Executed Phase 1 + Phase 2 overnight.

**Phase 1 — Production Schema:**
- 7 Supabase tables with RLS, indexes, triggers
- TypeScript types (ProdScene prefix to avoid chat collision)
- Zod validation, 5 CRUD lib modules, 10 API routes

**Phase 2 — Lexi Entity:**
- System prompt + buildProductionContext() (lib/lexi.ts)
- 6 production query functions
- Chat mode toggle (universe | production)
- 5 production agent tools (Pattern 6)

**Services:** Supabase LIVE (migration applied, seeded). Neo4j DOWN (hibernated).
**Seed:** 15 cast, 10 crew, 20 scenes, 15 contracts, 50 availability entries.
**PR:** https://github.com/eddiebelaval/lexicon/pull/4

### March 16, 2026 — Phase 2: Production UI (Spreadsheet Replacement)

The Excel spreadsheet for Diaries production had 7 columns for the weekly calendar, plus cast tracking columns (Signed, Daily/Flat, Shoot Done, INTV Done, PU Done, $ Done). Phase 2 replaces all of this with a dedicated production management UI.

**Bug Fix:** `prod_scenes` table references in `lexi.ts` and `production-queries.ts` were wrong — migration creates `scenes`. Fixed before building UI.

**Supabase Seed Script:** `seed/seed-supabase-production.ts` — seeds all production tables (productions, scenes, crew, contracts, availability) from the Diaries S7 data. Complements the Neo4j-only seed for cast entities.

**Production Layout + Navigation:**
- Shared layout with breadcrumb header (Universe / Production / Season)
- Tab navigation: Dashboard | Calendar | Cast | Crew
- "Ask Lexi" shortcut button linking to chat in production mode

**Production Dashboard (`/universe/[id]/production`):**
- Stat cards: total cast, signed contracts, scenes progress, active crew
- Upcoming scenes list with status badges
- Incomplete contracts with missing deliverables highlighted

**Cast Board (`/universe/[id]/production/cast`):**
- Contract table with interactive completion checkboxes
- Status badges: Signed (green), Pending (yellow), Offer Sent (blue), DNC (red)
- Optimistic toggle updates on Shoot/INTV/PU/$ Done checkboxes
- Summary line: "X of Y contracts signed | Z% complete"

**Crew Availability Board (`/universe/[id]/production/crew`):**
- Grid layout: crew members x weekday dates (Mon-Fri)
- Color-coded status cells: available (green), booked (blue), OOO (red), dark (gray), holding (yellow)
- Week navigation with prev/next
- Click to cycle status

**Calendar View (`/universe/[id]/production/calendar`):**
- Week and month view modes with navigation
- Scene chips in day cells, color-coded by status
- Click-to-expand scene detail panel
- Today highlighting

**Scene Edit Dialog:**
- Full form: scene number, title, description, date/time, location, status, equipment notes, self-shot toggle
- Cast assignment via entity search dropdown
- Works for both create and edit flows

**Universe Page Integration:**
- Added "Production" button to the Graph/Wiki view toggle (Clapperboard icon)
- Links to `/universe/[id]/production/`

**Build:** 4 parallel agents built Dashboard, Cast Board, Crew Board, and Calendar simultaneously. Scene Edit Dialog and Universe integration built directly. Zero type errors, build passes.

**Simplify pass:** Three-agent code review (reuse, quality, efficiency) identified 10 HIGH/MEDIUM issues. Fixed: ProductionProvider context (eliminated 4 duplicate API fetches), centralized status configs (`lib/production-config.ts`), parallelized crew fetches, typed CompletionField union, typed ProdSceneStatus parameter. All lint warnings resolved.

**VISION course correction (Mar 16):** Lexicon is not replacing a spreadsheet. It's replacing the entire operational layer of TV production. New pillars: Asset Lifecycle Management, Intake-First Onboarding, Real-Time Collaboration, Multi-Show Architecture. The lifecycle engine is the core differentiator.

### March 16, 2026 — Phase 3: Asset Lifecycle Engine

The foundational architecture that makes Lexicon a production OS instead of a dashboard. Every asset (contract, shoot, deliverable) moves through typed stages with transitions, timestamps, owners, and blockers.

**Schema (5 tables):**
- `asset_types` — per-production categories (Contract, Shoot, Deliverable). Each show defines its own.
- `lifecycle_stages` — ordered stages within an asset type (e.g., Draft > Sent > Negotiating > Signed > Active > Complete)
- `asset_instances` — actual assets with current stage, owner, metadata, blockers, priority, due date. Polymorphic source link connects to existing tables (cast_contracts, scenes, upload_tasks).
- `stage_transitions` — immutable audit log of every stage change (who, when, why, automated?)
- `allowed_transitions` — optional constraint table enforcing valid stage paths

**TypeScript Layer:**
- `types/lifecycle.ts` — 11 interfaces (AssetType, LifecycleStage, AssetInstance, StageTransition, etc.) + composite types (AssetInstanceWithStage, AssetTypeWithStages, LifecycleSummary)
- `lib/validation/lifecycle.ts` — Zod schemas for all create/update/advance operations
- `lib/lifecycle.ts` — 14 CRUD functions including advanceStage (validates transitions, creates audit record, sets completed_at on terminal stages) and getLifecycleSummary (counts per stage with blocked/overdue breakdowns)

**API Routes (7 endpoints):**
- `GET/POST /api/asset-types` — list + create
- `GET/PUT /api/asset-types/[id]` — get with stages + update
- `GET/POST /api/assets` — list (filterable by type/stage/blocked/source) + create
- `GET/PUT/DELETE /api/assets/[id]` — get with stage+type populated + update + delete
- `POST /api/assets/[id]/advance` — advance to next stage (validates, creates transition, handles terminal)
- `GET /api/assets/[id]/history` — transition history with stage names
- `GET /api/lifecycle-summary` — dashboard summary counts

**UI Components (4):**
- `lifecycle-stage-pill.tsx` — colored badge with dot for current stage
- `lifecycle-advance-button.tsx` — click to advance, handles API call
- `lifecycle-history.tsx` — vertical timeline of transitions
- `lifecycle-panel.tsx` — full lifecycle view: stage pipeline dots, current pill, advance button, blocked/complete indicators, history

**Seed Script:** `seed/seed-lifecycle.ts` — creates 3 default asset types (Contract/Shoot/Deliverable) with 17 stages, maps existing Diaries S7 data (15 contracts + 20 scenes) to 35 asset instances with initial transitions.

**Architectural decision: show-defined lifecycles.** Asset types and stages are per-production, not hardcoded. Diaries defines "Contract" with [Draft > Sent > Negotiating > Signed > Active > Complete]. Another show can define "Deal Memo" with completely different stages. The platform adapts to the show, not the other way around.

### March 16, 2026 — Phase 4: Show Intake Flow

The guided onboarding that lets any show set up in Lexicon. A 5-step wizard that collects all production data in local state, then creates everything in one batch on "Launch."

**Intake Wizard Framework:**
- Step indicator with completion state, prev/next navigation
- All data held in local state (`IntakeState`) — no partial records in DB
- Validation gates per step (show name required, at least one asset type enabled)
- Redirects to production dashboard on successful launch

**Step 1 — Show Setup:** Name, season, start/end dates, notes. Clean form with Lexi-flavored copy.

**Step 2 — Cast Roster:** Inline list editor. Add cast members with name, aliases, description, location. Add/remove dynamically. Empty state with CTA.

**Step 3 — Crew Roster:** Same pattern as cast. Name, role (select from CrewRole), email, phone. Role labels formatted nicely (AC, Producer, Fixer, etc.).

**Step 4 — Asset Types:** The power step. Shows 3 default types (Contract, Shoot, Deliverable) as expandable cards with lifecycle stages. Users can: toggle types on/off, rename stages, add/remove stages, reorder, pick stage colors from presets, add entirely custom asset types. Most users just review defaults and continue.

**Step 5 — Review & Launch:** Summary cards (show info, cast count, crew count, asset types with stage counts). "Launch Production" button with phased progress indicator. Creates: production record, cast entities + contracts, crew members, asset types + lifecycle stages. Neo4j failures caught as warnings (production continues without graph).

**Integration:** Dashboard empty state shows "Set Up Your Production" CTA linking to intake wizard when no production exists.

**Missing endpoint:** Created `POST /api/lifecycle-stages` for the launch step (was missing from Phase 3 — stages were only creatable via the seed script).

---

## Key Decisions (and Why)

### Why Neo4j over SQLite?
Narrative universes are graph problems. "Find everyone within 2 degrees of this character" is a one-liner in Cypher, a nightmare in SQL.

### Why the dual-database split?
Neo4j for graph traversal (entities, relationships). PostgreSQL for user CRUD (auth, billing, preferences). Each does what it's best at.

### Why Next.js over Python CLI?
Writers don't use terminals. Multi-user collaboration requires a web app.

### Why the Five Agents were deferred
Designed for the personal version. Enterprise pivot changed priorities. Agent concepts may resurface as features (auto-tagging = Curator, connection discovery = Cartographer, search = Oracle).

### Why D3.js for graph visualization?
Full control over rendering, interaction, styling. Libraries like vis.js or cytoscape.js were alternatives, but D3's flexibility won for a product that needs to feel custom.

### Why parallel agent orchestration?
4 parallel Claude agents built 6 features in ~2 days. Features had clear boundaries, ideal for parallel execution. Same orchestration pattern used across ID8Labs projects.

---

## What Was Abandoned

| Original Plan | What Replaced It | Why |
|--------------|-----------------|-----|
| Python + SQLite + ChromaDB | TypeScript + Neo4j + Supabase | Enterprise needs, graph-native queries |
| CLI interface | Next.js web UI | Writers don't use terminals |
| Local-first | Cloud-first (Vercel + Neo4j Aura + Supabase) | Multi-user, collaboration |
| Five-agent framework | Feature-based architecture | Over-designed for actual needs |
| Personal knowledge OS | Narrative universe platform | Higher value, clearer market |
| ChromaDB vector search | Neo4j graph + Claude synthesis | Graph traversal > vector similarity |

---

## Build Stats

| Metric | Value |
|--------|-------|
| Total LOC | ~49,000 (+3,000 intake wizard) |
| Components | 80+ (55 original + 13 production + 4 lifecycle + 8 intake) |
| Production UI Pages | 4 (dashboard, calendar, cast, crew) |
| API Endpoints | 57 (28 original + 10 production + 8 lifecycle + 11 other) |
| Agent Tools | 24 (19 original + 5 production) |
| Lifecycle Tables | 5 (asset_types, lifecycle_stages, asset_instances, stage_transitions, allowed_transitions) |
| Tests | 129 (production + lifecycle tests pending) |
| Supabase Tables | 12 production + lifecycle + existing |
| Supabase Migrations | 13 |
| Seeded Data | 15 cast, 10 crew, 20 scenes, 15 contracts, 50 availability, 3 asset types, 17 stages, 35 instances |
| Build time (original) | 3 days (Jan 5-8) |
| Dormancy | 66 days (Jan 9 — Mar 15) |
| Build time (Lexi backend) | 1 overnight session (Mar 15-16) |
| Build time (Production UI) | 1 session (Mar 16) |
| Build time (Lifecycle Engine) | 1 session (Mar 16) |
| Build time (Intake Wizard) | 1 session (Mar 16) |
| PR | #4 — feature/lexi-production |
