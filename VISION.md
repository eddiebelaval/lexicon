---
last-evolved: 2026-03-21
confidence: HIGH
distance: 80%
pillars: "6 (4 realized, 1 partial, 1 unrealized)"
---

# VISION

## Soul

**Lexicon is the operating system for unscripted television production. Lexi is the intelligence that runs it.**

Not a spreadsheet replacement. Not a project management tool. An operating system -- the single surface where a production lives, breathes, and moves through its entire lifecycle. From the moment a show is greenlit to the moment the final cut ships, every asset, every person, every decision passes through Lexicon.

**Core belief:** A production is a living organism. Cast, crew, contracts, scripts, schedules, shoots, and deliverables are not rows in a spreadsheet -- they are interconnected assets that move through stages, depend on each other, and need to be visible to everyone at the same time. The Excel doc your team passes around is a snapshot of a dead moment. Lexicon is the living state.

**The intake document IS the production.** When a showrunner opens Lexicon for the first time and sets up a new show, that setup process defines the entire production -- cast, crew, locations, schedule, asset types, completion criteria. Everything downstream flows from that intake. Change the intake, and the whole board updates.

**Who it serves:** Production teams at any scale -- coordinators, ACs, producers, showrunners, post supervisors. Anyone who has ever scrolled through a spreadsheet looking for "is this person signed?" or "did we pick up that footage?" Starting with unscripted TV (Diaries franchise). Expanding to any show that runs on chaos and spreadsheets.

**Entity pattern:** Lexi follows the same architecture as Ava (Parallax) and Dae (Homer). Graph/data layer + AI synthesis + entity personality + multiple surfaces. The Chladni plate vibrates at the same frequency -- each domain produces a new shape.

**Where it lives in the ecosystem:** Lexicon is the unified production tool that replaces the separate Lexicon (knowledge), ID8Composer (writing), and Prodigy (scheduling) vision. One product, one entity, one place for everything.

## Why This Exists

Eddie's team runs Season 8 of Diaries on Excel. Literally. Cast contracts tracked in a spreadsheet. Crew availability in another. Shooting schedule in a third. Equipment and footage in a fourth. Every coordinator, AC, and producer has their own copy. Nobody knows which version is current. Things fall through the cracks constantly -- unsigned contracts, footage sitting on cards, gear not returned, scenes with no crew assigned.

This is not unique to Diaries. Every unscripted TV production runs on the same duct tape and band-aids. The tools that exist (Movie Magic, StudioBinder, Yamdu) are either built for scripted production, too expensive for mid-budget shows, or too rigid for the controlled chaos of unscripted formats.

Lexicon exists because Eddie lives inside the problem. He knows what a coordinator needs at 6 AM on a shoot day, what a post supervisor needs when footage isn't arriving, what a showrunner needs when a cast member goes dark. He built the operating system he wishes his team had.

## Pillars

### 1. **Asset Lifecycle Management** -- REALIZED

Every production asset has a life. Contracts start as drafts and end as signed documents. Scripts start as outlines and end as locked finals. Shoots start as scheduled dates and end as uploaded footage. Every asset type moves through typed stages with transitions, timestamps, owners, and blockers. Shipped: 30K LOC, typed lifecycle stages, completion tracking, stage transitions.

### 2. **Intake-First Onboarding** -- REALIZED

The intake process IS the product. When you set up a new show, Lexicon walks you through show metadata, cast/crew rosters, asset definitions, schedule skeletons, and imports from existing docs. The intake informs the entire app -- dashboard layout, completion tracking, calendar structure. Shipped: conversational intake with Lexi, CSV/Excel import with Lexi parser, document template upload from SharePoint/Word files.

### 3. **Lexi Entity** -- REALIZED

Lexi is the production's institutional memory and operational intelligence. She answers ("What's left for Chantel?"), she acts (schedule, assign, flag), she alerts ("3 contracts unsigned with shoots next week"). Shipped: entity system with production-aware NLP, graph-backed knowledge, 62 agent tools (including document templates), RBAC (8 roles x 33 capabilities), Telegram bot, web enrichment (Perplexity + Grok).

### 4. **Real-Time Collaboration** -- REALIZED

Every team member sees the same board with live updates. Supabase Realtime powers the sync layer across all 13 production pages. Lexi drawer provides AI assistance from any page. Missing (nice-to-have): multi-user presence indicators, conflict resolution for simultaneous edits.

### 5. **Multi-Show Architecture** -- PARTIAL (40%)

Each show is its own world with its own cast, crew, assets, and lifecycles. Cross-show views surface scheduling conflicts and resource contention. Missing: crew sharing across shows, cross-show calendar overlay.

### 6. **Production-Native Data Model** -- REALIZED

The data model mirrors how productions actually work. Cast relationships live in a graph (Neo4j). Schedules, contracts, and logistics live in structured tables (Supabase). The AI layer connects them. Shipped: hybrid Neo4j + Supabase schema, production-native queries.

## User Truth

**Who:** Production coordinators, ACs, producers, and showrunners on unscripted TV shows. People who are already drowning in spreadsheets and WhatsApp threads, who spend more time tracking logistics than making creative decisions.

**Before:** "I have 15 tabs open, three versions of the cast spreadsheet, and I still can't tell you if Chantel's contract is signed. The shoot is tomorrow and I don't know who's assigned. Footage from last week is sitting on a card somewhere. I'm going to miss something."

