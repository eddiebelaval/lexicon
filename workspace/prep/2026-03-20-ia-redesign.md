# Lexicon IA Redesign: Production-First

## The Problem

Lexicon was built as a "knowledge graph platform" (Graph, Wiki, AI Search) with a production module bolted on as a tab inside a universe workspace. But production management IS the product for Diaries S8. The current UX:

- Takes 4 clicks to reach production (landing > dashboard > universe > production)
- Hides the useful stuff (cast, crew, calendar) behind a scrollable tab bar inside a tab
- Sells Graph and Wiki on the landing page when the team needs a production cockpit
- No sidebar. Everything is tabs-in-tabs
- The "universe" concept is a developer abstraction, not a user concept

## The Goal

A TV production coordinator opens Lexicon, sees the whole show at a glance, and can act on anything in two clicks. When they change a shoot location at 4pm, the call sheet, crew assignments, and notifications cascade automatically. They never open Excel again.

## Design Reference: Claude.ai

Claude's three-panel layout maps directly to what Lexicon needs:

| Claude | Lexicon |
|--------|---------|
| Left sidebar (conversations) | Left sidebar (production navigation) |
| Main content (chat) | Main content (active page: dashboard, calendar, cast, etc.) |
| Right panel (artifacts) | Right drawer (Lexi chat, contextual to current page) |
| Warm beige/cream bg | Warm dark mode (production teams work late, dark is easier on eyes) |
| Terracotta accent (#C15F3C) | VHS orange (already close: #ef6f2e) |
| Near-invisible borders | Background shifts for structure, not lines |
| One accent color, everything else neutral | Same: orange is the only color. Status uses BLUF health colors. |

## New Route Structure

```
/                          → Redirect to /production (if authenticated)
/login                     → Email OTP login
/production                → Dashboard (BLUF: KPIs, alerts, Lexi brief)
/production/calendar       → Shoot calendar
/production/cast           → Cast board with contracts
/production/crew           → Crew board with availability
/production/gear           → Equipment lifecycle
/production/post           → Post-production assets
/production/call-sheet     → Today's call sheet (or date picker)
/production/team           → Crew Telegram setup
/production/episodes       → Episode tracker
/production/knowledge      → Cast bios, location details, show bible (replaces Wiki)
/production/graph          → Relationship visualization (cast connections)
/production/settings       → Show settings, notifications, asset types
/production/chat           → Full Lexi chat (history, search)
/onboard                   → Lexi wizard (first-time setup)
```

No more /universe/[id] nesting. One show, one sidebar, one click to anything.

Multi-show support (later): dropdown in sidebar header to switch shows. Not a separate page.

## Three-Panel Layout

```
+-------------------+----------------------------------+-------------------+
|                   |                                  |                   |
|   SIDEBAR         |      MAIN CONTENT                |   LEXI DRAWER     |
|   (240px)         |      (flex-1, scrollable)        |   (360px, opt.)   |
|                   |                                  |                   |
|  [Show Logo/Name] |  [Page Header + Actions]         | [Lexi Avatar]     |
|  [Show Selector]  |                                  | [Context Brief]   |
|                   |  [Page Content]                  | [Chat Messages]   |
|  --- NAV ---      |  - Dashboard: BLUF layout        | [Input]           |
|  Dashboard        |  - Calendar: grid/list           |                   |
|  Calendar         |  - Cast: card grid or table      |                   |
|  Cast             |  - Crew: card grid               |                   |
|  Crew             |  - etc.                          |                   |
|  Gear             |                                  |                   |
|  Post             |                                  |                   |
|  Call Sheet       |                                  |                   |
|  Team             |                                  |                   |
|  Episodes         |                                  |                   |
|                   |                                  |                   |
|  --- EXPLORE ---  |                                  |                   |
|  Knowledge        |                                  |                   |
|  Graph            |                                  |                   |
|                   |                                  |                   |
|  --- META ---     |                                  |                   |
|  Settings         |                                  |                   |
|  [Lexi Status]    |                                  |                   |
+-------------------+----------------------------------+-------------------+
```

### Sidebar Behavior
- Desktop (>1024px): Always visible, 240px width
- Tablet (768-1024px): Collapsed to icons only (48px), expand on hover
- Mobile (<768px): Hidden, hamburger menu trigger, overlays content

### Lexi Drawer Behavior
- Default: Closed (main content gets full width)
- Trigger: "Ask Lexi" button in page header, or keyboard shortcut (Cmd+L)
- Opens: Slides in from right, 360px, pushes main content
- Context-aware: Opens with production context for current page pre-loaded
- Mobile: Full-screen overlay with back button

## Design System: "Warm Dark"

Adapting Claude's warmth to Lexicon's dark-mode production environment.

### Color Tokens

```css
:root {
  /* Surfaces (warm dark, NOT cold grey) */
  --bg-app: #1a1815;           /* Deepest: app background */
  --bg-sidebar: #1f1d19;       /* Sidebar */
  --bg-content: #23211d;       /* Main content area */
  --bg-card: #2b2924;          /* Cards, elevated surfaces */
  --bg-card-hover: #33312b;    /* Card hover */
  --bg-input: #1a1815;         /* Input fields */
  --bg-overlay: rgba(0,0,0,0.6); /* Modal/drawer backdrop */

  /* Text */
  --text-primary: #ede9e3;     /* Warm off-white (NOT pure white) */
  --text-secondary: #9a9590;   /* Warm grey */
  --text-tertiary: #6b6660;    /* Muted warm grey */
  --text-inverse: #1a1815;     /* Text on light backgrounds */

  /* Accent: VHS Orange (close to Claude's terracotta) */
  --accent: #ef6f2e;           /* Primary accent */
  --accent-hover: #f58442;     /* Hover state */
  --accent-muted: rgba(239, 111, 46, 0.12); /* Subtle backgrounds */
  --accent-text: #f5a574;      /* Lighter orange for text on dark */

  /* Borders (near-invisible, Claude-style) */
  --border: rgba(255, 255, 255, 0.06);    /* Default */
  --border-hover: rgba(255, 255, 255, 0.10); /* Hover */
  --border-strong: rgba(255, 255, 255, 0.15); /* Emphasized */

  /* Status (BLUF health system) */
  --healthy: #22c55e;
  --warning: #f59e0b;
  --critical: #ef4444;
  --healthy-soft: rgba(34, 197, 94, 0.10);
  --warning-soft: rgba(245, 158, 11, 0.12);
  --critical-soft: rgba(239, 68, 68, 0.12);

  /* Shadows (barely perceptible, Claude-style) */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.15);
  --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.12);
}
```

### Typography
- Keep Geist Sans (body) + Geist Mono (data) — production data needs sans-serif clarity
- Headers: 600 weight, tight tracking (-0.02em)
- Body: 400 weight, 14px base
- Data/numbers: Geist Mono, tabular-nums, 13px
- Status labels: 11px uppercase, 600 weight, 0.06em letter-spacing

### Component Style
- Border radius: 8px default, 12px for cards, 16px for composer/input
- Borders: Near-invisible (rgba white at 6%). Structure from bg-color shifts.
- Shadows: Minimal. `0 1px 3px rgba(0,0,0,0.15)` max.
- Hover: Background shift + subtle border reveal (not color change)
- Active nav item: Orange left border (3px) + accent-muted background

## Sidebar Navigation Detail

```tsx
// Navigation items grouped by function
const NAV_GROUPS = [
  {
    label: null, // No label for primary group
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/production' },
      { icon: Calendar, label: 'Calendar', href: '/production/calendar' },
      { icon: Users, label: 'Cast', href: '/production/cast', badge: '12' },
      { icon: UserCog, label: 'Crew', href: '/production/crew' },
      { icon: Camera, label: 'Gear', href: '/production/gear' },
      { icon: Film, label: 'Post', href: '/production/post' },
      { icon: ClipboardList, label: 'Call Sheet', href: '/production/call-sheet' },
      { icon: MessageSquare, label: 'Team', href: '/production/team' },
      { icon: Tv, label: 'Episodes', href: '/production/episodes' },
    ]
  },
  {
    label: 'Explore',
    items: [
      { icon: BookOpen, label: 'Knowledge', href: '/production/knowledge' },
      { icon: GitBranch, label: 'Graph', href: '/production/graph' },
    ]
  },
  {
    label: null,
    items: [
      { icon: Settings, label: 'Settings', href: '/production/settings' },
    ]
  }
];
```

### Sidebar Header
- Show name (e.g., "Diaries S8") with season badge
- Show status pill (Pre-production / Active / Post / Wrapped)
- Dropdown to switch shows (future: multi-show)

### Sidebar Footer
- Lexi status indicator (green dot = connected, amber = processing)
- "Ask Lexi" quick action
- User avatar + role badge

## Page-by-Page Treatment

### Dashboard (/)
Already built with BLUF. Keep KPIRow, BLUFAlert, LexiBriefCard, CollapsibleSections.
Add: "Today's shoot" card at top if there's a scene scheduled today.

### Calendar
Keep existing CalendarView. Add: crew availability swimlanes below the calendar grid.

### Cast
Two view modes (toggle in page header):
1. **Card grid** (default): Headshot placeholder + name + status pill + completion ring. Visual, scannable.
2. **Table view**: Current cast-board table (for detailed contract work).

### Crew
Card grid: Name, role badge, Telegram status dot, availability for next 7 days (mini heatmap).

### Call Sheet
Default to TODAY's call sheet (not a picker). Big, clear, print-friendly layout.
Call time, location, cast list, crew assignments, department notes.
"Share" button generates a Telegram push to all assigned crew.

### Knowledge (replaces Wiki)
Cast bios, location details, show bible entries. Searchable. Card-based.
This is where the Neo4j entity data becomes useful: relationship context for cast members.

### Graph (replaces standalone Graph view)
Cast relationship visualization. D3 force graph stays.
But now it's a TOOL, not a destination. You open it to see "who knows who" or "who's connected to this location."

## Migration Strategy

### Phase 0: New shell (sidebar + content area)
- New root layout with sidebar component
- Move /universe/[id]/production/* routes to /production/*
- Redirect old routes to new ones
- Keep all existing page components (just re-route them)

### Phase 1: Design system swap
- Replace hardcoded hex values with new warm-dark tokens
- Unify the dual color systems (VHS + legacy Lexicon)
- Apply Claude-style borders (near-invisible) and shadows (minimal)

### Phase 2: Sidebar navigation
- Build Sidebar component with nav groups, active states, collapse behavior
- Build Lexi drawer (right panel)
- Mobile responsive: hamburger + overlay

### Phase 3: Page treatments
- Cast card grid view
- Crew card grid view
- Call sheet "today" default
- Knowledge page (wiki content in new layout)

### Phase 4: Polish
- Transitions and micro-interactions
- Loading skeletons per-page
- Print stylesheet for call sheets
- Mobile viewport testing

## Files to Create

| File | Purpose |
|------|---------|
| `app/production/layout.tsx` | New root production layout (sidebar + content + drawer) |
| `components/shell/sidebar.tsx` | Sidebar navigation component |
| `components/shell/sidebar-nav.tsx` | Nav items with grouping |
| `components/shell/sidebar-header.tsx` | Show name, status, switcher |
| `components/shell/sidebar-footer.tsx` | Lexi status, user info |
| `components/shell/lexi-drawer.tsx` | Right-side Lexi chat panel |
| `components/shell/mobile-nav.tsx` | Hamburger trigger + overlay |
| `components/shell/page-header.tsx` | Shared page header (title + actions + Lexi trigger) |
| `app/warm-dark.css` | New design system tokens |
| `app/production/page.tsx` | Dashboard (move from universe route) |
| `app/production/calendar/page.tsx` | Calendar (move) |
| `app/production/cast/page.tsx` | Cast (move) |
| `app/production/crew/page.tsx` | Crew (move) |
| `app/production/gear/page.tsx` | Gear (move) |
| `app/production/post/page.tsx` | Post (move) |
| `app/production/call-sheet/page.tsx` | Call sheet (move) |
| `app/production/team/page.tsx` | Team (move) |
| `app/production/episodes/page.tsx` | Episodes (new) |
| `app/production/knowledge/page.tsx` | Knowledge base (new, replaces wiki) |
| `app/production/graph/page.tsx` | Graph viz (move from universe) |
| `app/production/settings/page.tsx` | Settings (new) |
| `app/production/chat/page.tsx` | Full Lexi chat (move from universe/chat) |

## Files to Modify

| File | Change |
|------|--------|
| `app/layout.tsx` | Remove old theme provider setup if needed |
| `app/page.tsx` | Redirect to /production (auth check) or /login |
| `app/globals.css` | Import warm-dark.css, remove old token conflicts |
| `tailwind.config.ts` | Update color tokens to match warm-dark system |
| `middleware.ts` | Add auth redirect: / → /production or /login |

## Files to Remove (after migration)

| File | Why |
|------|-----|
| `app/universe/[id]/page.tsx` | Replaced by /production/* routes |
| `app/universe/[id]/production/layout.tsx` | Replaced by new production layout |
| `app/universe/[id]/production/*/page.tsx` | All moved to /production/* |
| `app/universe/[id]/chat/page.tsx` | Moved to /production/chat |
| `app/dashboard/page.tsx` | No longer needed (sidebar handles show switching) |
| `components/production/production-nav.tsx` | Replaced by sidebar |
| `components/production/production-header.tsx` | Replaced by shell/page-header |

## What We're NOT Changing

- All production components (CastBoard, CrewBoard, CalendarView, etc.) stay as-is
- All BLUF components stay
- All API routes stay
- All lib/ code stays
- All Supabase schema stays
- Lexi's tool system, RBAC, Telegram bot stay
- Tests stay (may need route updates in test fixtures)

## Success Criteria

1. Coordinator opens lexicon.id8labs.app → sees the dashboard in 1 click
2. Every production page is reachable from the sidebar in 1 click
3. Lexi is available on every page via the drawer (Cmd+L or click)
4. Mobile: all pages work at 375px, sidebar collapses to hamburger
5. No raw entity IDs visible anywhere
6. Call sheet is shareable to Telegram in one action
7. The whole thing feels warm, not clinical
