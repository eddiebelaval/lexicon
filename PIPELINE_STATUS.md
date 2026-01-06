# Lexicon - Pipeline Status

## Project Information
- **Project:** Lexicon
- **Description:** Wikipedia + Perplexity for story universes
- **Started:** January 6, 2026
- **Current Stage:** Stage 4 - Foundation Pour (COMPLETE)

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

### Stage 5: Feature Blocks ⏳
**Checkpoint:** "Does this feature work completely, right now?"

**Planned Vertical Slices:**
1. [ ] Entity CRUD (create, read, update, delete entities)
2. [ ] Relationship CRUD (connect entities)
3. [ ] Basic Search (graph-only, no web augmentation)
4. [ ] Graph Visualization (render entities/relationships)
5. [ ] AI Search (add Claude synthesis + web)
6. [ ] CSV Import (bulk entity creation)

**Status:** NOT STARTED

---

### Stage 6: Integration Pass ⏳
**Checkpoint:** "Do all the pieces talk to each other?"

**Status:** NOT STARTED

---

### Stage 7: Test Coverage ⏳
**Checkpoint:** "Are all tests green and is coverage sufficient?"

**Status:** NOT STARTED

---

### Stage 8: Polish & Harden ⏳
**Checkpoint:** "What breaks if I do something stupid?"

**Status:** NOT STARTED

---

### Stage 9: Launch Prep ⏳
**Checkpoint:** "Could a stranger use this without asking me questions?"

**Status:** NOT STARTED

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

*Last Updated: January 6, 2026 - Stage 4 CLEARED*