**After:** "I opened Lexicon and the dashboard told me exactly what's overdue, who's unassigned, and which footage hasn't been uploaded. Lexi flagged the unsigned contracts before I even asked. I set up the whole show in 10 minutes from my old Excel files."

## Phased Vision

### Phase 1 -- Production Beta (CURRENT, ~80% complete)

Validate with Diaries S8. Replace Eddie's team's spreadsheets with Lexicon for one full production cycle. Prove that the lifecycle engine, intake wizard, and Lexi intelligence actually reduce the chaos.
- [DONE] Landing page with Feedback Loop shader hero + waitlist
- [DONE] Production-first shell with warm-dark design system
- [DONE] All 13 production pages live (zero placeholders)
- [DONE] Document templates system for team's Word files
- [DONE] 62 Lexi tools (full dashboard + template parity)
- Neo4j re-provisioning for cast knowledge graph
- Custom domain
- Seed with real S8 cast and schedule data
- Auth (email OTP)

### Phase 2 -- Multi-Show & Distribution

Open to additional shows. Prove the architecture handles multiple concurrent productions.
- Cross-show views (resource contention, shared crew)
- Timeline visualization across production lifecycle
- Mobile companion for ACs and coordinators on set
- API access for external tools

### Phase 3 -- Platform

Lexicon becomes the production OS other shows adopt independently.
- Cross-season continuity (track cast and storylines across seasons)
- Telegram group chat (team-level Lexi interactions)
- Self-serve onboarding without Eddie
- Billing and multi-tenant isolation

## Edges

- Lexicon does NOT write scripts, outlines, or story content. It manages the production, not the narrative.
- Lexicon does NOT handle payroll, invoicing, or financial transactions. Contract tracking is status-only.
- Lexicon does NOT do video editing, transcription, or media processing.
- Lexicon does NOT replace the showrunner's creative judgment. Lexi surfaces data; humans make decisions.
- Lexicon does NOT target scripted production workflows (yet). Built for unscripted chaos first.

## Anti-Vision

- **Never become generic.** The moment Lexicon tries to be "project management for everyone," it loses the production-native advantage. Asana already exists. Lexicon knows what a call sheet is.
- **Never require training.** If a coordinator can't figure it out in 10 minutes, the UX failed. The intake process teaches the app, not the other way around.
- **Never let the data go stale.** A static tracker is a dead tracker. Automated triggers, Lexi alerts, and real-time sync exist to prevent spreadsheet entropy.
- **Never replace the humans.** Lexi amplifies the team. She doesn't replace the judgment of a showrunner or the instincts of a producer. She just makes sure nothing falls through the cracks.
- **Never overload the coordinator.** The coordinator already has too much to track. Every notification, alert, and dashboard element must reduce cognitive load, not add to it.

## Design Principles

- The intake defines the production. Everything downstream flows from setup, not configuration.
- Production assets are alive. Every asset has a lifecycle, a current stage, and a next action.
- Real-time is the default. If two people see different states, the tool has failed.
- Lexi acts, she doesn't just answer. Intelligence without agency is just search.
- The spreadsheet is the enemy. Every manual tracking workflow that survives is a design failure.

## Evolution Log

| Date | What Shifted | Signal | Section |
|------|-------------|--------|---------|
| 2025-09 | Conceived as personal knowledge OS (Version B) | Needed a second brain for all personal data | Soul |
| 2025-09 | TMNT agent framework designed (5 agents) | Specialized agents for intake, mapping, retrieval | Soul |
| 2025-09 | Original tech: Python + SQLite + ChromaDB + CLI | Lightweight personal tool, local-first | Pillars |
| 2026-01 | Pivoted to Version A: Enterprise narrative platform | Higher-value play -- graph-powered knowledge for story worlds | Soul |
| 2026-01 | Tech pivot: Next.js + Neo4j + Supabase + D3.js | Web-first, graph-native, multi-tenant | Pillars |
| 2026-01 | Sprint: Stage 1-8 in 3 days (parallel agent orchestration) | 4 agents, 6 features + bonus features | Pillars |
| 2026-01-Mar | Dormant -- Parallax, Homer, Research Lab took priority | Revenue focus on Parallax as primary product | Soul |
| 2026-03-15 | Reactivation + pivot to production management | Eddie's team runs on Excel. Lexicon + Composer + Prodigy consolidated into one | Soul, Pillars |
| 2026-03-15 | Entity: Lexi named | Same pattern as Ava/Dae. Production intelligence entity. | Soul |
| 2026-03-16 | Phase 1: Lexi backend | 7 tables, 10 API routes, Lexi entity, 5 agent tools, seeded with Diaries S7 | Pillars |
| 2026-03-16 | Phase 2: Production UI | Dashboard, calendar, cast board, crew board, scene editor. Spreadsheet replacement functional. | Pillars |
| 2026-03-16 | Phase 3: Course correction -- spreadsheet replacement to production OS | Realized the true north star is lifecycle management, not spreadsheet replacement | Soul, Anti-Vision |
| 2026-03-16 | Phases 3-6 shipped in one session | Lifecycle engine, intake wizard, realtime collab, Lexi autonomy. All 6 VISION pillars now have code. | Pillars |
| 2026-03-18 | Session 2: Full production lifecycle realized | Gear, footage, documents, triggers, post-production board, 46 tools. The spreadsheet is dead. | Pillars |
| 2026-03-20 | v2 format upgrade | Triad template standardization across all projects | Structure |
