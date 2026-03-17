# Lexicon - Pipeline Status

## Project Information
- **Project:** Lexicon
- **Description:** Wikipedia + Perplexity for story universes
- **Started:** January 6, 2026
- **Current Stage:** Stage 9 - Launch Prep (IN PROGRESS)

---

## Stage Progress

### Stage 1: Concept Lock ✅
**Checkpoint:** "What's the one-liner?"

> **One-liner:** Lexicon is a graph-powered knowledge platform where you search your narrative world like a wiki and get answers synthesized from your knowledge graph + the live web.

**Status:** CLEARED
**Date:** January 5, 2026

---

### Stage 2: Scope Fence ✅
**Checkpoint:** "What are we NOT building?"

**V1 Core Features (Max 5):**
1. Entity Management (CRUD for characters, locations, events, objects, factions)
2. Relationship Mapping (connect entities, typed relationships with metadata)
3. AI-Powered Search (natural language → graph search → web augmentation → synthesized answer)
4. Basic Graph Visualization (D3.js interactive view)
5. CSV/Excel Import (bulk entity creation)

**NOT YET List:**
- ❌ Timeline engine
- ❌ Team collaboration / multi-user
- ❌ Version history
- ❌ API access
- ❌ ID8Composer integration
- ❌ Mobile app

**Status:** CLEARED
**Date:** January 5, 2026

---

### Stage 3: Architecture Sketch ✅
**Checkpoint:** "Draw me the boxes and arrows."

```
┌─────────────────────────────────────────────────┐
│                 FRONTEND                         │
│           Next.js 15 + TypeScript               │
│           Tailwind + shadcn/ui                  │
│           D3.js (graph visualization)           │
└─────────────────┬───────────────────────────────┘
                  │ HTTPS
┌─────────────────▼───────────────────────────────┐
│                 BACKEND                          │
│              Next.js API Routes                  │
└───────┬─────────────┬─────────────┬─────────────┘
        │             │             │
┌───────▼───────┐ ┌───▼───┐ ┌──────▼──────┐
│    Neo4j      │ │Supabase│ │   Claude   │
│  (Graph DB)   │ │(Users) │ │    API     │
│               │ │        │ │            │
│ • Entities    │ │• Auth  │ │• Synthesis │
│ • Relations   │ │• Billing│ │• Web search│
└───────────────┘ └────────┘ └────────────┘
```

**Stack Decisions:**
| Layer | Choice | Rationale |
|-------|--------|-----------|
| Graph DB | Neo4j Aura | Native graph queries, relationship-first |
| User DB | Supabase (PostgreSQL) | Auth, billing - standard CRUD |
| AI | Claude API | Natural language + web search |
| Visualization | D3.js | Handles 1000+ nodes, highly customizable |

**Status:** CLEARED
**Date:** January 6, 2026

---

### Stage 4: Foundation Pour ✅
**Checkpoint:** "Can we deploy an empty shell?"

**Checklist:**
- [x] Project scaffolding (Next.js 15, TypeScript, Tailwind)
- [x] Package dependencies defined
- [x] File structure created
- [x] Neo4j Aura instance created (id8Labs, ID: 0078a27e)
- [x] Supabase integration (using ID8Labs shared project)
- [x] Supabase client library with universe CRUD operations
- [x] universes table migration applied
- [x] Deployment pipeline (Vercel)
- [x] Environment variables configured (with whitespace trimming fix)
- [x] Empty shell deploying successfully
- [x] Health check endpoint passing (API + Neo4j)

**Production URL:** https://lexicon-phi.vercel.app

**Status:** CLEARED
**Date:** January 6, 2026

**Key Fix:** Neo4j authentication was failing due to trailing newlines in Vercel environment variables. Fixed by adding `.trim()` to environment variable reads in the Neo4j driver initialization.

---

### Stage 5: Feature Blocks ✅
**Checkpoint:** "Does this feature work completely, right now?"

**Planned Vertical Slices:**
1. [x] Entity CRUD (create, read, update, delete entities) ✅
2. [x] Relationship CRUD (connect entities) ✅
3. [x] Basic Search (graph-only, no web augmentation) ✅
4. [x] Graph Visualization (render entities/relationships) ✅
5. [x] AI Search (add Claude synthesis + web) ✅
6. [x] CSV Import (bulk entity creation) ✅

