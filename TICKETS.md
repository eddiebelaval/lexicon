# TICKETS.md — Lexicon Execution Board

> Canonical ticket board for agent-driven execution.
> Strategy lives in `ROADMAP.md`.
> Milestone grouping lives in `MILESTONE_TASKLISTS.md`.
> Detailed current-phase breakdown lives in `MILESTONE_1_CHECKLIST.md`.

---

## How Agents Should Use This File

This file is the operational source of truth for execution.

### Rules
- Work from the top down.
- Always prefer the **highest-priority unblocked ticket**.
- Only mark a ticket `done` when it is built, verified, and reflected in docs if needed.
- If work uncovers new necessary tasks, add new tickets under the right milestone instead of burying them in notes.
- If a ticket is too large for one session, split it into smaller tickets before starting.

### Status Values
- `todo` — ready to pick up
- `in_progress` — currently being worked
- `blocked` — cannot proceed yet
- `done` — completed and verified

### Update Protocol
When an agent starts work:
- change one ticket to `in_progress`
- add short progress notes if helpful

When an agent finishes work:
- change the ticket to `done`
- record verification evidence
- update any affected docs

When an agent gets blocked:
- change the ticket to `blocked`
- add the reason in `Notes`
- create follow-up tickets if needed

---

## Current Priority Order

1. Milestone 1 — Production Beta Completion
2. Milestone 2 — Beta Hardening
3. Milestone 3 — Diaries S8 Pilot
4. Milestone 4 — Search and Intelligence Honesty
5. Milestone 5 — Multi-Show Architecture
6. Milestone 6 — Platform Expansion

---

## Milestone 1 — Production Beta Completion

### M1-01 Replace placeholder onboarding ownership
- Status: `todo`
- Priority: `P0`
- Depends on: none
- Goal: replace placeholder user ownership in onboarding with the real authenticated user
- Primary targets:
  - `app/api/onboard/route.ts`
  - `lib/supabase.ts`
- Verification:
  - signed-in user can create a production
  - created universe/production belong to the real user
  - tests pass for changed paths
- Notes:
  - current placeholder path is in `app/api/onboard/route.ts`

### M1-02 Resolve auth TODOs in production and storyline routes
- Status: `todo`
- Priority: `P0`
- Depends on: `M1-01`
- Goal: make production and storyline mutations use real session ownership/scoping
- Primary targets:
  - `app/api/productions/route.ts`
  - `app/api/productions/[id]/route.ts`
  - `app/api/storylines/route.ts`
  - `app/api/storylines/[id]/route.ts`
- Verification:
  - routes enforce or use authenticated ownership consistently
  - tests added or updated where needed

### M1-03 Verify signed-out behavior across onboarding and production entry
- Status: `todo`
- Priority: `P1`
- Depends on: `M1-01`
- Goal: ensure public users are redirected, gated, or handled intentionally
- Primary targets:
  - auth entry flows
  - onboarding entry points
  - viewer context hooks
- Verification:
  - signed-out flow is explicit and sane
  - no accidental placeholder access remains

### M1-04 Create a real Diaries S8 data import path
- Status: `todo`
- Priority: `P0`
- Depends on: `M1-01`
- Goal: establish the repeatable import/seed path for real S8 production data
- Primary targets:
  - `seed/diaries-s7.ts`
  - `seed/seed-supabase-production.ts`
  - any new S8-specific seed/import artifacts
- Verification:
  - repeatable path exists for loading S8 data
  - required inputs are documented

### M1-05 Load and validate real S8 production data in the app
- Status: `todo`
- Priority: `P0`
- Depends on: `M1-04`
- Goal: confirm real S8 cast, crew, scenes, contracts, and assets render correctly
- Primary targets:
  - production pages and supporting APIs
- Verification:
  - dashboard, calendar, cast, crew, gear, post, team, episodes, and call sheet render real data
  - no demo-only assumptions break the UI

### M1-06 Verify document templates against real team files
- Status: `todo`
- Priority: `P1`
- Depends on: `M1-05`
- Goal: ensure Word-native templates work with actual production documents
- Primary targets:
  - template/document generation flows
  - production settings/template surfaces
- Verification:
  - real templates upload cleanly
  - placeholder filling works
  - generated documents are usable by the team

### M1-07 Re-provision or reconnect Neo4j
- Status: `todo`
- Priority: `P0`
- Depends on: none
- Goal: restore graph-backed features for the beta environment
- Primary targets:
  - `lib/neo4j.ts`
  - environment configuration
- Verification:
  - `/api/health` reports Neo4j connected in the intended environment
  - graph-dependent routes respond successfully

### M1-08 Verify graph features against the restored Neo4j instance
- Status: `todo`
- Priority: `P1`
- Depends on: `M1-07`
- Goal: prove graph workflows are truly back, not just the connection
- Primary targets:
  - entities
  - relationships
  - graph view
  - search
  - production knowledge surfaces where applicable
- Verification:
  - graph UI loads
  - relationship and search flows work with live graph data

### M1-09 Configure final beta domain and app URL wiring
- Status: `todo`
- Priority: `P1`
- Depends on: none
- Goal: move from raw deployment URL to intended beta domain
- Primary targets:
  - deployment/DNS config
  - `NEXT_PUBLIC_APP_URL`
  - email/export URL generation
