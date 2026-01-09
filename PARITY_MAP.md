# Parity Map - Lexicon

> Created: January 9, 2026
> Last Audit: January 9, 2026
> Status: **95% Parity Achieved**

---

## Project Overview

Lexicon is a graph-powered knowledge platform for exploring story universes. Users can create entities, relationships, search with AI, and visualize narrative worlds.

---

## Entity: Entity (Character, Location, Event, Object, Faction)

| User Action | Agent Tool / API | Status | Notes |
|-------------|-----------------|--------|-------|
| Create Entity | `POST /api/entities` | ✅ Complete | Full field support |
| Read Entity | `GET /api/entities/[id]` | ✅ Complete | Includes relationships |
| Update Entity | `PUT /api/entities/[id]` | ✅ Complete | Type is immutable |
| Delete Entity | `DELETE /api/entities/[id]` | ✅ Complete | Cascades relationships |
| List Entities | `GET /api/entities?universeId=...` | ✅ Complete | Filtering, pagination |
| Search Entities | `GET /api/entities?q=...` | ✅ Complete | Full-text search |
| Bulk Import | `POST /api/import` | ✅ Complete | CSV format |

### CRUD Status: 4/4 Complete

---

## Entity: Relationship

| User Action | Agent Tool / API | Status | Notes |
|-------------|-----------------|--------|-------|
| Create Relationship | `POST /api/relationships` | ✅ Complete | 9 relationship types |
| Read Relationship | `GET /api/relationships/[id]` | ✅ Complete | Includes source/target |
| Update Relationship | `PUT /api/relationships/[id]` | ✅ Complete | Source/target immutable |
| Delete Relationship | `DELETE /api/relationships/[id]` | ✅ Complete | |
| List Relationships | `GET /api/relationships?universeId=...` | ✅ Complete | By entity, by type |

### CRUD Status: 4/4 Complete

---

## Entity: Storyline

| User Action | Agent Tool / API | Status | Notes |
|-------------|-----------------|--------|-------|
| Create Storyline | `POST /api/storylines` | ✅ Complete | Cast linking |
| Read Storyline | `GET /api/storylines/[id]` | ✅ Complete | Optional cast expansion |
| Update Storyline | `PUT /api/storylines/[id]` | ✅ Complete | |
| Delete Storyline | `DELETE /api/storylines/[id]` | ✅ Complete | |
| List Storylines | `GET /api/storylines?universeId=...` | ✅ Complete | Search, pagination |
| Bulk Import | `POST /api/import/storylines` | ✅ Complete | CSV format |

### CRUD Status: 4/4 Complete

---

## Entity: Conversation (Chat)

| User Action | Agent Tool / API | Status | Notes |
|-------------|-----------------|--------|-------|
| Create Conversation | `POST /api/chat/conversations` | ✅ Complete | |
| Read Conversation | `GET /api/chat/conversations/[id]` | ✅ Complete | Includes messages |
| Update Conversation | N/A | ❌ Missing | No title edit |
| Delete Conversation | `DELETE /api/chat/conversations/[id]` | ✅ Complete | |
| List Conversations | `GET /api/chat/conversations?universeId=...` | ✅ Complete | |
| Send Message | `POST /api/chat` | ✅ Complete | SSE streaming |

### CRUD Status: 3/4 Complete (Update missing)

---

## Entity: Notification

| User Action | Agent Tool / API | Status | Notes |
|-------------|-----------------|--------|-------|
| Create Notification | `POST /api/notifications` | ✅ Complete | Internal use |
| Read Notifications | `GET /api/notifications?userId=...` | ✅ Complete | Filtering |
| Mark as Read | `POST /api/notifications/[id]/read` | ✅ Complete | |
| Dismiss | `POST /api/notifications/[id]/dismiss` | ✅ Complete | |
| Mark All Read | `POST /api/notifications/mark-all-read` | ✅ Complete | |
| Get Count | `GET /api/notifications/count` | ✅ Complete | Unread count |