**Feature 1: Entity CRUD (Complete - January 8, 2026):**
- `lib/entities.ts` - Neo4j CRUD operations
- `lib/validation/entity.ts` - Zod validation schemas
- `app/api/entities/route.ts` - POST (create) + GET (list)
- `app/api/entities/[id]/route.ts` - GET, PUT, DELETE
- UI Components: EntityList, EntityCard, EntityDetail, EntityForm, EntityTypeBadge

**Feature 2: Relationship CRUD (Complete - January 8, 2026):**
- `lib/relationships.ts` - Neo4j CRUD operations for relationships
- `lib/validation/relationship.ts` - Zod validation schemas
- `app/api/relationships/route.ts` - POST + GET endpoints
- `app/api/relationships/[id]/route.ts` - GET, PUT, DELETE
- UI Components: RelationshipList, RelationshipCard, RelationshipForm, RelationshipTypeBadge

**Feature 3: Basic Search (Complete - January 8, 2026):**
- `app/api/search/route.ts` - Search API endpoint with timing metrics
- `lib/search.ts` - Added `executeGraphSearch()` function
- UI Components: SearchBar (debounced), SearchResults (entity/relationship cards)
- Keyboard shortcut (Cmd/Ctrl+K), loading states, empty states

**Feature 4: Graph Visualization (Complete - January 8, 2026):**
- `app/api/graph/route.ts` - Graph data endpoint for D3.js
- `components/graph/force-graph.tsx` - D3.js force-directed graph (360 lines)
- `components/graph/graph-controls.tsx` - Zoom, filter, layout controls
- `components/graph/graph-legend.tsx` - Entity type legend with colors
- `components/graph/graph-viewer.tsx` - Complete ready-to-use component
- Features: drag, zoom, pan, entity filtering, responsive sizing

**Feature 5: AI Search (Complete - January 8, 2026):**
- `app/api/search/route.ts` - Added `ai=true` mode for Claude-powered search
- `components/search/ai-answer.tsx` - AI answer display with markdown, citations
- Integration with existing `lib/claude.ts` for `parseQuery()` and `synthesizeAnswer()`
- Graceful fallback to basic search if Claude API fails

**Feature 6: CSV Import (Complete - January 8, 2026):**
- `lib/import/csv-parser.ts` - CSV parsing with delimiter detection
- `lib/validation/import.ts` - Import validation schemas
- `app/api/import/route.ts` - Batch import endpoint with transactions
- `components/import/csv-import-dialog.tsx` - Multi-step import wizard
- `components/import/import-progress.tsx` - Progress tracking component
- 18 unit tests for CSV parsing

**Status:** CLEARED
**Date:** January 8, 2026

**Orchestration:** Claude orchestrated 4 parallel agent sessions to build features concurrently:
- Phase 1: Relationship CRUD + Graph API (parallel)
- Phase 2: Graph Visualization + Basic Search UI (parallel)
- Phase 3: AI Search with Claude
- Phase 4: CSV Import

---

### Stage 6: Integration Pass ✅
**Checkpoint:** "Do all the pieces talk to each other?"

**Integration Points Verified:**
1. **Search → Entity Detail**: SearchBar connected to API, clicking search results selects entity
2. **Graph → Entity Detail**: Graph node clicks fetch and display full entity data
3. **Entity Detail → Relationships**: EntityDetail fetches and displays relationships with navigation
4. **CSV Import → Refresh**: Import success triggers graph and list refresh via key updates
5. **AI Mode Toggle**: Search supports both basic and AI-powered modes with toggle

**Key Integrations Completed:**
- `SearchBar` component integrated into universe page header
- `SearchResults` displays entities and relationships from API
- `GraphViewer` node selection wired to entity detail panel
- `CSVImportDialog` connected with refresh callbacks
- `EntityDetail` now fetches and displays relationships
- Clicking related entities navigates to them

**Type System Improvements:**
- Created `DisplayEntity` interface for flexible date handling (string | Date)
- Updated `GraphEntity` to use `EntityType` and `EntityStatus`
- Aligned types across search results, entity cards, and detail views

**Status:** CLEARED
**Date:** January 8, 2026

---

### Stage 7: Test Coverage ✅
**Checkpoint:** "Are all tests green and is coverage sufficient?"

**Test Suite Summary (129 tests):**

| Test Type | File | Tests |
|-----------|------|-------|
| Unit | `tests/unit/csv-parser.test.ts` | 18 |
| Unit | `tests/unit/entities.test.ts` | 36 |
| Unit | `tests/unit/relationships.test.ts` | 34 |
| Unit | `tests/unit/search.test.ts` | 25 |
| Integration | `tests/integration/api-entities.test.ts` | 16 |
| E2E | `tests/e2e/universe-page.spec.ts` | 17 (Playwright) |

