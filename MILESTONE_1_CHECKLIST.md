# MILESTONE_1_CHECKLIST.md — Production Beta Completion

> Execution checklist for Milestone 1 from `ROADMAP.md`.
> Goal: make Lexicon usable for a real Diaries S8 production without demo assumptions.

---

## Milestone Goal

Close the remaining Phase 1 gaps so Lexicon can support one real production cycle for Diaries S8.

Success means:
- real authenticated ownership,
- real production data,
- graph-backed features restored or honestly scoped,
- and a verified beta surface that can be used by the team without spreadsheet fallback for core workflows.

---

## Current Reality

Already true:
- `npm test -- --run` passes at 227 tests
- `npm run build` passes
- `npm run type-check` passes
- `/api/health` already reflects `mode: production-beta` with optional Neo4j detail

Not done yet:
- onboarding still uses a placeholder owner in [app/api/onboard/route.ts](/Users/eddiebelaval/Development/id8/lexicon/app/api/onboard/route.ts#L59)
- auth-related TODOs still exist in production and storyline routes
- real Diaries S8 data is not yet the verified operating dataset
- Neo4j is still treated as operationally degraded in the docs
- custom domain is still listed as a Phase 1 gap

---

## Workstream 1 — Auth and Ownership

### Outcome
Every created universe and production belongs to a real signed-in user, and route behavior matches authenticated ownership.

### Tasks
- [ ] Replace placeholder onboarding ownership in [app/api/onboard/route.ts](/Users/eddiebelaval/Development/id8/lexicon/app/api/onboard/route.ts#L59) with the current authenticated user.
- [ ] Use the existing auth helpers in [lib/supabase.ts](/Users/eddiebelaval/Development/id8/lexicon/lib/supabase.ts#L326) to standardize user lookup across API routes.
- [ ] Resolve the auth TODOs in:
  - [app/api/productions/route.ts](/Users/eddiebelaval/Development/id8/lexicon/app/api/productions/route.ts#L94)
  - [app/api/productions/[id]/route.ts](/Users/eddiebelaval/Development/id8/lexicon/app/api/productions/[id]/route.ts#L126)
  - [app/api/storylines/route.ts](/Users/eddiebelaval/Development/id8/lexicon/app/api/storylines/route.ts#L124)
  - [app/api/storylines/[id]/route.ts](/Users/eddiebelaval/Development/id8/lexicon/app/api/storylines/[id]/route.ts#L136)
- [ ] Confirm the public entry flow still behaves sensibly when no user is signed in.
- [ ] Verify ownership scoping on the universe list and production selection flow via [lib/hooks/use-viewer-context.ts](/Users/eddiebelaval/Development/id8/lexicon/lib/hooks/use-viewer-context.ts#L7).

### Dependencies
- Supabase auth must be working in the deployed environment.

### Verification
- [ ] Signed-in user can create a production through onboarding.
- [ ] Created universe and production are linked to the real user.
- [ ] Signed-out user is blocked or redirected appropriately.
- [ ] Existing tests still pass; add route coverage where ownership logic changes.

---

## Workstream 2 — Diaries S8 Real Data

### Outcome
Lexicon runs on real or representative Diaries S8 production data instead of demo-ish defaults.

### Tasks
- [ ] Decide the import path: structured seed script, onboarding import, or both.
- [ ] Create or update a dedicated S8 seed/import source based on the current patterns in:
  - [seed/diaries-s7.ts](/Users/eddiebelaval/Development/id8/lexicon/seed/diaries-s7.ts)
  - [seed/seed-supabase-production.ts](/Users/eddiebelaval/Development/id8/lexicon/seed/seed-supabase-production.ts)
- [ ] Load real cast, crew, schedule, and any required lifecycle/template inputs.
- [ ] Verify document templates work with real team files and real placeholders.
- [ ] Validate that imported data renders correctly across dashboard, calendar, cast, crew, gear, post, team, episodes, and call sheet flows.

### Dependencies
- Auth and production ownership should be in place first, or data ownership will need to be migrated later.

### Verification
- [ ] A real S8 production record exists in the app.
- [ ] Cast, crew, scenes, contracts, and lifecycle assets appear correctly in the UI.
- [ ] Call sheet generation works against real production data.
- [ ] At least one onboarding/import path is documented and repeatable.

---

## Workstream 3 — Neo4j Recovery

### Outcome
Graph-backed features are operational again, or explicitly scoped out of the beta surface until restored.

### Tasks
- [ ] Re-provision or reconnect Neo4j using the env contract in [lib/neo4j.ts](/Users/eddiebelaval/Development/id8/lexicon/lib/neo4j.ts#L21).
- [ ] Confirm the health check in [lib/neo4j.ts](/Users/eddiebelaval/Development/id8/lexicon/lib/neo4j.ts#L132) succeeds in the intended environment.
- [ ] Verify graph-dependent flows:
  - entity CRUD
  - relationships
  - graph view
  - AI/graph search
  - production knowledge where graph context matters
- [ ] If Neo4j cannot be restored in time, explicitly hide or downgrade graph-dependent claims in product messaging and docs.

### Dependencies
- Environment variables for `NEO4J_URI`, `NEO4J_USERNAME`, and `NEO4J_PASSWORD`

### Verification
- [ ] `/api/health` reports Neo4j as connected in the target environment.
- [ ] Graph UI loads with live data.
- [ ] Search and relationship flows behave correctly against the restored graph.

---

## Workstream 4 — Custom Domain and Launch Surface

### Outcome
The beta feels like a real product entry point, not a raw deployment URL.

### Tasks
- [ ] Decide the Phase 1 production domain.
- [ ] Configure the domain in Vercel and align `NEXT_PUBLIC_APP_URL`.
- [ ] Update email/link generation paths that rely on app URL defaults in:
  - [lib/email/index.ts](/Users/eddiebelaval/Development/id8/lexicon/lib/email/index.ts#L148)
  - [lib/tools.ts](/Users/eddiebelaval/Development/id8/lexicon/lib/tools.ts#L3605)
- [ ] Validate public landing, onboarding entry, and authenticated app routing on the final domain.

### Dependencies
- Deployment access and DNS control

### Verification
- [ ] Final domain resolves correctly.
- [ ] Email and export links use the correct base URL.
- [ ] No hardcoded fallback URLs leak into visible production flows.

---

## Workstream 5 — Verification Pass

### Outcome
Milestone 1 is proven by workflows, not just by code existing.

### Tasks
- [ ] Turn the relevant items in [SPEC.md](/Users/eddiebelaval/Development/id8/lexicon/SPEC.md#L300) into a short Milestone 1 QA checklist.
- [ ] Verify the core infrastructure commands:
  - `npm run build`
  - `npm run type-check`
  - `npm test -- --run`
- [ ] Manually verify the core beta flows:
  - onboarding
  - production dashboard
  - calendar
  - cast board
  - crew board
  - gear/post boards
  - team registration
  - call sheet generation
  - health route
- [ ] Note any feature that remains partial rather than silently treating it as done.

### Dependencies
- Workstreams 1-4 should be substantially complete first.

### Verification
- [ ] All Milestone 1 workflows are tested in a realistic environment.
- [ ] Remaining limitations are documented in `SPEC.md` and not hidden by launch language.

---

## Recommended Sequence

Use this order unless a dependency forces a change:

1. Auth and ownership
2. Diaries S8 real data
3. Neo4j recovery
4. Custom domain and launch surface
5. Full verification pass

Reasoning:
- Ownership should come first so real data lands in the correct tenant context.
- Real data should be in place before the final verification pass.
- Neo4j recovery and domain setup are important, but they should support the real pilot rather than delay the ownership fix.

---

## Definition of Done

Milestone 1 is done only when all of these are true:
- [ ] A signed-in user can create and access a production without placeholder ownership.
- [ ] Real Diaries S8 data is in the system and usable in the current UI.
- [ ] Neo4j-backed features are restored or honestly scoped out.
- [ ] The final beta domain is live and correctly wired.
- [ ] The Milestone 1 verification pass is complete.
- [ ] `ROADMAP.md`, `SPEC.md`, and `BUILDING.md` still tell the truth after the work ships.

If any box above is still open, Milestone 1 is still in progress.
