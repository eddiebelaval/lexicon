# Implementation Plan — Phase 2: Production UI

## Goal
Replace the Diaries S7 Excel spreadsheet with a production management UI inside Lexicon. This is the visual layer on top of the Phase 1 data foundation (migration, types, validation, API routes, Lexi intelligence, agent tools — all complete).

## Reference
- Phase 1 plan: `IMPLEMENTATION_PLAN.md` (9/9 steps DONE)
- Reference CSV: `~/Desktop/00-INBOX/DIA_S7_Prod Calendar 9.csv`
- Seed data: `seed/diaries-s7.ts` (Neo4j only — Supabase seed needed)

## Architecture

### Routing
Production views live under the existing universe:
```
app/universe/[id]/production/          → Production dashboard (overview)
app/universe/[id]/production/calendar/ → Calendar/schedule view
app/universe/[id]/production/cast/     → Cast board (contracts + completion)
app/universe/[id]/production/crew/     → Crew board (availability grid)
app/universe/[id]/production/layout.tsx → Shared nav tabs for production views
```

### Component Structure
```
components/production/
  production-nav.tsx          → Tab navigation (Dashboard | Calendar | Cast | Crew)
  production-dashboard.tsx    → Summary cards + upcoming scenes + bottlenecks
  calendar-view.tsx           → Week/month scene calendar
  calendar-day-cell.tsx       → Single day cell with scene chips
  scene-card.tsx              → Scene detail card (used in calendar + lists)
  scene-edit-dialog.tsx       → Create/edit scene modal
  cast-board.tsx              → Cast contract grid with completion checkboxes
  cast-row.tsx                → Single cast member row
  contract-status-badge.tsx   → Signed/Pending/DNC/etc badge
  crew-board.tsx              → Crew availability date grid
  crew-availability-cell.tsx  → Single crew/date cell (available/booked/OOO/dark)
  production-stats.tsx        → Summary stat cards (reusable)
```

### Data Flow
- All production data fetched via existing API routes (`/api/productions`, `/api/scenes`, etc.)
- Client-side fetching with `useEffect` + loading skeletons (matches existing pattern)
- Mutations via `fetch()` + POST/PUT/DELETE to API routes
- Lexi chat accessible from production views via existing `/universe/[id]/chat` with `mode=production`

---

## Implementation Steps

### Step 0: Supabase Production Seed Script
- **File:** `seed/seed-supabase-production.ts`
- **What:** Script that seeds Supabase with Diaries S7 production data (production, scenes, crew, contracts, availability) from `diaries-s7.ts` exported data
- **Why:** Neo4j seed exists but Supabase tables are empty. Need data to build against.
- **Package.json:** Add `"seed:supabase-production"` script
- **Verify:** `npx tsc --noEmit`

### Step 1: Production Layout + Navigation
- **Files:** `app/universe/[id]/production/layout.tsx`, `components/production/production-nav.tsx`
- **What:** Shared layout with tab navigation (Dashboard | Calendar | Cast | Crew) + back link to universe
- **Pattern:** Match existing universe page header style. Use lucide-react icons (LayoutDashboard, Calendar, Users, UserCog)
- **Verify:** `npx tsc --noEmit`

