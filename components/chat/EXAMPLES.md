# Chat Components - Usage Examples

## Quick Start

### 1. Basic Chat Interface

The simplest way to add chat to your app:

```tsx
import { ChatContainer } from '@/components/chat';

export default function ChatPage() {
  return (
    <div className="h-screen">
      <ChatContainer universeId="my-universe-id" />
    </div>
  );
}
```

### 2. Custom Message Handling

Handle messages with your own logic:

```tsx
import { ChatContainer } from '@/components/chat';

export default function CustomChatPage() {
  const handleSendMessage = async (message: string) => {
    // Custom logic before sending
    console.log('Sending:', message);

    // Call your custom API
    const response = await fetch('/api/my-chat-endpoint', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });

    // Handle response...
  };

  return (
    <ChatContainer
      universeId="my-universe-id"
      onSendMessage={handleSendMessage}
    />
  );
}
```

### 3. Individual Components

Build your own layout using individual components:

```tsx
'use client';

import { useState } from 'react';
import { ChatThread, ChatInput } from '@/components/chat';
import type { Message } from '@/types/chat';

export default function CustomLayout() {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSend = async (content: string) => {
    // Add user message
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: 'conv-1',
      role: 'user',
      content,
      citations: [],
      toolCalls: [],
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);

    // Call API and add response...
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="p-4 border-b border-panel-border">
        <h1 className="text-xl font-bold text-white">My Custom Chat</h1>
      </header>

      <ChatThread messages={messages} />

      <ChatInput onSend={handleSend} />
    </div>
  );
}
```

## Advanced Examples

### 4. With Citation Handling

Handle citation clicks to show entity details:

```tsx
'use client';

import { useState } from 'react';
import { ChatThread, CitationDetail } from '@/components/chat';
import type { Message, Citation } from '@/types/chat';

export default function ChatWithCitations() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  return (
    <div className="h-screen flex">
      <div className="flex-1">
        <ChatThread
          messages={messages}
          onCitationClick={(citation) => {
            if (citation.type === 'web') {
              // Open web links immediately
              window.open(citation.url, '_blank');
            } else {
              // Show entity/relationship details in sidebar
              setSelectedCitation(citation);
            }
          }}
        />
      </div>

      {selectedCitation && (
        <div className="w-96 border-l border-panel-border p-4">
          <CitationDetail
            citation={selectedCitation}
            onClose={() => setSelectedCitation(null)}
          />
        </div>
      )}
    </div>
  );
}
```

### 5. Streaming Responses

Show real-time streaming responses:

```tsx
'use client';

import { useState } from 'react';
import { ChatThread, ChatInput } from '@/components/chat';
import type { Message } from '@/types/chat';

export default function StreamingChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const handleSend = async (content: string) => {
    // Add user message
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: 'conv-1',
      role: 'user',
      content,
      citations: [],
      toolCalls: [],
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingContent('');

    // Fetch with streaming
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: content }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setStreamingContent(accumulated);
      }
    }

    // Add complete message
    const assistantMsg: Message = {
      id: `msg-${Date.now()}-ai`,
      conversationId: 'conv-1',
      role: 'assistant',
      content: accumulated,
      citations: [],
      toolCalls: [],
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, assistantMsg]);
    setIsStreaming(false);
  };

  return (
    <div className="h-screen flex flex-col">
      <ChatThread
        messages={messages}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
      />
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
```

### 6. With Message History

Load and display conversation history:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { ChatContainer } from '@/components/chat';

export default function ChatWithHistory({
  conversationId,
}: {
  conversationId: string;
}) {
  const [initialMessages, setInitialMessages] = useState([]);

  useEffect(() => {
    // Load previous messages
    fetch(`/api/conversations/${conversationId}/messages`)
      .then(res => res.json())
      .then(data => setInitialMessages(data.messages));
  }, [conversationId]);

  return (
    <ChatContainer
      universeId="my-universe"
      conversationId={conversationId}
      initialMessages={initialMessages}
    />
  );
}
```

### 7. Custom Empty State

Override the default empty state with prompts:

```tsx
'use client';

import { ChatThread } from '@/components/chat';
import type { Message } from '@/types/chat';

