# Citation Components Usage Guide

## Overview

The citation system consists of two main components:

1. **CitationChip** - Inline clickable citations that appear in AI responses
2. **EntityPreview** - Slide-in panel that shows entity details when a citation is clicked

## Basic Usage

```tsx
'use client';

import { useState } from 'react';
import { CitationChip, EntityPreview } from '@/components/chat';
import type { Citation } from '@/types/chat';

export function ChatResponse() {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // Example citations from AI response
  const citations: Citation[] = [
    {
      id: '1',
      type: 'entity',
      label: 'D\'Artagnan',
      entityId: 'entity-123',
      entityType: 'character',
    },
    {
      id: '2',
      type: 'entity',
      label: 'Paris',
      entityId: 'entity-456',
      entityType: 'location',
    },
    {
      id: '3',
      type: 'web',
      label: 'Historical Context',
      url: 'https://example.com/three-musketeers',
      title: 'The Three Musketeers - Wikipedia',
    },
  ];

  const handleCitationClick = (citation: Citation) => {
    if (citation.entityId) {
      setSelectedEntityId(citation.entityId);
    }
    // Web citations automatically open in new tab
  };

  return (
    <div>
      {/* AI response text with inline citations */}
      <p className="text-zinc-100">
        D'Artagnan{' '}
        <CitationChip
          citation={citations[0]}
          index={1}
          onClick={handleCitationClick}
        />
        {' '}arrived in Paris{' '}
        <CitationChip
          citation={citations[1]}
          index={2}
          onClick={handleCitationClick}
        />
        {' '}seeking adventure in the 17th century{' '}
        <CitationChip
          citation={citations[2]}
          index={3}
          onClick={handleCitationClick}
        />.
      </p>

      {/* Entity preview panel */}
      {selectedEntityId && (
        <EntityPreview
          entityId={selectedEntityId}
          onClose={() => setSelectedEntityId(null)}
        />
      )}
    </div>
  );
}
```

## Citation Types

### Entity Citations
```tsx
const entityCitation: Citation = {
  id: '1',
  type: 'entity',
  label: 'Character Name',
  entityId: 'entity-123',
  entityType: 'character', // character | location | event | object | faction
};
```

Shows an icon based on entity type and opens EntityPreview on click.

### Relationship Citations
```tsx
const relationshipCitation: Citation = {
  id: '2',
  type: 'relationship',
  label: 'Works for relationship',
  relationshipId: 'rel-456',
  fromEntity: 'D\'Artagnan',
  toEntity: 'King Louis XIII',
  relationshipType: 'works_for',
};
```

Shows a link icon and can be used to navigate to relationship details.

### Web Citations
```tsx
const webCitation: Citation = {
  id: '3',
  type: 'web',
  label: 'Wikipedia',
  url: 'https://wikipedia.org/wiki/Three_Musketeers',
  title: 'The Three Musketeers - Wikipedia',
  snippet: 'A historical adventure novel...',
};
```

Shows an external link icon and opens URL in new tab on click.

## Styling

Components use the VHS orange theme by default:

- **Primary color**: `vhs` (HSL 17 85% 62%)
- **Background**: `surface-primary` (HSL 240 4% 4%)
- **Text**: `zinc-100` / `zinc-400`

All colors are customizable via Tailwind config.

## Accessibility Features

Both components include:

- ✅ Full keyboard navigation
- ✅ ARIA labels and roles
- ✅ Focus indicators
- ✅ Screen reader support
- ✅ Semantic HTML

### Keyboard Shortcuts

- **Tab** - Navigate between citations
- **Enter/Space** - Activate citation
- **Escape** - Close EntityPreview (TODO: implement)

## Performance Considerations

### CitationChip
- Pure functional component
- No internal state
- Minimal re-renders
- Icon lazy-loading based on type

### EntityPreview
- Lazy loads entity data on mount
- Caches relationship data
- Skeleton loading state
- Optimized animations via CSS

## Advanced Usage

### Custom Citation Handler
```tsx
function ChatInterface() {
  const handleCitationClick = (citation: Citation) => {
    // Custom analytics
    trackEvent('citation_clicked', {
      type: citation.type,
      entityId: citation.entityId,
    });

    // Custom routing
    if (citation.type === 'entity') {
      router.push(`/entities/${citation.entityId}`);
    }
  };

  return (
    <CitationChip
      citation={citation}
      index={1}
      onClick={handleCitationClick}
    />
  );
}
```

### Pre-fetching Entity Data
```tsx
function OptimizedChat() {
  const { prefetch } = useEntityQuery();

  const handleCitationHover = (citation: Citation) => {
    if (citation.entityId) {
      prefetch(citation.entityId);
    }
  };

  return (
    <button
      onMouseEnter={() => handleCitationHover(citation)}
      onClick={() => handleCitationClick(citation)}
    >
      <CitationChip citation={citation} index={1} />
    </button>
  );
}
```

## API Integration

EntityPreview expects these API endpoints:

```
GET /api/entities/:id
- Returns Entity object

GET /api/entities/:id/relationships
- Returns Relationship[] array
```

Example API response:
```json
{
  "success": true,
  "data": {
    "id": "entity-123",
    "name": "D'Artagnan",
    "type": "character",
    "description": "A young swordsman from Gascony...",
    "status": "active",
    "aliases": ["Charles de Batz-Castelmore"],
    "imageUrl": "/images/dartagnan.jpg",
    "metadata": {
      "birthYear": "1611",
      "nationality": "French"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-08T00:00:00Z"
  }
}
```

## Testing

### Unit Tests
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CitationChip } from './CitationChip';

test('renders citation with correct number', () => {
  const citation = { type: 'entity', label: 'Test', entityId: '123' };
  render(<CitationChip citation={citation} index={1} />);
  expect(screen.getByText('1')).toBeInTheDocument();
});

test('calls onClick handler', () => {
  const onClick = jest.fn();
  const citation = { type: 'entity', label: 'Test', entityId: '123' };
  render(<CitationChip citation={citation} index={1} onClick={onClick} />);

  fireEvent.click(screen.getByRole('button'));
  expect(onClick).toHaveBeenCalledWith(citation);
});
```

### E2E Tests (Playwright)
```typescript
test('citation opens entity preview', async ({ page }) => {
  await page.goto('/chat');

  // Click citation
  await page.click('[aria-label*="Citation 1"]');

  // Verify entity preview appears
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await expect(page.locator('h2')).toContainText('Entity Details');
});
```

## Future Enhancements

- [ ] Keyboard shortcut (Escape) to close EntityPreview
- [ ] Virtualized list for 100+ relationships
- [ ] Edit button for authorized users
- [ ] Client-side caching with SWR/React Query
- [ ] Hover preview (tooltip) before click
- [ ] Citation numbering persistence across re-renders
- [ ] Group citations by source
- [ ] Export citations to bibliography format
