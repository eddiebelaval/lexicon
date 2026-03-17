# Lexicon - Codex Instructions

## Project Overview
Lexicon is a graph-powered knowledge platform for story universes. Think "Wikipedia + Perplexity for narrative worlds."

**Core Value Prop:** Search your narrative world like a wiki. Get answers synthesized from your knowledge graph + the live web.

## Tech Stack
- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Graph DB:** Neo4j Aura (managed) - stores entities and relationships
- **User DB:** PostgreSQL via Supabase - stores users, auth, universes metadata
- **AI:** Codex API - natural language search, synthesis, web augmentation
- **Graph Viz:** D3.js - interactive visualization of knowledge graphs

## Architecture Principles

### Database Split
- **Neo4j** = graph data (entities, relationships) - optimized for traversal
- **PostgreSQL** = user data (auth, billing, universe metadata) - standard CRUD

### API Routes Pattern
```
/api/entities     → Neo4j operations
/api/relationships → Neo4j operations
/api/search       → Codex API + Neo4j + Web
/api/universes    → PostgreSQL operations
```

### Search Flow
1. Parse user query with Codex
2. Execute Neo4j graph queries
3. Optionally fetch web results
4. Synthesize answer with Codex
5. Return with source citations

## Key Files

### Core Library
- `lib/neo4j.ts` - Neo4j driver connection and helpers
- `lib/Codex.ts` - Codex API wrapper
- `lib/search.ts` - Search orchestration (graph + web + synthesis)
- `lib/db.ts` - PostgreSQL/Prisma client

### Types
- `types/index.ts` - All TypeScript interfaces (Entity, Relationship, Universe, User)

### Seed Data
- `seed/three-musketeers.ts` - Prototype universe with 30+ entities and relationships

## Entity Types
- `character` - People in the story
- `location` - Places
- `event` - Things that happened
- `object` - Important items
- `faction` - Groups, organizations

## Relationship Types
- `knows` - Awareness/acquaintance
- `loves` - Romantic relationship
- `opposes` - Conflict/antagonism
- `works_for` - Employment/service
- `family_of` - Blood/marriage relation
- `located_at` - Physical presence
- `participated_in` - Event involvement
- `possesses` - Ownership
- `member_of` - Group affiliation

## Development Commands
```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run seed       # Seed Three Musketeers data to Neo4j
npm run test       # Run unit tests
npm run test:e2e   # Run Playwright tests
```

## Neo4j Query Patterns

### Find entity by name
```cypher
MATCH (e:Entity {universeId: $universeId})
WHERE e.name =~ '(?i).*' + $search + '.*'
   OR ANY(alias IN e.aliases WHERE alias =~ '(?i).*' + $search + '.*')
RETURN e
```

### Get relationships for entity
```cypher
MATCH (e:Entity {id: $entityId})-[r]-(connected:Entity)
RETURN e, r, connected
```

### Find path between two entities
```cypher
MATCH path = shortestPath(
  (a:Entity {id: $sourceId})-[*..5]-(b:Entity {id: $targetId})
)
RETURN path
```

## Testing Requirements
- Unit tests for search orchestration logic
- Integration tests for Neo4j queries
- E2E tests for critical flows (create universe, add entity, search)

## Common Gotchas
1. Neo4j driver is server-only - don't import in client components
2. D3.js needs `'use client'` directive
3. Always sanitize user input before Neo4j queries (injection risk)
4. Graph visualization can be slow with 1000+ nodes - implement pagination

## Part of ID8Labs Writer Ecosystem
Lexicon will eventually integrate with ID8Composer for seamless worldbuilding-to-writing workflow.
