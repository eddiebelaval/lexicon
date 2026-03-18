# VISION.md — Lexicon

> What it is BECOMING. The evolving north star.

**Last reconciled:** March 18, 2026
**Product:** Lexicon — Production Operating System for Unscripted TV
**Entity:** Lexi (production intelligence)
**Owner:** Eddie Belaval / ID8Labs

---

## Soul

**Lexicon is the operating system for unscripted television production. Lexi is the intelligence that runs it.**

Not a spreadsheet replacement. Not a project management tool. An operating system — the single surface where a production lives, breathes, and moves through its entire lifecycle. From the moment a show is greenlit to the moment the final cut ships, every asset, every person, every decision passes through Lexicon.

**Core belief:** A production is a living organism. Cast, crew, contracts, scripts, schedules, shoots, and deliverables are not rows in a spreadsheet — they are interconnected assets that move through stages, depend on each other, and need to be visible to everyone at the same time. The Excel doc your team passes around is a snapshot of a dead moment. Lexicon is the living state.

**The intake document IS the production.** When a showrunner opens Lexicon for the first time and sets up a new show, that setup process defines the entire production — cast, crew, locations, schedule, asset types, completion criteria. Everything downstream flows from that intake. Change the intake, and the whole board updates.

**Who it serves:** Production teams at any scale — coordinators, ACs, producers, showrunners, post supervisors. Anyone who has ever scrolled through a spreadsheet looking for "is this person signed?" or "did we pick up that footage?" Starting with unscripted TV (Diaries franchise). Expanding to any show that runs on chaos and spreadsheets.

**Entity pattern:** Lexi follows the same architecture as Ava (Parallax) and Dae (Homer). Graph/data layer + AI synthesis + entity personality + multiple surfaces. The Chladni plate vibrates at the same frequency — each domain produces a new shape.

**Where it lives in the ecosystem:** Lexicon is the unified production tool that replaces the separate Lexicon (knowledge), ID8Composer (writing), and Prodigy (scheduling) vision. One product, one entity, one place for everything.

---

## Pillars

### 1. Asset Lifecycle Management
Every production asset has a life. Contracts start as drafts and end as signed documents. Scripts start as outlines and end as locked finals. Shoots start as scheduled dates and end as uploaded footage. Every asset type moves through **typed stages** with transitions, timestamps, owners, and blockers.

The lifecycle model is the core differentiator. Spreadsheets are static. Lexicon is temporal. When someone asks "where are we?", the answer isn't a cell value — it's a map of everything in motion, what's blocked, what's next, what's overdue.

**Asset types and their lifecycles:**

| Asset | Stages |
|-------|--------|
| Contracts | Draft > Sent > Negotiating > Signed > Active > Complete |
| Scripts | Outline > Draft > Review > Locked > Revisions > Final |
| Scenes/Shoots | Proposed > Scheduled > Crew Assigned > Shot > Footage Uploaded > Logged |
| Post-Production | Ingested > Editing > Review > Corrections > Final > Delivered |
| Deliverables | Defined > In Progress > Review > Approved > Shipped |

The stages are not hardcoded. Each show defines its own asset types and lifecycles during intake. Diaries has "Shoot Done / INTV Done / PU Done / $ Done." Another show might have completely different completion criteria. The platform adapts.

### 2. Intake-First Onboarding
The intake process IS the product. When you set up a new show, Lexicon walks you through:
- Show metadata (name, season, network, production company, date range)
- Cast roster (names, locations, pairings, storyline arcs)
- Crew roster (names, roles, availability patterns)
- Asset definitions (what types of assets does this show track? what stages do they move through?)
- Schedule skeleton (key dates, shoot blocks, post windows)
- Import from existing docs (CSV, Excel) — meet teams where their data already lives

The intake is not a form. It's a conversation with Lexi. "Tell me about your show." The intake document informs the entire app — dashboard layout, completion tracking columns, calendar structure, notification triggers. Different shows get different boards because different shows have different workflows.

### 3. Lexi Entity — Intelligence That Acts
Lexi is not a chatbot. She is the production's institutional memory and operational intelligence. She knows every asset, every person, every stage, every dependency.

**She answers:** "What's left for Chantel?" "Who's available Thursday?" "Which cast haven't done interviews?" "What's blocking the Miami shoot?"

**She acts:** Schedule a scene. Assign an AC. Mark footage uploaded. Send a contract reminder. Generate a call sheet. Flag an overdue pickup.

**She alerts:** "3 contracts unsigned with shoots next week." "Ryan is double-booked on Thursday." "Post deliverables for episode 4 are 2 days overdue."

### 4. Real-Time Collaboration
Every team member sees the same board. When a coordinator marks a contract signed, the producer's dashboard updates. When an AC uploads footage, the post supervisor sees it. No refresh. No "did you update the spreadsheet?"

