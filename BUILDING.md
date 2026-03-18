# BUILDING.md — Lexicon

> How we got here. The build journal.

**Last updated:** March 18, 2026
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

### March 16, 2026 — Phase 5: Real-Time Collaboration

The sync layer that makes Lexicon a team tool instead of a single-user dashboard.

**useRealtimeSubscription hook** (`lib/hooks/use-realtime.ts`):
- Generic hook that subscribes to Supabase Realtime postgres_changes on any table
- Supports filter, onInsert/onUpdate/onDelete callbacks, and a simple onChange refetch pattern
- Auto-subscribes on mount, cleans up on unmount, gated by `enabled` flag

**Inline editing** (`components/production/inline-edit.tsx`):
- InlineEditText: click text to edit, save on blur/Enter, cancel on Escape
- InlineEditSelect: click to show dropdown, save on change
- Both handle async saves with loading states and error revert

**Cast board — realtime + inline editing:**
- Subscribes to `cast_contracts` table changes — board auto-refreshes when another user makes changes
- Contract status: click to change via InlineEditSelect (Signed/Pending/DNC/etc.)
- Payment type: click to change (Daily/Flat)
- Notes: click to edit in place
- Completion checkboxes remain as before (already interactive)

**Crew board — realtime:**
- Subscribes to `crew_availability` changes — grid auto-refreshes on remote updates

**Dashboard — realtime:**
- Subscribes to `scenes`, `cast_contracts`, and `crew_members` — stats auto-refresh when production data changes anywhere

### March 16, 2026 — Phase 6: Lexi Autonomy

Lexi goes from answering questions to doing things.

**5 Write Tools added to lib/tools.ts:**
- `schedule_scene` — create or update scenes on the calendar
- `assign_crew` — assign crew members to scenes with roles
- `mark_contract` — update contract status + completion fields
- `advance_asset_stage` — move assets through lifecycle stages (defaults transitionedByName to "Lexi")
- `update_crew_availability` — set crew availability for specific dates (upsert pattern)

**Production Alerts Engine:**
- `lib/production-alerts.ts` — 5 detectors: unsigned contracts with upcoming shoots, double-booked crew, overdue deliverables, stuck lifecycle stages, unassigned scenes
- `GET /api/production-alerts?productionId=X` — returns all alerts sorted by severity
- `components/production/production-alerts.tsx` — collapsible dashboard banner with severity-colored borders (red=critical, amber=warning, blue=info), collapsed count summary, green "all clear" empty state
- Wired into production dashboard above stat cards

**Call Sheet Generator:**
- `lib/call-sheet.ts` — generates structured call sheet from schedule + crew assignments + cast
- `GET /api/call-sheet?productionId=X&date=YYYY-MM-DD` — returns CallSheet with entries
- `components/production/call-sheet-view.tsx` — printable document with date picker, print button, `print:` media queries for high-contrast output
- New nav tab: "Call Sheet" added to production navigation
- New route: `/universe/[id]/production/call-sheet`

**Lexi System Prompt Rewrite:**
- Split capabilities into Read (query) and Write (action) sections
- Added confirmation-before-action pattern: "I'll schedule a new scene for Thursday..."
- Added proactive alert pattern: "Heads up: Chantel's contract is still unsigned..."
- 9 example interactions covering read, write, and alert scenarios
- Tone updated: "Done. Here's what I did." — no fanfare, just execution

**Stats:** Lexi now has 27 tools (22 original + 5 new write tools). Total API endpoints: 59.

### March 16, 2026 — Phase 6 Polish (PR #6)

Design and deployment fixes caught in review before going live.

**Deployment fix:** Shared Supabase service client was failing on Vercel — server-side imports were leaking into edge routes. Extracted a clean `createServiceClient()` pattern.

**AbortController cleanup:** Added proper cleanup for all fetch calls and Supabase Realtime subscriptions. Components no longer leak network requests on unmount.

**Print CSS:** Call sheet view got `@media print` rules for high-contrast output — crew can print physical call sheets on set.

**Tool validation:** Tightened Zod schemas on write tools. Lexi can no longer accidentally create scenes with missing dates or advance assets to invalid stages.

### March 17, 2026 — Beta Hardening Pass (PR #7)

The session that made Lexicon honest about what it is and isn't in beta.

**Fake demo ID removal:** Home page, dashboard header, and settings were all hardcoded with `demo-universe-id` placeholders. Replaced with proper auth-gated routing — signed-in users see their universes, public beta visitors see an honest onboarding CTA.

