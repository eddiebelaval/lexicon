---
last-updated: 2026-03-26
status: CURRENT
active-milestone: 1
---

# ROADMAP.md — Lexicon

> Execution roadmap derived from the triad: `VISION.md`, `SPEC.md`, `BUILDING.md`.
> Operational companion: `MILESTONE_TASKLISTS.md`
> Canonical execution board: `TICKETS.md`
> Current milestone deep-dive: `MILESTONE_1_CHECKLIST.md`

---

## Execution Layer

The triad (`VISION.md`, `SPEC.md`, `BUILDING.md`) defines what the product is.
The execution layer defines what to do about it, at four zoom levels:

| Doc | Role | Audience |
|---|---|---|
| `ROADMAP.md` | Strategy, sequencing, gates | Humans and agents |
| `MILESTONE_TASKLISTS.md` | Tactical task lists per milestone | Humans and agents |
| `TICKETS.md` | Agent-executable work units with dependencies | Agents (primary), humans |
| `MILESTONE_N_CHECKLIST.md` | Deep-dive for the current milestone with file-level targets | Agents |

**Naming convention:** The current milestone always has a dedicated checklist named `MILESTONE_N_CHECKLIST.md` (e.g., `MILESTONE_1_CHECKLIST.md`). When a milestone closes, its checklist is archived and replaced with the next milestone's checklist. Only one active checklist exists at a time.

**Reconciliation:** Each milestone's final ticket (e.g., M1-11, M2-06) updates all triad and execution docs to reflect shipped state. Frontmatter timestamps are updated. The `active-milestone` field increments.

---

## Current Read

Lexicon is in **Stage 9: Launch Prep** and is best understood as a **credible private production beta**, not a launch-hardened platform yet.

What is true right now:
- The production-first product shape is real.
- The build passes, the test suite passes, and the triad docs have been reconciled.
- The core Phase 1 promise is still the right focus: prove Lexicon can replace Diaries S8 spreadsheet workflows for one real production cycle.

What is not true yet:
- Public launch readiness is not proven.
- Multi-show architecture is not built.
- Auth, monitoring, and graph/web-search honesty still need work before a wider rollout.

## Planning Principles

- **Pilot over platform.** Finish the Diaries S8 operating loop before expanding the product surface.
- **Trust before features.** Auth, verification, observability, and production readiness beat new tabs.
- **Operational truth over roadmap theater.** A feature is not "done" until the workflow actually works end-to-end for a production user.
- **Ship in layers.** Stabilize the single-show experience before multi-show architecture.
- **Protect focus.** If work does not improve Diaries S8 adoption, launch trust, or production reliability, defer it.

## Universal Definition of Done

Before calling any milestone done, confirm all three:
- **Built:** the feature exists in code.
- **Verified:** the workflow passes tests and manual validation.
- **Adopted:** a real user can use it without fallback spreadsheets or undocumented workarounds.

If one of those is missing, the work is still in progress. Each milestone checklist has its own exit criteria that operationalize these three conditions.

## Success Definition

Lexicon succeeds in the near term if a production coordinator can:
- sign in,
- onboard or access a production,
- import or manage real cast/crew/schedule data,
- track contracts, scenes, gear, footage, and alerts,
- generate production documents,
- and prefer Lexicon over the spreadsheet for daily operational work.

---

## Now

### Milestone 1 — Production Beta Completion
**Window:** immediate
**Goal:** close the explicit Phase 1 gaps and make the product usable for a real show.

#### Deliverables
- Real auth on onboarding and production ownership
- Seed/import real Diaries S8 data
- Neo4j re-provisioning for cast graph workflows
- Custom domain
- Verification pass across the SPEC surface

#### Workstreams
- **Auth and ownership**
  Replace placeholder onboarding ownership with real authenticated users and production scoping.
- **Real production data**
  Move from seeded demo-ish data to actual S8 cast, crew, schedule, and template inputs.
- **Graph recovery**
  Restore Neo4j so graph-first features are operational instead of partially degraded.
- **Domain and launch surface**
  Configure the final beta domain and wire all generated links to it.
- **Verification pass**
  Prove Milestone 1 by testing workflows end-to-end, not just by code existing.

#### Exit Criteria
- Authenticated users can complete onboarding without placeholder ownership.
- Diaries S8 production data can be loaded and used in the current UI.
- Core production workflows complete without demo assumptions.
- Neo4j-backed features are live again or explicitly disabled in product messaging.