Supabase Realtime powers the sync layer. Every data mutation broadcasts to all connected clients. The board is always current.

### 5. Multi-Show Architecture
Each show is its own world with its own cast, crew, assets, and lifecycles. A showrunner managing three shows sees three separate productions with clean boundaries. Crew can be shared across shows (a coordinator who works on Diaries and Pillow Talk). Cross-show views surface scheduling conflicts and resource contention.

### 6. Production-Native Data Model
The data model mirrors how productions actually work, not how databases or spreadsheets force you to think. Cast relationships live in a graph (Neo4j). Schedules, contracts, and logistics live in structured tables (Supabase). The AI layer connects them. Every query speaks the language of production — "Who's shooting this week?" not "SELECT * FROM scenes WHERE..."

---

## Anti-Vision

Lexicon is NOT:

- **A generic project management tool.** Not Asana. Not Monday.com. Purpose-built for the specific chaos of unscripted TV production.
- **A writing tool.** Lexicon manages the production. It doesn't write the story.
- **A static tracker.** Static trackers decay the moment you close the tab. Lexicon is real-time, lifecycle-aware, and actively managed by Lexi.
- **A tool that requires training.** If a coordinator can't figure it out in 10 minutes, the UX failed. The intake process teaches the app, not the other way around.
- **A replacement for the humans.** Lexi amplifies the team. She doesn't replace the judgment of a showrunner or the instincts of a producer. She just makes sure nothing falls through the cracks.

---

## North Star Capabilities

### Already Built (Foundation)
- Cast knowledge graph: entity management (5 types), relationships (9 types), AI search, D3.js graph viz, wiki view, storylines
- Chat with Lexi: SSE streaming, citations, production mode toggle, 6 query functions, 5 production agent tools
- Production schema: 7 Supabase tables, 10 API routes, Zod validation
- Production data: scenes, crew, cast contracts, crew availability, upload tasks
- CSV import (auto-detect, type inference)
- Notifications system
- ProductionProvider shared context, centralized status configs

### Already Built (Production UI)
- Production dashboard: stat cards, upcoming scenes, incomplete contracts
- Calendar view: week/month with scene chips, status color coding
- Cast board: contract table with interactive completion checkboxes
- Crew availability board: weekly grid with color-coded status cells
- Scene edit dialog: full create/edit with cast assignment
- Shared layout with tab navigation + "Ask Lexi" shortcut

### Already Built (continued — Phase 3-6, Mar 16)
- Asset lifecycle engine: 5 tables, typed state machines, show-defined stages
- Show intake wizard: 5-step guided onboarding, any show in 10 minutes
- Real-time collaboration: Supabase Realtime subscriptions, inline editing, debounced
- Lexi write tools: schedule scenes, assign crew, mark contracts, advance stages, update availability (27 total tools)
- Production alerts: unsigned contracts, double-booked crew, overdue deliverables, stuck stages, unassigned scenes
- Call sheet generator: auto-generate from schedule + crew, printable output
- Design polish: visual hierarchy, empty states, color consistency

### Next — Launch Readiness
- **Neo4j re-provisioning** — restore cast knowledge graph for relationship queries
- **Landing page** — first impression for new users
- **Domain selection** — custom domain for the tool
- **Telegram surface** — field crew can ask Lexi questions via bot
- **Diaries S8 seed data** — replace S7 demo data with real S8 cast and schedule

### Future
- **Custom asset types** — shows define their own asset categories beyond the defaults
- **Cross-show views** — resource contention, shared crew scheduling, portfolio dashboard
- **Post-production pipeline** — editing, review, corrections, delivery tracking
- **Script tracking** — outline through locked final with revision management
- **Timeline visualization** — temporal view of all assets across production lifecycle
- **API access** — external tools query production data
- **Mobile companion** — field-optimized view for ACs and coordinators on set
- **Cross-season continuity** — track cast and storylines across seasons

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
| 2026-03-16 | Phase 1: Lexi backend | 7 tables, 10 API routes, Lexi entity, 5 agent tools, seeded with Diaries S7 |
| 2026-03-16 | Phase 2: Production UI | Dashboard, calendar, cast board, crew board, scene editor. Spreadsheet replacement functional. |
| 2026-03-16 | Phase 3: Course correction — spreadsheet replacement to production OS | Realized the true north star is lifecycle management, intake-first onboarding, real-time collaboration, and multi-show architecture. Lexicon is not replacing a spreadsheet. It's replacing the entire operational layer of TV production. |
| 2026-03-16 | Phases 3-6 shipped in one session | Lifecycle engine, intake wizard, realtime collab, Lexi autonomy (write tools + alerts + call sheets). All 6 VISION pillars now have code. |
