# SPEC.md — Lexicon

> What it IS right now. The testable contract.

**Last reconciled:** March 16, 2026
**Product:** Lexicon + Lexi (production intelligence entity)
**Repo:** https://github.com/eddiebelaval/lexicon
**Deploy:** https://lexicon-phi.vercel.app
**PR:** https://github.com/eddiebelaval/lexicon/pull/4
**Pipeline Stage:** Stage 5 (Feature Blocks) IN PROGRESS — production management expansion
**Commits:** 20 (13 original + 7 on feature/lexi-production)
**Tests:** 129 (unit, integration, E2E) — production tests pending
**API Parity:** 41/42 original + 10 new production routes (51 total endpoints)

---

## Identity

**Lexicon v0.2** — Production intelligence platform for unscripted TV. Entity: **Lexi**.

Expanding from a narrative universe knowledge platform into a unified production management tool. Lexi is the production intelligence entity (same pattern as Ava/Parallax, Dae/Homer). Strategic anchor: Season 8 of Diaries (90 Day Fiance franchise).

Core: Next.js 15 + Supabase (production data) + Neo4j (cast knowledge graph, currently down) + Claude (Lexi intelligence). Entity management, relationship mapping, AI-powered search, D3.js graph viz, Perplexity-style chat with Lexi production mode, wiki view, storylines, CSV import, notifications. NEW: production scheduling, crew management, cast contract tracking, scene management.

---

## Tech Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | Next.js 15, React 19, TypeScript 5.7, Tailwind CSS 3.4, shadcn/ui | Implemented |
| Graph DB | Neo4j Aura (managed, free tier, ID: 0078a27e) | DOWN — instance hibernated after 66 days |
| Production DB | Supabase (PostgreSQL) — 7 production tables, seeded with Diaries S7 | LIVE — migration applied, data seeded |
| User DB | Supabase (PostgreSQL) — auth, universes, storylines, chat, notifications | Implemented |
| AI | Claude API (@anthropic-ai/sdk 0.39.0) — search synthesis, query parsing | Implemented |
| Graph Viz | D3.js 7.9 — force-directed graph (688 LOC, 5 files) | Implemented |
| Web Enrichment | Firecrawl + Claude | Implemented |
| Email | Resend | Partial |
| Deployment | Vercel | Deployed (health unknown) |
| Unit/Integration | Vitest 2.1 | 113 tests passing |
| E2E | Playwright 1.49 | 17 tests |

---

## Capabilities (What Works)

### 1. Entity Management (CRUD 4/4)
- 5 entity types: character, location, event, object, faction
- Full CRUD with Zod validation
- Search by name, aliases, description (regex)
- Entity counts by type, status tracking (active/inactive/deceased)
- UI: EntityList, EntityCard, EntityDetail, EntityForm, EntityTypeBadge

### 2. Relationship Mapping (CRUD 4/4)
- 9 typed relationships: knows, loves, opposes, works_for, family_of, located_at, participated_in, possesses, member_of
- Strength scoring (1-5), context metadata, start/end dates
- Shortest path finding (up to 5 hops), N-hop subgraph extraction
- Bidirectional support

### 3. AI-Powered Search
- Claude parses intent, extracts entities, determines web search need
- Neo4j graph queries + optional Firecrawl web augmentation
- Synthesized answers with source citations
- 300ms debounced UI, Cmd/Ctrl+K shortcut
- 15-second timeout, graceful fallback to basic search

### 4. Graph Visualization (688 LOC)
- D3.js force-directed, interactive: zoom, pan, drag (fixed after drag)
- Click-to-select with yellow highlight
- Filter by entity type, color-coded (5 colors)
- Controls: zoom in/out, fit-to-view, layout reset
- Legend with entity types, relationships, interaction hints
- AbortController cleanup, 30-second timeout with retry

### 5. CSV Import
- Auto-detect delimiters (CSV, TSV, pipe), header row detection
- Type inference (string, date, number, boolean), field mapping
- Multi-step wizard UI with progress tracking
- Bulk import for entities AND storylines

### 6. Chat Interface
- Perplexity-style with sidebar conversation list
- SSE streaming responses, inline citations
- Entity preview in chat, discovery panel
- Conversations: create, read, list, delete (**update title missing — 1 parity gap**)

### 7. Wiki View
- Wikipedia-style entity articles with relationship matrices
- Infoboxes, table of contents, web data badges

### 8. Storylines (CRUD 4/4)
- Full CRUD with cast (entity) linking
- Search, pagination, CSV bulk import

### 9. Notifications (CRUD 4/4)
- Create, list, mark read, dismiss, mark all read, unread count
- User notification preferences