### Milestone 2 — Beta Hardening
**Window:** immediately after Milestone 1
**Goal:** make the product dependable enough for repeated internal use.

#### Deliverables
- CI for build, type-check, and tests
- Error monitoring
- Product analytics
- Mobile-responsive improvements for field use
- Cleanup of build warnings and validation workflow friction

#### Workstreams
- **Engineering trust**
  Add automated checks so every branch proves build, type-check, and tests.
- **Operational visibility**
  Instrument failures, route health, and key product events.
- **Field readiness**
  Tighten the mobile/tablet experience for coordinators and ACs using the app during production.
- **Build hygiene**
  Remove lint noise, clarify verification commands, and make validation reliable from a clean checkout.

#### Exit Criteria
- CI catches regressions before deploy.
- Runtime failures show up in monitoring instead of anecdotes.
- Critical production pages are usable on mobile/tablet.
- The team can trust the app for daily internal use.

---

## Next

### Milestone 3 — Diaries S8 Pilot
**Window:** after hardening
**Goal:** run Lexicon as a real operating surface for one active production.

#### Deliverables
- Real team pilot with Diaries S8
- Feedback loop on coordinator, AC, producer, and post-supervisor workflows
- Trigger and alert tuning
- Template/document workflow refinement from real documents

#### Workstreams
- **Workflow fit**
  Confirm the dashboard, calendar, cast, crew, gear, post, call sheet, and team flows reduce spreadsheet dependence.
- **Lexi usefulness**
  Tune prompts, triggers, and production-aware context so Lexi is actually useful under time pressure.
- **Template realism**
  Verify Word-native templates match what the team already uses and do not require retraining.

#### Exit Criteria
- At least one meaningful operating loop happens in Lexicon instead of Excel.
- The team prefers Lexicon for some daily operational tasks.
- Feedback is specific enough to guide the next product cycle.

### Milestone 4 — Search and Intelligence Honesty
**Window:** after pilot feedback is captured
**Goal:** close the gap between product promise and shipped intelligence.

#### Deliverables
- Real live web search in the main search path, or explicit de-scoping from beta claims
- Verification of graph + synthesis + enrichment flows
- Clear distinction between production intelligence, graph knowledge, and external enrichment

#### Workstreams
- **Search architecture**
  Decide whether live web search is a beta requirement or a post-pilot enhancement.
- **AI product clarity**
  Ensure Lexi features are framed by what is actually wired and reliable.

#### Exit Criteria
- Search behavior matches product messaging.
- External enrichment and live search are no longer conflated in docs or UI.

---

## Later

### Milestone 5 — Phase 2 Multi-Show Architecture
**Goal:** open Lexicon to multiple simultaneous productions without breaking the single-show model.

Implementation path is documented in `SPEC.md`. Full task decomposition in `MILESTONE_TASKLISTS.md` and `TICKETS.md`.

#### Exit Criteria
- One user can move across multiple productions cleanly.
- Shared crew can be reasoned about across shows.
- Conflicts appear as system-visible scheduling risk, not tribal knowledge.

### Milestone 6 — Platform Expansion
**Goal:** move from Eddie-team tool to repeatable product.

#### Potential Deliverables
- Self-serve onboarding
- API access
- Billing and stronger tenant isolation
- Cross-season continuity
- Team-level Telegram workflows

#### Gate
Do not start this milestone until the single-show pilot and multi-show architecture are both validated.

---

## Not Now

These are intentionally deferred so the roadmap stays on the critical path:
- Payroll, invoicing, or financial transactions
- Generic project-management features
- Broad API/platform work before the pilot proves value
- Deep collaboration niceties unless the pilot demands them
- Script-writing or narrative-authoring features

---

## Priority Stack

The canonical priority order and ticket dependencies live in `TICKETS.md`. At a glance:

1. Auth and production ownership (M1)
2. Real Diaries S8 data in the system (M1)
3. Neo4j recovery (M1)
4. Domain and verification (M1)
5. CI, monitoring, and analytics (M2)
6. Mobile/field usability (M2)
7. Diaries S8 pilot (M3)
8. Search honesty closure (M4)
9. Multi-show architecture (M5)
10. Platform expansion (M6)
