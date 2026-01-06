# Lexicon

**Wikipedia + Perplexity for story universes.**

Search your narrative world like a wiki. Get answers synthesized from your knowledge graph + the live web.

## Part of ID8Labs Writer Ecosystem

Lexicon is designed to integrate with ID8Composer for seamless worldbuilding-to-writing workflow.

## Features (V1)

- **Entity Management** — Create characters, locations, events, objects, and factions
- **Relationship Mapping** — Connect entities with typed, contextual relationships
- **AI-Powered Search** — Natural language queries synthesized by Claude
- **Graph Visualization** — Interactive D3.js visualization of your universe
- **CSV Import** — Bulk import entities from spreadsheets

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Graph DB | Neo4j Aura (managed) |
| User DB | Supabase (PostgreSQL) |
| AI | Claude API |
| Graph Viz | D3.js |

## Getting Started

### Prerequisites

- Node.js 20+
- Neo4j Aura account (or local Neo4j instance)
- Supabase project
- Anthropic API key

### Setup

1. Clone and install:
   ```bash
   git clone https://github.com/id8labs/lexicon.git
   cd lexicon
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Fill in your credentials in `.env.local`

4. Run development server:
   ```bash
   npm run dev
   ```

5. (Optional) Seed the Three Musketeers demo universe:
   ```bash
   npm run seed
   ```

## Development Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # Run ESLint
npm run type-check # TypeScript check
npm run test       # Run unit tests
npm run test:e2e   # Run Playwright tests
npm run seed       # Seed demo data
```

## Project Structure

```
lexicon/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard
│   └── universe/[id]/     # Universe workspace
├── components/            # React components
│   ├── graph/            # D3.js visualization
│   ├── search/           # Search UI
│   ├── entities/         # Entity management
│   └── ui/               # shadcn/ui components
├── lib/                   # Core libraries
│   ├── neo4j.ts          # Graph database
│   ├── claude.ts         # AI integration
│   └── search.ts         # Search orchestration
├── types/                 # TypeScript interfaces
├── seed/                  # Demo data
└── tests/                 # Test files
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 FRONTEND                         │
│           Next.js 15 + TypeScript               │
│           Tailwind + shadcn/ui                  │
│           D3.js (graph visualization)           │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│                 BACKEND                          │
│              Next.js API Routes                  │
└───────┬─────────────┬─────────────┬─────────────┘
        │             │             │
┌───────▼───────┐ ┌───▼───┐ ┌──────▼──────┐
│    Neo4j      │ │Supabase│ │   Claude    │
│  (Graph DB)   │ │(Users) │ │    API      │
└───────────────┘ └────────┘ └─────────────┘
```

## Search Flow

1. Parse user query with Claude
2. Execute Neo4j graph queries
3. Optionally fetch web results
4. Synthesize answer with Claude
5. Return with source citations

## Pipeline Status

See [PIPELINE_STATUS.md](./PIPELINE_STATUS.md) for current development stage.

## License

MIT © ID8Labs

---

*"All for one, and one for all!"* 🗡️