### Step 2: Production Dashboard Page
- **Files:** `app/universe/[id]/production/page.tsx`, `components/production/production-dashboard.tsx`, `components/production/production-stats.tsx`
- **What:** Overview page with:
  - Stat cards: total cast, signed contracts, scenes shot vs total, active crew count
  - Upcoming scenes list (next 7 days)
  - Incomplete contracts list (who's missing shoot/interview/pickup/payment)
  - Quick link to Lexi chat in production mode
- **Data:** `GET /api/productions?universeId=X`, then use productionId for scenes/contracts/crew
- **Verify:** `npx tsc --noEmit`, `npm run build`

### Step 3: Cast Board
- **Files:** `app/universe/[id]/production/cast/page.tsx`, `components/production/cast-board.tsx`, `components/production/cast-row.tsx`, `components/production/contract-status-badge.tsx`
- **What:** Table/grid view of all cast members showing:
  - Name (linked to entity in knowledge graph)
  - Contract status badge (Signed/Pending/Offer Sent/DNC/Email Sent/Declined)
  - Payment type (Daily/Flat)
  - Completion checklist: Shoot Done | INTV Done | PU Done | $ Done (interactive checkboxes)
  - Notes column
- **Mutations:** Clicking a checkbox → `PUT /api/cast-contracts/[id]` to toggle boolean
- **Data:** `GET /api/cast-contracts?productionId=X`
- **Verify:** `npx tsc --noEmit`

### Step 4: Crew Availability Board
- **Files:** `app/universe/[id]/production/crew/page.tsx`, `components/production/crew-board.tsx`, `components/production/crew-availability-cell.tsx`
- **What:** Grid with crew members as rows and dates as columns (Mon-Fri, week view):
  - Cell colors: green=available, blue=booked, red=OOO, gray=dark, yellow=holding
  - Cell tooltip shows notes
  - Click cell to cycle status or open edit dialog
  - Week navigation (prev/next)
- **Data:** `GET /api/crew?productionId=X` + `GET /api/crew-availability?productionId=X&startDate=Y&endDate=Z`
- **Mutations:** `PUT /api/crew-availability/[id]` or `POST /api/crew-availability` for new entries
- **Verify:** `npx tsc --noEmit`

### Step 5: Calendar View
- **Files:** `app/universe/[id]/production/calendar/page.tsx`, `components/production/calendar-view.tsx`, `components/production/calendar-day-cell.tsx`, `components/production/scene-card.tsx`
- **What:** Week or month calendar showing scenes:
  - Each day cell shows scene chips (title + cast names + location)
  - Color-coded by status (scheduled=blue, shot=green, cancelled=red, postponed=yellow, self_shot=purple)
  - Click scene chip to expand details (full cast, crew assignments, equipment notes)
  - Week/month toggle + prev/next navigation
- **Data:** `GET /api/scenes?productionId=X&startDate=Y&endDate=Z`
- **Verify:** `npx tsc --noEmit`

### Step 6: Scene Edit Dialog
- **Files:** `components/production/scene-edit-dialog.tsx`
- **What:** Modal for creating/editing scenes:
  - Fields: scene number, title, description, scheduled date/time, location, location details, status, equipment notes, self-shot toggle
  - Cast assignment: multi-select from cast entities (fetched from `/api/entities?universeId=X&type=character`)
  - Crew assignment: assign crew members to scene (uses scene_assignments API)
- **Mutations:** `POST /api/scenes` or `PUT /api/scenes/[id]`
- **Verify:** `npx tsc --noEmit`

### Step 7: Universe Page Integration
- **Files:** Modify `app/universe/[id]/page.tsx`
- **What:** Add a "Production" view mode alongside Graph and Wiki in the existing view toggle
- **Pattern:** Existing toggle uses `viewMode` state with 'graph' | 'wiki'. Add 'production' which navigates to `/universe/[id]/production/`
- **Verify:** `npx tsc --noEmit`, `npm run build`

### Step 8: Build Verification + BUILDING.md Update
- **What:** Full build pass, type check, update BUILDING.md with Phase 2 work
- **Verify:** `npm run build && npx tsc --noEmit`
- **Commit convention:** `[Stage 9: Launch Prep] feat: production management UI — calendar, cast board, crew board`

---

## Dependencies
- All Phase 1 steps complete (confirmed)
- Existing UI components: button, dialog, input, label, progress, select, textarea (shadcn/ui)
- Existing patterns: lucide-react icons, Tailwind dark mode, fetch + loading skeletons
- Supabase tables must exist (migration `20260315000001_production_schema.sql` — not yet applied to live DB)

## Risks & Mitigations
- **Neo4j/Supabase may be hibernated:** Build all UI against types and mock data. Seed script ready for when services come back.
- **Scope creep:** No drag-to-reschedule, no real-time updates, no mobile optimization in this phase. Those are Phase 3.
- **Cast entity ID resolution:** Cast board shows entity IDs from contracts. Need to resolve to names via Neo4j entity lookup. May add a client-side cache or batch lookup endpoint.

## NOT in Phase 2 (deferred to Phase 3)
- Drag-to-reschedule on calendar
- Real-time collaborative editing
- Upload/logistics tracking UI
- Timeline visualization
- Mobile-responsive production views
- Production-specific notifications
- Bulk operations (mass contract update, bulk scene create)