**Health route rewrite:** `/api/health` was reporting "unhealthy" because Neo4j was down, even though production features run entirely on Supabase. Restructured: Supabase = core (required for healthy), Neo4j = optional degraded service for the production beta. Health now reports `beta-ready | degraded | unhealthy` with component-level detail.

**Test coverage expansion:** Added health route unit tests (3) and call sheet smoke tests (2). Also added production-specific smoke coverage for key API paths. Suite jumped from 129 to 196 tests.

### March 17, 2026 — Cron Saga

Four rapid commits to fix Vercel cron scheduling:
1. Removed cron schedules to unblock a blocked deploy
2. Attempted restore — but `CRON_SECRET` env var had trailing whitespace
3. Disabled crons until whitespace trimmed in Vercel dashboard
4. Final restore with clean `CRON_SECRET`

**Lesson:** Always `.trim()` secrets from Vercel env vars. This is the same class of bug that hit Neo4j auth in January.

### March 18, 2026 — Lexi Goes Mobile (The Telegram Session)

The session that gave Lexi hands, a phone, and a team. One of the biggest single-session builds in the Lexicon codebase.

**Telegram Bot (@LexiProductionBot):**
- grammy bot framework, then replaced with raw fetch handler (grammy swallowed errors silently)
- Webhook at `/api/telegram/webhook`, secured with `X-Telegram-Bot-Api-Secret-Token`
- Crew members register with one-time codes from the Team setup page
- Every message flows: identify crew -> build Lexi context -> Claude tool loop -> reply -> activity log
- Natural language — no commands required. "Mark Chantel's shoot as done" just works.