- Verification:
  - final domain resolves
  - generated links use the right base URL

### M1-10 Run Milestone 1 verification sweep
- Status: `todo`
- Priority: `P0`
- Depends on: `M1-02`, `M1-05`, `M1-08`, `M1-09`
- Goal: verify the full Milestone 1 beta surface end-to-end
- Verification:
  - `npm run build`
  - `npm run type-check`
  - `npm test -- --run`
  - manual checks for onboarding, dashboard, calendar, cast, crew, gear, post, team, call sheet, health

### M1-11 Reconcile docs after Milestone 1 ships
- Status: `todo`
- Priority: `P1`
- Depends on: `M1-10`
- Goal: keep triad and execution docs truthful after the milestone lands
- Primary targets:
  - `SPEC.md`
  - `VISION.md`
  - `BUILDING.md`
  - `ROADMAP.md`
  - `MILESTONE_TASKLISTS.md`
  - `TICKETS.md`
- Verification:
  - docs reflect the shipped state and remaining gaps

---

## Milestone 2 — Beta Hardening

### M2-01 Add CI for build, type-check, and tests
- Status: `todo`
- Priority: `P0`
- Depends on: `M1-10`

### M2-02 Add error monitoring
- Status: `todo`
- Priority: `P1`
- Depends on: `M1-10`

### M2-03 Add basic product analytics
- Status: `todo`
- Priority: `P2`
- Depends on: `M1-10`

### M2-04 Clean up build warnings and validation friction
- Status: `todo`
- Priority: `P1`
- Depends on: `M1-10`

### M2-05 Run mobile/tablet pass on critical production pages
- Status: `todo`
- Priority: `P1`
- Depends on: `M1-10`

### M2-06 Document deploy and verification workflow
- Status: `todo`
- Priority: `P2`
- Depends on: `M2-01`, `M2-04`

---

## Milestone 3 — Diaries S8 Pilot

### M3-01 Define pilot users and target workflows
- Status: `todo`
- Priority: `P0`
- Depends on: `M2-05`

### M3-02 Run coordinator workflow pilot
- Status: `todo`
- Priority: `P0`
- Depends on: `M3-01`

### M3-03 Run AC workflow pilot
- Status: `todo`
- Priority: `P1`
- Depends on: `M3-01`

### M3-04 Run producer/showrunner visibility workflow
- Status: `todo`
- Priority: `P1`
- Depends on: `M3-01`

### M3-05 Run post workflow validation
- Status: `todo`
- Priority: `P1`
- Depends on: `M3-01`

### M3-06 Tune triggers and alerts from pilot feedback
- Status: `todo`
- Priority: `P1`
- Depends on: `M3-02`, `M3-03`, `M3-04`, `M3-05`

### M3-07 Capture and synthesize pilot feedback
- Status: `todo`
- Priority: `P0`
- Depends on: `M3-06`

---

## Milestone 4 — Search and Intelligence Honesty

### M4-01 Decide whether live web search is required for beta
- Status: `todo`
- Priority: `P0`
- Depends on: `M3-07`

### M4-02 Implement live web search in the main search path or remove the claim
- Status: `todo`
- Priority: `P0`
- Depends on: `M4-01`

### M4-03 Separate graph knowledge, enrichment, and live search in product language
- Status: `todo`
- Priority: `P1`
- Depends on: `M4-02`

### M4-04 Validate Lexi answers against real pilot prompts
- Status: `todo`
- Priority: `P1`
- Depends on: `M4-02`

---

## Milestone 5 — Phase 2 Multi-Show Architecture

### M5-01 Build production switcher
- Status: `todo`
- Priority: `P0`
- Depends on: `M3-07`

### M5-02 Add `listProductionsForUser()` query path
- Status: `todo`
- Priority: `P0`
- Depends on: `M5-01`

### M5-03 Design shared crew identity layer
- Status: `todo`
- Priority: `P0`
- Depends on: `M5-02`

### M5-04 Implement shared crew identity layer
- Status: `todo`
- Priority: `P0`
- Depends on: `M5-03`

### M5-05 Add multi-production scene query support
- Status: `todo`
- Priority: `P1`
- Depends on: `M5-04`

### M5-06 Build cross-show calendar overlay
- Status: `todo`
- Priority: `P1`
- Depends on: `M5-05`

### M5-07 Add cross-production conflict detection
- Status: `todo`
- Priority: `P1`
- Depends on: `M5-06`

---

## Milestone 6 — Platform Expansion

### M6-01 Define self-serve onboarding scope
- Status: `todo`
- Priority: `P1`
- Depends on: `M5-07`

### M6-02 Strengthen tenant isolation model
- Status: `todo`
- Priority: `P0`
- Depends on: `M6-01`

### M6-03 Design billing boundary and account model
- Status: `todo`
- Priority: `P2`
- Depends on: `M6-02`

### M6-04 Define external API surface
- Status: `todo`
- Priority: `P2`
- Depends on: `M6-02`

### M6-05 Add cross-season continuity model
- Status: `todo`
- Priority: `P2`
- Depends on: `M6-02`

### M6-06 Expand Telegram workflows to team-level usage
- Status: `todo`
- Priority: `P2`
- Depends on: `M6-02`
