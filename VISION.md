# VISION.md — Lexicon

> What it is BECOMING. The evolving north star.

**Last reconciled:** March 15, 2026
**Product:** Lexicon
**Owner:** Eddie Belaval / ID8Labs

---

## Soul

**Lexicon is a graph-powered knowledge platform for narrative universes.**

Wikipedia + Perplexity for story worlds. Search your universe like a wiki. Get answers synthesized from your knowledge graph + the live web. The institutional memory that creative teams never had.

**Core belief:** Every story universe deserves searchable, interconnected, living documentation — not dead wikis and scattered Google Docs. The bigger the world, the more you need a brain that remembers everything and surfaces what matters.

**Who it serves:** Writers, showrunners, franchise teams, game designers, worldbuilders — anyone managing narrative complexity at scale.

**Where it lives in the ecosystem:** Lexicon is the connective tissue of the ID8Labs suite. ID8Composer creates stories. DeepStack researches. Lexicon remembers everything and makes the other tools smarter by feeding them contextual knowledge.

---

## Pillars

### 1. Entity-First Architecture
Everything is a node. Characters, locations, events, objects, factions — first-class entities with typed relationships. The graph IS the product. Not folders. Not tags. Connections.

### 2. Conversational Intelligence
Search isn't keyword matching — it's Claude synthesizing answers across your entire knowledge graph + live web context. Ask your universe a question, get a cited answer. "Who has motive to betray the king?" should work.

### 3. Visual Graph Navigation
D3.js-powered interactive visualization. See your universe. Zoom into clusters. Discover connections you didn't know existed. The graph view isn't a feature — it's the primary interface for understanding narrative complexity.

### 4. Universe Isolation + Multi-Tenancy
Each universe is its own world. A showrunner can manage multiple franchises. A writer's room can share one universe while keeping others private. Clean boundaries, shared infrastructure.

### 5. Import-First Onboarding
Nobody starts from zero. CSV import, future Notion import, future Google Docs ingestion. Meet creators where their data already lives. Reduce the cold-start problem to minutes, not weeks.

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

### Already Built (Stage 8 complete)
- Entity management (5 types, full CRUD, search, counts)
- Relationship mapping (9 types, strength, path finding, subgraph)
- AI-powered search (Claude synthesis + citations + web augmentation)
- D3.js graph visualization (interactive, filterable, 688 LOC)
- CSV import (auto-detect, type inference, multi-step wizard)
- Chat interface (SSE streaming, citations, conversations)
- Wiki view (entity articles, relationship matrices, infoboxes)
- Storylines with cast linking
- Notifications system
- Agent-native tools (19 tools, Pattern 6)

### Stage 9 — Launch Prep (next)
- Service health restoration (Neo4j, Supabase, Vercel)
- Landing page + onboarding flow
- Domain + production deploy
- Conversation title editing (1 parity gap)

### Stage 10 — Ship
- Domain live, users onboarding
- Seed universe as demo

### Future (Post-Launch)
- **Timeline visualization** — temporal view of events, not just spatial graph
- **Contradiction detection** — AI flags when new entries conflict with existing canon
- **Canon locking** — canonical vs. speculative/draft entries
- **Real-time collaboration** — multiple writers in the same universe
- **ID8Composer integration** — universe context in the writing environment
- **API access** — external tools query the knowledge graph
- **Version history** — track entity evolution across story development
- **Bulk narrative import** — ingest scripts/treatments, auto-extract entities + relationships
- **Notion / Google Docs import** — beyond CSV

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
| 2026-03-15 | Reactivation — Triad reconciled with actual codebase | Decision to bring Lexicon back online |
