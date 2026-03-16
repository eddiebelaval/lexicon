# VISION.md — Lexicon

> What it is BECOMING. The evolving north star.

**Last reconciled:** March 16, 2026
**Product:** Lexicon + Lexi (production intelligence entity)
**Owner:** Eddie Belaval / ID8Labs

---

## Soul

**Lexicon is a production intelligence platform for unscripted TV. Lexi is the entity that runs it.**

The tool that replaces your production spreadsheet. Cast tracking, crew scheduling, scene management, contract status, logistics — all in one platform with an AI entity (Lexi) that knows your entire production and answers questions from real data. The institutional memory that production teams never had.

**Core belief:** Every production team deserves better than Excel. Cast relationships, scene schedules, crew assignments, contract status — these are interconnected data, not rows in a spreadsheet. When someone asks "What's left for Chantel?" or "Who's available Thursday?", the answer should come from a system that actually knows, not from scrolling through cells.

**Who it serves:** Production teams, showrunners, producers, coordinators — anyone managing the operational complexity of unscripted TV at scale. Starting with Diaries (90 Day Fiance franchise).

**Entity pattern:** Lexi follows the same architecture as Ava (Parallax) and Dae (Homer). Graph/data layer + AI synthesis + entity personality + multiple surfaces. The Chladni plate vibrates at the same frequency — each domain produces a new shape.

**Where it lives in the ecosystem:** Lexicon is the unified production tool that replaces the separate Lexicon (knowledge), ID8Composer (writing), and Prodigy (scheduling) vision. One product, one entity, one place for everything.

---

## Pillars

### 1. Lexi Entity — Intelligence First
Lexi is the product. She knows your cast, crew, schedule, scenes, contracts, and logistics. Ask her anything about your production and get an answer from real data, not a search bar. "What's left for Chantel?" "Who's available Thursday?" "Which cast haven't done interviews?" She answers, she acts, she alerts.

### 2. Production-Native Data Model
Cast members, scenes, crew, contracts, availability, uploads — first-class entities with typed relationships. The data model mirrors how productions actually work, not how spreadsheets force you to think. Graph for cast relationships. Tables for schedules and status.

### 3. Dashboard-First Interface
The primary view is a production dashboard — what's happening this week, who's shooting, what's done, what needs attention. Calendar, cast board, and crew views are secondary. The interface serves the production workflow, not the other way around.

### 4. Multi-Production Isolation
Each production is its own world. A showrunner can manage multiple shows. Clean boundaries, shared infrastructure. Crew can be shared across productions.

### 5. Import-First Onboarding
Nobody starts from zero. CSV import from existing production calendars. Meet production teams where their data already lives (Excel). Reduce the cold-start problem to minutes, not weeks.

---

## Anti-Vision

Lexicon is NOT:

- **A general-purpose note app.** Not Notion. Not Obsidian. Purpose-built for narrative universes.
- **A writing tool.** That's ID8Composer. Lexicon manages the world. Composer writes the story.
- **A static wiki.** Static wikis decay. Lexicon has AI-powered retrieval that synthesizes, not just stores.
- **A tool that requires technical users.** If a writer can't use it without reading docs, the UX failed.
- **A replacement for the creative process.** It remembers so you can think. It connects so you can discover.

---

## North Star Capabilities

### Already Built
- Cast knowledge graph: entity management (5 types), relationships (9 types), AI search, D3.js graph viz, wiki view, storylines
- Chat with Lexi: SSE streaming, citations, production mode toggle, 6 query functions
- Production schema: 7 Supabase tables, 10 API routes, Zod validation
- Production data: scenes, crew, cast contracts, crew availability, upload tasks
- 24 agent tools (19 original + 5 production) with Pattern 6
- Diaries S7 seeded: 15 cast, 10 crew, 20 scenes, 15 contracts
- CSV import (auto-detect, type inference)
- Notifications system

### Already Built (continued — Phase 2, Mar 16)
- Production dashboard: stat cards, upcoming scenes, incomplete contracts
- Calendar view: week/month with scene chips, status color coding
- Cast board: contract table with interactive completion checkboxes (Shoot/INTV/PU/$)
- Crew availability board: weekly grid with color-coded status cells
- Scene edit dialog: full create/edit with cast assignment
- Universe page integration: Production entry point in view toggle

### Next — Lexi Autonomy (Blueprint Phase 6)
- Agent SDK write operations (schedule scene, assign AC, mark done)
- Production alerts (unassigned crew, overdue pickups, unsigned cast)
- Telegram surface for field crew

### Future
- **Production calendar CSV import** — parse the real multi-section format
- **Timeline visualization** — temporal view of scenes across production
- **Call sheet generation** — auto-generate daily call sheets from schedule
- **Real-time collaboration** — multiple producers in the same production
- **Cross-season continuity** — track cast across seasons
- **API access** — external tools query production data
- **Neo4j re-provisioning** — restore cast knowledge graph for relationship queries

---

## Evolution Log

| Date | What Shifted | Why |
|------|-------------|-----|
| 2025-09 | Conceived as personal knowledge OS (Version B) | Needed a second brain for all personal data |
| 2025-09 | TMNT agent framework designed (5 agents) | Specialized agents for intake, mapping, retrieval |
| 2025-09 | Original tech: Python + SQLite + ChromaDB + CLI | Lightweight personal tool, local-first |
| 2026-01 | Pivoted to Version A: Enterprise narrative platform | Higher-value play — graph-powered knowledge for story worlds |
| 2026-01 | Tech pivot: Next.js + Neo4j + Supabase + D3.js | Web-first, graph-native, multi-tenant |
| 2026-01 | Sprint: Stage 1-8 in 3 days (parallel agent orchestration) | 4 agents, 6 features + bonus features |
| 2026-01-Mar | Dormant — Parallax, Homer, Research Lab took priority | Revenue focus on Parallax as primary product |
| 2026-03-15 | Reactivation + pivot to production management | Eddie's team runs on Excel. Lexicon + Composer + Prodigy consolidated into one |
| 2026-03-15 | Entity: Lexi named | Same pattern as Ava/Dae. Production intelligence entity. |
| 2026-03-16 | Overnight build: Phase 1 complete | 7 tables, 10 API routes, Lexi entity, 6,400 lines. Seeded with Diaries S7 data. |
| 2026-03-16 | Phase 2: Production UI built | Dashboard, calendar, cast board, crew board, scene editor. 13 components, 4 pages. Spreadsheet replacement is functional. |