function CustomEmptyState({ onPromptClick }: { onPromptClick: (prompt: string) => void }) {
  const prompts = [
    "Tell me about the Three Musketeers",
    "Who is D'Artagnan?",
    "What happens in Paris?",
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">
          Explore your story universe
        </h2>
        <div className="space-y-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onPromptClick(prompt)}
              className="block w-full text-left px-4 py-3 rounded-lg bg-surface-elevated border border-panel-border hover:border-vhs/40 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatWithCustomEmpty() {
  const [messages, setMessages] = useState<Message[]>([]);

  const handlePromptClick = (prompt: string) => {
    // Handle prompt selection
  };

  return (
    <div className="h-screen flex flex-col">
      {messages.length === 0 ? (
        <CustomEmptyState onPromptClick={handlePromptClick} />
      ) : (
        <ChatThread messages={messages} />
      )}
    </div>
  );
}
```

### 8. Mobile Responsive Layout

Create a mobile-friendly chat interface:

```tsx
'use client';

import { useState } from 'react';
import { ChatLayout } from '@/components/chat';
import { Menu } from 'lucide-react';

export default function ResponsiveChat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen relative">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface-secondary border-b border-panel-border flex items-center px-4 z-10">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="ml-4 text-lg font-semibold text-white">Lexicon</h1>
      </div>

      {/* Chat layout with sidebar */}
      <div className="h-full pt-14 lg:pt-0">
        <ChatLayout universeId="my-universe" />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
```

## Integration with API

### Server-Sent Events (SSE) Format

Your API should return streaming responses in this format:

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { message, universeId, conversationId } = await req.json();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send text chunks
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'text',
            data: { content: 'Partial response...' }
          })}\n\n`
        )
      );

      // Send citations
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'citations',
            data: {
              citations: [
                {
                  id: 'cite-1',
                  type: 'entity',
                  label: "D'Artagnan",
                  entityId: 'entity-123',
                  entityType: 'character',
                }
              ]
            }
          })}\n\n`
        )
      );

      // Send done
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'done',
            data: {
              message: {
                id: 'msg-123',
                conversationId,
                role: 'assistant',
                content: 'Complete response...',
                citations: [...],
                toolCalls: [],
                createdAt: new Date(),
              }
            }
          })}\n\n`
        )
      );

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

## Styling Customization

### Custom Theme

Override default VHS colors:

```tsx
// In your component
<div className="[--vhs:hsl(200,100%,50%)]">
  <ChatContainer universeId="my-universe" />
</div>
```

### Custom Message Styling

Extend ChatMessage with custom classes:

```tsx
// Create a wrapper component
function CustomChatMessage({ message }: { message: Message }) {
  return (
    <div className="my-custom-wrapper">
      <ChatMessage message={message} />
      {/* Add custom elements */}
    </div>
  );
}
```

## Testing

### Unit Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from '@/components/chat';

describe('ChatInput', () => {
  it('calls onSend when message is submitted', () => {
    const handleSend = jest.fn();
    render(<ChatInput onSend={handleSend} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleSend).toHaveBeenCalledWith('Hello');
  });

  it('does not send empty messages', () => {
    const handleSend = jest.fn();
    render(<ChatInput onSend={handleSend} />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleSend).not.toHaveBeenCalled();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('can send and receive messages', async ({ page }) => {
  await page.goto('/chat');

  // Send a message
  await page.fill('[aria-label="Chat message input"]', 'Hello AI');
  await page.click('[aria-label="Send message"]');

  // Verify user message appears
  await expect(page.locator('text=Hello AI')).toBeVisible();

  // Verify AI response appears (eventually)
  await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 10000 });
});
```

## Performance Tips

1. **Virtualize long message lists**: Use `react-window` for 100+ messages
2. **Debounce streaming updates**: Update UI every 50-100ms instead of every chunk
3. **Lazy load citation details**: Only fetch entity data when citation is clicked
4. **Memoize message components**: Use `React.memo()` on ChatMessage
5. **Preload common entities**: Cache frequently cited entities

## Troubleshooting

### Citations not showing
- Verify the `citations` array is populated in your Message objects
- Check that citation IDs are unique
- Ensure `onCitationClick` handler is provided if you want interactivity

### Streaming not working
- Verify API returns `text/event-stream` content type
- Check that data format matches expected SSE format
- Ensure no buffering middleware is interfering

### Messages not auto-scrolling
- Check that parent container has `overflow-y-auto`
- Verify ChatThread has a fixed height
- Ensure messages array is updating correctly

### TypeScript errors
- Make sure all Message objects have required fields:
  - `id`, `conversationId`, `role`, `content`, `citations`, `toolCalls`, `createdAt`
- Import types from `@/types/chat`, not local definitions
