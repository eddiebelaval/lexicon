# Chat Components

Perplexity-style conversational interface for Lexicon. Beautiful, functional, and accessible chat components with streaming support and inline citations.

## Overview

These components provide a complete chat experience inspired by Perplexity's clean, citation-focused design with Lexicon's VHS aesthetic.

### Features

- **Streaming responses** - Real-time text display as AI generates responses
- **Inline citations** - Clickable citation chips embedded in text
- **Tool call visibility** - Collapsible section showing AI's actions
- **Auto-scrolling** - Smooth scroll to new messages
- **Responsive design** - Works on all screen sizes
- **Accessibility** - Full keyboard navigation and ARIA labels
- **VHS styling** - Orange accents (#E8734A) on dark backgrounds

## Components

### ChatContainer

Complete chat interface with state management. Use this for a full-featured chat experience.

```tsx
import { ChatContainer } from '@/components/chat';

<ChatContainer
  universeId="universe-123"
  conversationId="conv-456"
  initialMessages={messages}
  onSendMessage={async (msg) => await sendToAPI(msg)}
/>
```

**Props:**
- `universeId` (string, required) - Universe context
- `conversationId` (string, optional) - Current conversation ID
- `initialMessages` (Message[], optional) - Pre-populate messages
- `onSendMessage` (function, optional) - Custom message handler

---

### ChatThread

Scrollable message list with streaming support.

```tsx
import { ChatThread } from '@/components/chat';

<ChatThread
  messages={messages}
  isStreaming={isStreaming}
  streamingContent={currentStreamContent}
  onCitationClick={(citation) => showDetails(citation)}
/>
```

**Props:**
- `messages` (Message[], required) - Array of messages
- `isStreaming` (boolean, optional) - Show streaming indicator
- `streamingContent` (string, optional) - Current streaming text
- `onCitationClick` (function, optional) - Citation click handler

**Features:**
- Auto-scrolls to bottom on new messages
- Shows empty state with example prompts
- Animated streaming indicator with pulsing dots

---

### ChatMessage

Individual message bubble with role-based styling.

```tsx
import { ChatMessage } from '@/components/chat';

<ChatMessage
  message={message}
  onCitationClick={(citation) => showDetails(citation)}
/>
```

**Props:**
- `message` (Message, required) - Message data
- `onCitationClick` (function, optional) - Citation click handler

**Features:**
- User messages: right-aligned, simple styling
- Assistant messages: left-aligned with citations and tool calls
- Collapsible tool call section
- Timestamp display
- Inline citation chips

---

### ChatInput

Auto-expanding textarea with send button.

```tsx
import { ChatInput } from '@/components/chat';

<ChatInput
  onSend={(message) => handleSend(message)}
  disabled={isStreaming}
  placeholder="Ask about your universe..."
/>
```

**Props:**
- `onSend` (function, required) - Send message callback
- `disabled` (boolean, optional) - Disable during streaming
- `placeholder` (string, optional) - Input placeholder text

**Features:**
- Auto-expands up to 5 lines
- Enter to send, Shift+Enter for newline
- Character count shown at 1500+ chars
- Disabled state while streaming
- Keyboard shortcuts hint

---

### CitationChip

Inline citation indicator with icon.

```tsx
import { CitationChip } from '@/components/chat';

<CitationChip
  citation={citation}
  index={0}
  onClick={(c) => showDetails(c)}
/>
```

**Props:**
- `citation` (Citation, required) - Citation data
- `index` (number, required) - Citation number (0-based)
- `onClick` (function, optional) - Click handler

**Features:**
- Type-specific icons (entity types, web, relationship)
- Numbered display [1], [2], etc.
- VHS orange hover effect
- Opens web citations in new tab
- Tooltip with citation label

---

### CitationDetail

Detailed citation information panel.

```tsx
import { CitationDetail } from '@/components/chat';

<CitationDetail
  citation={selectedCitation}
  onClose={() => setSelectedCitation(null)}
/>
```

**Props:**
- `citation` (Citation, required) - Citation to display
- `onClose` (function, optional) - Close handler

**Features:**
- Type-specific layouts (entity, relationship, web)
- Color-coded by entity type
- Links to entity/relationship pages
- Web citation snippet preview
- External link for web sources

## Type Definitions

All types are defined in `/types/chat.ts`:

```typescript
interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  toolCalls: ToolCall[];
  createdAt: Date;
}

interface Citation {
  id: string;
  type: 'entity' | 'relationship' | 'web';
  label: string;
  entityId?: string;
  entityType?: EntityType;
  relationshipId?: string;
  fromEntity?: string;
  toEntity?: string;
  relationshipType?: RelationshipType;
  url?: string;
  title?: string;
  snippet?: string;
}

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: unknown;
  error?: string;
  status: 'pending' | 'success' | 'error';
}
```

## Styling

All components use Tailwind CSS with Lexicon's VHS theme:

### Colors
- **VHS Orange**: `#E8734A` (accent color)
- **Background**: `#0a0a0f` (surface-primary)
- **Card Background**: `#12121a` (surface-secondary)
- **Border**: `#2a2a3a` (panel-border)

### Utility Classes
- `shadow-vhs-sm` - Small VHS glow
- `shadow-vhs` - Medium VHS glow
- `shadow-vhs-lg` - Large VHS glow
- `animate-slide-up` - Slide up animation
- `animate-pulse` - Pulse animation

## API Integration

### Streaming Response Format

Your `/api/chat` endpoint should return Server-Sent Events:

```typescript
// Streaming format
data: {"type":"text","data":{"content":"partial response"}}
data: {"type":"tool_use","data":{"toolCall":{...}}}
data: {"type":"tool_result","data":{"result":{...}}}
data: {"type":"citations","data":{"citations":[...]}}
data: {"type":"done","data":{"message":{...}}}
data: {"type":"error","data":{"code":"...","message":"..."}}
```

### Example API Route

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { conversationId, universeId, message } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      // Send text chunks
      controller.enqueue(`data: ${JSON.stringify({
        type: 'text',
        data: { content: 'Partial response...' }
      })}\n\n`);

      // Send final message
      controller.enqueue(`data: ${JSON.stringify({
        type: 'done',
        data: { message: completeMessage }
      })}\n\n`);

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

## Accessibility

All components follow WCAG 2.1 AA standards:

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Escape to close modals/details
- Shift+Enter for newline in input

### Screen Readers
- Proper ARIA labels on all buttons
- Role attributes for semantic meaning
- Live regions for streaming content
- Descriptive alt text for icons

### Focus Management
- Visible focus rings
- Logical tab order
- Auto-focus on relevant elements
- Focus trap in modals

## Performance Considerations

### Optimizations
- Minimal re-renders (pure functional components)
- CSS transitions over JS animations
- Lazy rendering for large message lists
- Debounced auto-scroll

### Recommendations
- Paginate messages for long conversations (100+ messages)
- Virtualize message list if needed
- Lazy load citation details
- Preload entity data for common citations

## Testing

### Unit Tests
```typescript
// ChatInput.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from './ChatInput';

test('sends message on Enter', () => {
  const handleSend = jest.fn();
  render(<ChatInput onSend={handleSend} />);

  const input = screen.getByLabelText('Chat message input');
  fireEvent.change(input, { target: { value: 'Hello' } });
  fireEvent.keyDown(input, { key: 'Enter' });

  expect(handleSend).toHaveBeenCalledWith('Hello');
});
```

### E2E Tests
```typescript
// chat.spec.ts (Playwright)
test('can send message and receive response', async ({ page }) => {
  await page.goto('/chat');

  await page.fill('[aria-label="Chat message input"]', 'Test message');
  await page.click('[aria-label="Send message"]');

  await expect(page.locator('text=Test message')).toBeVisible();
  await expect(page.locator('[role="status"]')).toBeVisible(); // Streaming indicator
});
```

## Examples

### Basic Chat Page

```tsx
// app/chat/page.tsx
'use client';

import { ChatContainer } from '@/components/chat';

export default function ChatPage() {
  return (
    <div className="h-screen bg-surface-primary">
      <ChatContainer
        universeId="my-universe"
        onSendMessage={async (message) => {
          // Handle message sending
        }}
      />
    </div>
  );
}
```

### Custom Message Handler

```tsx
const handleSend = async (message: string) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, universeId }),
  });

  // Handle response...
};

<ChatContainer
  universeId="my-universe"
  onSendMessage={handleSend}
/>
```

### Citation Click Handler

```tsx
const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

<ChatThread
  messages={messages}
  onCitationClick={(citation) => {
    if (citation.type === 'entity') {
      router.push(`/entities/${citation.entityId}`);
    } else {
      setSelectedCitation(citation);
    }
  }}
/>
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari 14+
- Chrome Android 90+

## License

Part of the Lexicon project by ID8Labs.