**Unit Tests Cover:**
- Entity CRUD operations (createEntity, getEntity, listEntities, updateEntity, deleteEntity, searchEntities)
- Relationship CRUD operations (all 8 exported functions)
- Search orchestration (search, executeGraphSearch, findEntity, getUniverseEntities)
- CSV parsing (delimiter detection, field mapping, validation)
- Date and metadata parsing helpers

**Integration Tests Cover:**
- POST /api/entities - validation, success, error handling
- GET /api/entities - list, filter, search, pagination
- GET /api/entities/[id] - retrieve, 404 handling
- PUT /api/entities/[id] - update, validation, 404
- DELETE /api/entities/[id] - delete, 404

**E2E Tests Cover:**
- Universe page layout and components
- Search bar functionality
- AI mode toggle
- Import dialog
- Keyboard navigation
- Responsive design

**Status:** CLEARED
**Date:** January 8, 2026

---

### Stage 8: Polish & Harden ✅
**Checkpoint:** "What breaks if I do something stupid?"

**Status:** CLEARED
**Date:** January 8, 2026

**Critical Error Handling Fixes:**

| Issue | Fix | Files Modified |
|-------|-----|----------------|
| ForceGraph no retry capability | Added AbortController cleanup + retry button | `components/graph/force-graph.tsx` |
| UniversePage silent fetch failures | Added error banner with auto-dismiss + showError callback | `app/universe/[id]/page.tsx` |
| Search API no timeout | Added 15-second timeout with Promise.race | `app/api/search/route.ts` |
| Import Dialog no parse error UI | Added parseError state + error display in upload step | `components/import/csv-import-dialog.tsx` |

**UI/UX Hardening:**

| Component | Improvement |
|-----------|-------------|
| EntityList | Loading skeleton, error state with retry button, AbortController cleanup |
| EntityDetail | Relationship fetch error state with inline retry |
| SearchResults | Loading skeleton with entity/relationship placeholders |
| ForceGraph | 30-second timeout protection, retry capability |

**Hardening Patterns Applied:**
- AbortController for fetch cleanup on unmount (prevents memory leaks)
- Auto-dismissing error banners (5 second timeout for UX)
- Promise.race for API timeout protection (15s for AI, 30s for graph)
- User-friendly error messages instead of console.error only
- Retry buttons for all recoverable operations
- Loading skeletons instead of generic spinners

**Verification:**
- TypeScript: Compiles without errors
- Build: Passes successfully
- Tests: 196/196 passing

---

### Stage 9: Launch Prep ⏳
**Checkpoint:** "Could a stranger use this without asking me questions?"

**Status:** IN PROGRESS

**Current beta-hardening pass:**
- Public entry points no longer silently depend on demo user IDs
- Dashboard now shows real public/user universes instead of a hardcoded card
- Health route distinguishes `healthy`, `degraded`, and `unhealthy`
- Production smoke coverage added for call sheet generation

**Still open before wider launch:**
- Neo4j restoration for full graph-first parity
- Real live web search integration in the search path
- Full auth UX and onboarding polish
- Deeper production E2E coverage

---

### Stage 10: Ship ⏳
**Checkpoint:** "Is it live and are people using it?"

**Status:** NOT STARTED

---

### Stage 11: Listen & Iterate ⏳
**Checkpoint:** "What did we learn?"

**Status:** NOT STARTED

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-05 | Use Neo4j for graph storage | Relational DBs make relationship traversal painful |
| 2026-01-05 | Split databases (Neo4j + Supabase) | Different data models need different optimizations |
| 2026-01-05 | D3.js over vis-network | More control, better performance with large graphs |
| 2026-01-06 | Neo4j Aura Free tier | Sufficient for MVP, easy to upgrade later |
| 2026-01-06 | Use ID8Labs shared Supabase | Already has infrastructure, reduces setup time |
| 2026-01-06 | Trim env vars in driver init | Vercel can include newlines when pasting values |

---

## Open Questions

1. **Auth provider:** Using Supabase Auth (decided)
2. **Neo4j hosting:** Neo4j Aura managed (decided)
3. **Domain:** TBD - id8lexicon.app? lexicon.id8labs.app?
4. **Pricing:** TBD - Free only for V1? Or launch with tiers?

---

*Last Updated: March 17, 2026 - Stage 9 IN PROGRESS (beta hardening underway)*
