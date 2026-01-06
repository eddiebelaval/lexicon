# Lexicon — Product Requirements Document

**Version:** 2.0
**Date:** January 5, 2026
**Status:** Ready for Development

---

## One-Line Summary

**Lexicon is Wikipedia + Perplexity for story universes.**

Search your narrative world like a wiki. Get answers synthesized from your knowledge graph + the live web.

---

## The Problem

When you're deep into a story universe — 50 episodes, 100 characters, 10 seasons — finding information becomes archaeological work.

**Current reality:**
- Excel sheets with 40+ tabs
- "Who dated who in Season 3?" = 30 minutes of digging
- New team members take weeks to get up to speed
- Institutional knowledge lives in people's heads
- Web has updates your docs don't

**The pain:** Information exists, but it's scattered, unsearchable, and disconnected.

---

## The Solution

A **graph-powered knowledge platform** where:

1. **Everything connects** — Characters, locations, events, objects are nodes. Relationships are edges.
2. **Search understands narrative** — "Who betrayed whom?" actually works.
3. **Web augments your knowledge** — Ask about your universe, get answers that blend your data + recent news/info.

---

## Core User Flow

```
User asks: "What's the relationship between Milady and Athos?"

Lexicon:
1. Searches knowledge graph → finds marriage, betrayal, attempted execution
2. Searches web (optional) → finds recent adaptations, interpretations
3. Synthesizes → returns narrative answer with sources
```

---

## MVP Features (V1)

1. **Entity Management** - CRUD for characters, locations, events, objects, factions
2. **Relationship Mapping** - Connect entities with typed relationships
3. **AI-Powered Search** - Natural language → graph search → synthesis
4. **Basic Visualization** - D3.js interactive graph
5. **CSV Import** - Bulk entity creation

## Out of Scope (V2+)

- Timeline engine
- Team collaboration
- Version history
- API access
- Mobile app

---

See full PRD in project documentation.