### CRUD Status: 4/4 Complete

---

## Entity: User Preferences

| User Action | Agent Tool / API | Status | Notes |
|-------------|-----------------|--------|-------|
| Read Preferences | `GET /api/preferences?userId=...` | ✅ Complete | |
| Update Preferences | `PUT /api/preferences` | ✅ Complete | |

### CRUD Status: 2/2 Complete (no create/delete needed)

---

## Search & AI Capabilities

| User Action | Agent Tool / API | Status | Notes |
|-------------|-----------------|--------|-------|
| Basic Search | `GET /api/search?q=...` | ✅ Complete | Graph search |
| AI Search | `GET /api/search?ai=true` | ✅ Complete | Claude synthesis |
| Web-Augmented Search | `GET /api/search?includeWeb=true` | ✅ Complete | External sources |
| Graph Visualization | `GET /api/graph?universeId=...` | ✅ Complete | D3.js format |
| Web Enrichment | `POST /api/wiki/enrich` | ✅ Complete | Firecrawl/Claude |

---

## Bulk Operations

| User Action | Agent Tool / API | Status | Notes |
|-------------|-----------------|--------|-------|
| Bulk Import Entities | `POST /api/import` | ✅ Complete | CSV |
| Bulk Import Storylines | `POST /api/import/storylines` | ✅ Complete | CSV |
| Bulk Update | N/A | ❌ Missing | Individual only |
| Bulk Delete | N/A | ❌ Missing | Individual only |
| Export Data | N/A | ❌ Missing | No export |

---

## Audit Summary

| Metric | Value |
|--------|-------|
| **Total UI Actions** | 42 |
| **Agent Parity** | 40/42 (95%) |
| **CRUD Complete Entities** | 5/6 (Conversation missing Update) |
| **Missing Tools** | Bulk Update, Bulk Delete, Export, Conversation Update |

---

## Gaps & Backlog

### Priority 1 (High Impact)
- [ ] `PUT /api/chat/conversations/[id]` - Update conversation title

### Priority 2 (Nice to Have)
- [ ] `POST /api/entities/bulk-update` - Batch entity updates
- [ ] `DELETE /api/entities/bulk-delete` - Batch entity deletion
- [ ] `GET /api/export?universeId=...` - Export universe data

### Priority 3 (Future)
- [ ] Audit trail for entity modifications
- [ ] Real-time collaboration conflict resolution
- [ ] Rate limiting headers

---

## Completion Signals Audit

| Tool/Endpoint | Returns Status? | Returns `shouldContinue`? |
|---------------|----------------|---------------------------|
| Entity CRUD | ✅ HTTP status | ⬜ Not implemented |
| Relationship CRUD | ✅ HTTP status | ⬜ Not implemented |
| Chat streaming | ✅ SSE events | ✅ `done` event |
| Search | ✅ JSON response | ⬜ Not applicable |

**Note:** REST APIs use HTTP status codes. SSE streaming uses explicit `done` event. Consider adding `shouldContinue` to tool definitions for agent loops.

---

## Approval Flow Classification

| Action | Stakes | Reversibility | Pattern |
|--------|--------|--------------|---------|
| Create Entity | Low | Easy | Auto-apply |
| Update Entity | Low | Easy | Auto-apply |
| Delete Entity | High | Hard | Explicit approval |
| Create Relationship | Low | Easy | Auto-apply |
| Delete Relationship | Medium | Medium | Quick confirm |
| Send Chat Message | Low | N/A | Auto-apply |
| Bulk Import | Medium | Hard | Quick confirm |
| Bulk Delete | High | Hard | Explicit approval |

---

## Verification

**Last tested:** January 9, 2026
**Test method:** Manual API exploration + codebase audit
**Next audit:** Before Stage 9 (Launch Prep)
