# Quick Start Guide - Chat Components

## 30 Second Setup

```tsx
// app/chat/page.tsx
import { ChatContainer } from '@/components/chat';

export default function ChatPage() {
  return (
    <div className="h-screen">
      <ChatContainer universeId="your-universe-id" />
    </div>
  );
}
```

That's it! You now have a fully functional chat interface with:
- Streaming AI responses
- Inline citations
- Tool call visibility
- Auto-scrolling
- Beautiful VHS aesthetics

## 5 Minute Customization

### Custom Message Handler

```tsx
import { ChatContainer } from '@/components/chat';

export default function CustomChat() {
  const handleSend = async (message: string) => {
    // Your custom logic here
    await fetch('/api/my-endpoint', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  };

  return (
    <ChatContainer
      universeId="your-universe-id"
      onSendMessage={handleSend}
    />
  );
}
```

### Individual Components

```tsx
import { ChatThread, ChatInput } from '@/components/chat';
import { useState } from 'react';
import type { Message } from '@/types/chat';

export default function BuildYourOwn() {
  const [messages, setMessages] = useState<Message[]>([]);

  return (
    <div className="h-screen flex flex-col">
      <ChatThread messages={messages} />
      <ChatInput onSend={(msg) => {/* handle */}} />
    </div>
  );
}
```

## Required Message Format

```typescript
const message: Message = {
  id: 'unique-id',
  conversationId: 'conversation-id',
  role: 'user' | 'assistant',
  content: 'message text',
  citations: [],        // Citation[]
  toolCalls: [],        // ToolCall[]
  createdAt: new Date(),
};
```

## API Endpoint Format

Your `/api/chat` should return Server-Sent Events:

```typescript
export async function POST(req: Request) {
  const stream = new ReadableStream({
    start(controller) {
      // Send chunks
      controller.enqueue(`data: ${JSON.stringify({
        type: 'text',
        data: { content: 'Hello...' }
      })}\n\n`);

      // Send done
      controller.enqueue(`data: ${JSON.stringify({
        type: 'done',
        data: { message: {...} }
      })}\n\n`);

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
```

## Common Patterns

### With Citation Clicks

```tsx
<ChatThread
  messages={messages}
  onCitationClick={(citation) => {
    if (citation.type === 'entity') {
      router.push(`/entities/${citation.entityId}`);
    }
  }}
/>
```

### With Streaming

```tsx
<ChatThread
  messages={messages}
  isStreaming={isStreaming}
  streamingContent={currentContent}
/>
```

### Disabled While Loading

```tsx
<ChatInput
  onSend={handleSend}
  disabled={isLoading}
/>
```

## Styling

Components use Tailwind with VHS theme:
- Orange: `#E8734A` (already configured)
- Backgrounds: `surface-primary`, `surface-secondary`
- Borders: `panel-border`
- Glows: `shadow-vhs-sm`, `shadow-vhs`

## Troubleshooting

**Citations not showing?**
- Ensure `citations` array exists in Message objects
- Check citation IDs are unique

**Streaming not working?**
- Verify API returns `text/event-stream`
- Check data format matches SSE spec

**TypeScript errors?**
- Import types from `@/types/chat`
- Ensure all Message fields are present

## Next Steps

1. Read [EXAMPLES.md](./EXAMPLES.md) for more patterns
2. Check [README.md](./README.md) for full API reference
3. See [COMPONENT_SUMMARY.md](./COMPONENT_SUMMARY.md) for complete overview

## Files Reference

```
components/chat/
├── ChatContainer.tsx     → Full chat interface
├── ChatThread.tsx        → Message list
├── ChatMessage.tsx       → Individual messages
├── ChatInput.tsx         → Input field
├── CitationChip.tsx      → Inline citations
└── CitationDetail.tsx    → Citation details
```

All components are exported from `@/components/chat`.

---

**Ready to use!** No additional setup required.
