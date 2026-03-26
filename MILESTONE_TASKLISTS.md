---
last-updated: 2026-03-26
status: CURRENT
active-milestone: 1
---

# MILESTONE_TASKLISTS.md — Lexicon

> Execution task lists for all roadmap milestones.
> Strategy and sequencing: `ROADMAP.md`
> Canonical execution board: `TICKETS.md`
> Current milestone deep-dive: `MILESTONE_1_CHECKLIST.md`

---

## How To Use This Doc

- `ROADMAP.md` explains sequence, intent, and gates.
- This doc turns each milestone into a practical task list with verification criteria.
- `TICKETS.md` is the canonical execution board. Agents work from tickets, not this file.
- The current milestone always has a dedicated checklist (e.g., `MILESTONE_1_CHECKLIST.md`) with file-level detail.

If a task is vague, it is not ready. Break it down further before starting.

---

## Milestone 1 — Production Beta Completion

Deep-dive: `MILESTONE_1_CHECKLIST.md`

### Todo
- [ ] Replace placeholder onboarding ownership with real authenticated ownership
- [ ] Resolve auth TODOs in production and storyline routes
- [ ] Load real Diaries S8 cast, crew, schedule, and template data
- [ ] Restore Neo4j-backed graph workflows or explicitly scope them out
- [ ] Configure final beta domain and correct app URLs
- [ ] Complete the Milestone 1 verification pass
- [ ] Reconcile triad and execution docs after the work lands

### Verification
- [ ] Signed-in user owns created productions
- [ ] Real S8 data renders across all production pages
- [ ] Graph features are live or honestly scoped out
- [ ] Final beta domain resolves and generates correct links
- [ ] Build, type-check, and tests pass

### Done When
- [ ] Real user ownership is working
- [ ] Real S8 data is usable
- [ ] Graph status is honest
- [ ] Final beta domain works
- [ ] Verification is complete

---

## Milestone 2 — Beta Hardening

### Todo
- [ ] Add CI for build, type-check, and tests
- [ ] Add error monitoring
- [ ] Add basic product analytics
- [ ] Clean up current build warnings
- [ ] Remove validation workflow friction from a clean checkout
- [ ] Run a mobile/tablet pass across critical production pages
- [ ] Document the deploy and verification workflow

### Verification
- [ ] CI fails on broken build, type-check, or tests
- [ ] Runtime errors surface in monitoring
- [ ] Key product actions are visible in analytics
- [ ] Dashboard, calendar, cast, crew, gear, post, team, and call sheet are usable on mobile/tablet

### Done When
- [ ] The app is dependable enough for repeated internal use
- [ ] Failures are visible instead of anecdotal
- [ ] Field use is no longer an obvious blocker

---

## Milestone 3 — Diaries S8 Pilot

### Todo
- [ ] Define the pilot users and operating workflow
- [ ] Choose the exact workflows that must leave the spreadsheet first
- [ ] Run the team through onboarding or production access
- [ ] Validate daily coordinator workflow in Lexicon
- [ ] Validate AC workflow for field logistics
- [ ] Validate producer/showrunner visibility workflow
- [ ] Validate post workflow for footage tracking
- [ ] Tune triggers and alerts based on actual team behavior
- [ ] Collect structured feedback after live use

### Verification
- [ ] At least one daily operating loop happens in Lexicon instead of Excel
- [ ] Users can complete core tasks without undocumented workarounds
- [ ] Feedback reveals specific blockers instead of vague discomfort

### Done When
- [ ] The team prefers Lexicon for at least one meaningful operations slice
- [ ] Pilot feedback is concrete enough to drive the next cycle

---

## Milestone 4 — Search and Intelligence Honesty

### Todo
- [ ] Decide whether live web search is a beta requirement
- [ ] Implement live web search in the main search path, or explicitly remove the claim
- [ ] Separate graph knowledge, external enrichment, and live search in docs and UI
- [ ] Verify Lexi production intelligence against real pilot questions
- [ ] Tighten product language around what Lexi can actually do

### Verification
- [ ] Search behavior matches docs and product messaging
- [ ] External enrichment is not confused with live search
- [ ] Real user prompts return sensible, trustworthy results

### Done When
- [ ] Lexi’s marketed intelligence matches the shipped intelligence

---

## Milestone 5 — Phase 2 Multi-Show Architecture

### Todo
- [ ] Build production switcher
- [ ] Add `listProductionsForUser()` query path
- [ ] Design and implement shared crew identity layer
- [ ] Add multi-production scene query support
- [ ] Build cross-show calendar overlay
- [ ] Add cross-production conflict detection
- [ ] Verify cross-show availability and scheduling visibility

### Verification
- [ ] One user can move between multiple productions cleanly
- [ ] Shared crew is modeled without duplicate-identity ambiguity
- [ ] Cross-show conflicts appear in the system

### Done When
- [ ] Lexicon supports multiple concurrent productions without breaking the single-show model

---

## Milestone 6 — Platform Expansion

### Todo
- [ ] Define self-serve onboarding scope
- [ ] Add stronger tenant isolation where needed
- [ ] Design billing boundary and account model
- [ ] Define external API surface
- [ ] Add cross-season continuity model
- [ ] Expand Telegram workflows to team-level usage

### Verification
- [ ] Product can onboard non-Eddie teams cleanly
- [ ] Account and tenant boundaries are explicit
- [ ] Platform features do not erode the production-native core

### Done When
- [ ] Lexicon is moving from internal tool to repeatable product

---

## Execution Order

See `TICKETS.md` for the canonical priority order and dependency graph. Milestones are sequential: each milestone's gate must close before the next opens.