**RBAC (Role-Based Access Control):**
- 33 capabilities across 8 roles (staff, producer, coordinator, field_producer, fixer, ac, editor, post_supervisor)
- Enforced at TWO layers: system prompt (tells Claude what's allowed) AND tool execution (hard gate before `executeToolCall`)
- Dashboard scope per role: full / production / own_assignments
- Lexi's behavioral notes adapt per role — AC gets focused assignment info, EP gets everything

**Activity Log:**
- `activity_log` table with full attribution: who, what, when, channel (telegram/web/system/api)
- Real-time feed on dashboard via Supabase Realtime subscription
- Every Lexi action logged, whether from Telegram or web

**Tool Expansion (5 -> 16 tools):**
- Original 5: schedule_scene, assign_crew, mark_contract, advance_asset_stage, update_crew_availability
- Added 8: create_crew_member, update_crew_member, delete_scene, create_cast_contract, delete_cast_contract, generate_call_sheet, get_production_alerts, update_production
- Added 3: email_call_sheet, email_production_report, email_contract_summary
- Full dashboard parity — anything a human can do on the web, Lexi can do via Telegram

**Document Generation & Email:**
- HTML document renderer (`lib/documents.ts`) — call sheets, production reports, contract summaries
- id8Labs factory aesthetic: professional, monochrome, print-ready
- Resend integration for email delivery to crew
- RBAC-gated: EP/producer can send reports, coordinator can send call sheets, AC cannot send

**Team Setup Page:**
- `/universe/[id]/production/team` — manage Telegram connections
- One-click code generation, copy-to-clipboard, step-by-step instructions
- Connected/unconnected status per crew member

**Security Hardening (Polish Pass):**
- Webhook secret token validation (prevents spoofed Telegram requests)
- Registration TOCTOU guard (`.is('telegram_user_id', null)` prevents account hijacking)
- RBAC enforced at tool execution layer (not just system prompt — jailbreak-proof)
- Tool loop capped at 10 iterations (prevents runaway Claude calls)
- HTML `escapeHtml()` on all user data in document renderer (XSS prevention)
- `create_cast_contract` enum values aligned with actual types

**Infrastructure:**
- Anthropic SDK updated 0.39 -> 0.80 (old version caused "Connection error" on Vercel)
- All Vercel env vars refreshed (were 68 days stale from dormancy)
- Vercel function timeout set to 60s for Claude tool loops
- 3 Supabase migrations applied (telegram, activity_log, RLS fix)

**Code Simplification:**
- Deduplicated 3 Supabase singletons (now use shared `getServiceSupabase()`)
- Consolidated crew email helpers
- Record lookup replaces if/else chain for behavioral notes
- Extracted shared helpers between webhook route and telegram lib
- Net -50 lines despite massive feature additions

**Stats:** 12 commits. PR #8 merged. 196 -> 227 tests. 5 -> 16 tools. 6 -> 8 roles. 22 -> 33 capabilities. Lexi is live on Telegram.

### March 18, 2026 (Session 2) — The Full Lifecycle

**The thesis:** A production is a chain of custody problem. Gear moves through locations and people. Footage moves from cameras through drives to post. Documents move from draft to signed. Every transition needs: who, when, where, why.

**Why:** Eddie's Diaries team runs on Excel. The daily friction: "Where is Kit 3?", "Did we download that footage?", "Is Chantel's release signed?" This session replaced all of that.

**PR #9 — Lexi Onboarding Wizard:**
Replaced the 5-step form wizard with Lexi-as-conversation. Full-screen chat UI with a deterministic state machine (18 states, no LLM calls). Excel/CSV import via SheetJS with auto-detect for cast/crew/schedule sheets. Batch creation API creates everything in one POST. Key insight: no API cost for onboarding — the LLM-powered Lexi kicks in *after* setup.

**PR #10 — Gear + Footage Tracking:**
Equipment (6 stages) and Footage (7 stages) asset types built entirely on the existing lifecycle engine. Zero new tables — pure wiring. Three new Lexi tools (create_asset, update_asset, list_assets) with proper metadata merge. Gear Board UI at `/production/gear` with stage-grouped columns, overdue detection via isTerminal/isInitial flags.

**PR #11 — Automated Triggers:**
5 new alert detectors: gear overdue (48h/96h), footage not downloaded (24h), footage not uploaded (48h), approaching deadline (3d/1d), idle cast (14d). Cron at `/api/cron/triggers` every 4 hours. Routes alerts to crew by role via Telegram. Deduplicates against activity_log. Falls back to coordinator/staff.

**PR #12 — Post-Production + Documents + Tool Parity:**
Post-production board with footage timeline (rich metadata, transition history, cast/stage filtering). Document asset type (Draft -> Sent -> Acknowledged -> Signed -> Filed). Four new admin tools (create_production, list_productions, delete_asset, generate_registration_code). Lexi now has 46 tools — everything the dashboard can do, she can do.

**PR #13 — Polish:**
Extracted shared utilities (formatRelativeHours, hoursSince) to lib/utils.ts. Parallelized stages + instances queries in footage timeline API. Capped transitions query. Removed dead code. All review-driven fixes from 9 parallel review agents across the session.

**Architecture decision:** Every new feature followed the same pattern: define asset type + stages in intake-types.ts, wire Lexi tools in tools.ts, build UI component mirroring the gear board pattern. The lifecycle engine was designed for exactly this — zero new database tables across all 5 PRs.

**Stats:** 5 PRs merged. ~4,600 lines shipped. 27 -> 46 Lexi tools. 3 -> 7 default asset types. 6 -> 8 production UI pages. 2 -> 3 cron jobs. 5 -> 10 alert detectors.

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
| Total LOC | ~58,000+ |
| Components | 90+ (55 original + 13 production + 4 lifecycle + 8 intake + 2 realtime + 1 activity feed + 1 team + 3 onboarding + 2 gear/post + 1 nav update) |
| Production UI Pages | 8 (dashboard, calendar, cast, crew, gear, post, call sheet, team) + intake + onboard |
| API Endpoints | 70+ (28 original + 10 production + 8 lifecycle + 13 other + 4 telegram/activity + 1 onboard + 1 footage-timeline + 1 triggers cron + 4 asset mgmt) |
| Agent Tools | 46 Claude-facing tools (was 27 at session start, 5 at project start) |
| Default Asset Types | 7 (Contract, Shoot, Deliverable, Equipment, Footage, Document + custom) |
| Alert Detectors | 10 (5 original + gear overdue, footage not downloaded, footage not uploaded, approaching deadline, idle cast) |
| Cron Jobs | 3 (monitoring 6AM, digest 7AM, triggers 4h) |
| Lifecycle Tables | 5 (asset_types, lifecycle_stages, asset_instances, stage_transitions, allowed_transitions) |
| Tests | 227 (unit, integration, E2E, health, production, permissions, activity) |
| Supabase Tables | 14 |
| Supabase Migrations | 14 |
| Build time (original) | 3 days (Jan 5-8) |
| Dormancy | 66 days (Jan 9 — Mar 15) |
| Build time (Lexi backend) | 1 overnight session (Mar 15-16) |
| Build time (Production UI + Lifecycle + Intake + Realtime + Polish) | 1 session (Mar 16) |
| Build time (Beta Hardening) | 1 session (Mar 17) |
| Build time (Telegram + RBAC + Docs) | 1 session (Mar 18 AM) |
| Build time (Onboarding + Gear + Triggers + Post + Documents + Tool Parity) | 1 session (Mar 18 PM) |
| PRs merged | #4-#13 (10 PRs total) |