### 11. Production Management (NEW — Lexi)
- **Productions:** CRUD for production seasons linked to universes
- **Scenes:** 20 scenes seeded. CRUD with cast linking, date/time/location, status tracking (scheduled/shot/cancelled/postponed/self_shot), equipment notes
- **Crew:** 10 crew members seeded. Roles: staff, ac, producer, fixer, editor, coordinator
- **Scene Assignments:** Link crew to scenes with role and status
- **Cast Contracts:** 15 contracts seeded. Status tracking (signed/pending/offer_sent/dnc/email_sent/declined), payment type (daily/flat), completion tracking (shoot/interview/pickup/payment done)
- **Crew Availability:** 50 entries seeded. Daily status: available, ooo, dark, holding, booked
- **Upload Tasks:** Track footage pickup and upload logistics

### 12. Lexi Entity (NEW)
- Production-aware system prompt (lib/lexi.ts)
- buildProductionContext() injects live production state into Claude
- Chat mode toggle: 'universe' (original Lexicon) vs 'production' (Lexi)
- 6 production query functions for answering questions
- 5 agent tools with Pattern 6 completion signals

### 13. Infrastructure
- Supabase Email OTP auth, universe isolation
- 28 API routes, consistent response format: `{ success, data?, error? }`
- 19 agent-native tools with Pattern 6 completion signals
- Dark mode (ThemeProvider), Geist font
- Seed script: Three Musketeers (~50 entities, ~30 relationships)
- Error handling: retry buttons, loading skeletons, auto-dismiss error banners

---

## API Surface (28 endpoints)

| Domain | Endpoints | CRUD |
|--------|-----------|------|
| Entities | 7 | 4/4 |
| Relationships | 5 | 4/4 |
| Storylines | 6 | 4/4 |
| Chat/Conversations | 5 | 3/4 (update missing) |
| Notifications | 6 | 4/4 |
| Search & AI | 5 | Complete |
| Preferences | 2 | 2/2 |
| **Productions** | **2** | **4/4** |
| **Scenes** | **2** | **4/4** |
| **Crew** | **2** | **4/4** |
| **Cast Contracts** | **2** | **4/4** |
| **Crew Availability** | **2** | **4/4** |
| Infrastructure | 3 | Complete |
| **Total** | **49** | |

Full audit: see `PARITY_MAP.md`

---

## Verification Surface

| Capability | How to Verify | Last Verified |
|-----------|---------------|---------------|
| Entity CRUD | Create character, edit, delete, see in list | Jan 8, 2026 (129 tests) |
| Relationships | Link entities, see in graph, path find | Jan 8, 2026 (34 tests) |
| AI Search | "Who knows the location of X?" | Jan 8, 2026 (25 tests) |
| Graph Viz | Open graph, nodes + edges, interact | Jan 8, 2026 (manual) |
| CSV Import | Upload CSV, entities appear | Jan 8, 2026 (18 tests) |
| Chat | Send message, streaming response, citations | Jan 8, 2026 (manual) |
| Wiki View | Entity article renders | Jan 8, 2026 (manual) |
| Storylines | Create with cast, search | Jan 9, 2026 (manual) |
| Notifications | Trigger, see in UI, dismiss | Jan 9, 2026 (manual) |
| Auth | Sign up, log in, universe isolation | Jan 6, 2026 (manual) |
| Build | `npm run build` passes | Jan 8, 2026 |
| Tests | `npm run test` — 129 passing | Jan 8, 2026 |
| Deploy | lexicon-phi.vercel.app loads | Jan 8, 2026 |

**Post-dormancy: ALL need re-verification.** Services likely hibernated after 66 days.

---

## Known Gaps

### Parity (Priority 1)
- `PUT /api/chat/conversations/[id]` — conversation title update

### Launch Blockers (Priority 2)
- Landing page (none exists)
- Onboarding flow
- Domain selection
- Service health restoration

### Nice to Have (Priority 3)
- Bulk update/delete endpoints
- Universe data export
- CI/CD pipeline
- Error monitoring / analytics

---

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

---

## Drift Log

| Date | Drift | Resolution |
|------|-------|------------|
| 2026-03-15 | Original Triad understated build (missing 6+ features, 129 tests, 97% parity) | SPEC updated from PIPELINE_STATUS.md + PARITY_MAP.md + codebase audit |
| 2026-03-15 | All services potentially down after 66-day dormancy | Supabase: LIVE. Neo4j: DOWN (hibernated). Vercel: pending |
| 2026-03-16 | Strategic pivot: Lexicon expanding to production management with Lexi entity | 7 production tables, 10 API routes, Lexi system prompt, 5 agent tools built overnight |
| 2026-03-16 | Neo4j Aura instance dead (0078a27e) | Confirmed down. Production features work on Supabase alone. Re-provision later for cast graph. |
| 2026-03-16 | Supabase migration conflicts on shared project | Repaired migration history, applied production schema successfully |
