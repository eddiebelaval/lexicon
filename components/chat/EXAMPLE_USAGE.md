# Chat Sidebar Components - Usage Examples

## Basic Usage

### 1. Complete Chat Interface

```tsx
// app/chat/page.tsx
'use client';

import { ChatLayout } from '@/components/chat';

export default function ChatPage() {
  return (
    <div className="h-screen">
      <ChatLayout universeId="my-universe-id" />
    </div>
  );
}
```

This single component provides:
- Left sidebar with tabs
- Chat history
- Projects tree
- Discover panel
- Message thread
- Chat input with streaming

---

### 2. Custom Sidebar Only

```tsx
'use client';

import { ChatSidebar } from '@/components/chat';
import { useState } from 'react';

export default function CustomPage() {
  const [activeConversation, setActiveConversation] = useState<string>();
  
  return (
    <div className="flex h-screen">
      <ChatSidebar
        universeId="universe-123"
        activeConversationId={activeConversation}
        onConversationSelect={setActiveConversation}
        onNewConversation={() => setActiveConversation(undefined)}
      />
      
      {/* Your custom chat area */}
      <main className="flex-1 bg-surface-primary">
        {/* Custom content */}
      </main>
    </div>
  );
}
```

---

### 3. Individual Components

```tsx
'use client';

import { ChatHistory, ProjectsTree, DiscoverPanel } from '@/components/chat';

// Use any component independently
export function MyCustomSidebar() {
  return (
    <aside className="w-80 bg-sidebar-bg">
      {/* Just the chat history */}
      <ChatHistory
        universeId="universe-123"
        onSelect={(id) => console.log('Selected:', id)}
        onNew={() => console.log('New chat')}
      />
    </aside>
  );
}

export function ProjectsOnly() {
  return (
    <div className="w-80 bg-sidebar-bg">
      <ProjectsTree universeId="universe-123" />
    </div>
  );
}

export function DiscoverOnly() {
  return (
    <div className="w-80 bg-sidebar-bg">
      <DiscoverPanel
        universeId="universe-123"
        onEntityClick={(id) => console.log('Entity:', id)}
      />
    </div>
  );
}
```

---

## Styling Examples

### Custom Color Scheme

```tsx
// Override VHS orange with your brand color
<div className="[--vhs:theme(colors.blue.500)]">
  <ChatSidebar {...props} />
</div>
```

### Different Sidebar Width

```tsx
// Modify the sidebar width by wrapping in a custom container
<div className="w-96"> {/* Instead of default w-80 */}
  <ChatSidebar {...props} />
</div>
```

### Dark Mode Toggle

```tsx
'use client';

import { ChatLayout } from '@/components/chat';
import { useState } from 'react';

export default function ChatWithTheme() {
  const [isDark, setIsDark] = useState(true);
  
  return (
    <div className={isDark ? 'dark' : 'light'}>
      <ChatLayout universeId="universe-123" />
    </div>
  );
}
```

---

## State Management

### With React Context

```tsx
// contexts/ChatContext.tsx
'use client';

import { createContext, useContext, useState } from 'react';

interface ChatContextType {
  universeId: string;
  activeConversation?: string;
  setActiveConversation: (id?: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children, universeId }: { 
  children: React.ReactNode;
  universeId: string;
}) {
  const [activeConversation, setActiveConversation] = useState<string>();
  
  return (
    <ChatContext.Provider value={{
      universeId,
      activeConversation,
      setActiveConversation,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};

// Usage in your app
import { ChatProvider } from '@/contexts/ChatContext';
import { ChatLayout } from '@/components/chat';

export default function ChatPage() {
  return (
    <ChatProvider universeId="universe-123">
      <ChatLayout universeId="universe-123" />
    </ChatProvider>
  );
}
```

---

## Integration Examples

### With Next.js App Router

```tsx
// app/[universeId]/chat/page.tsx
import { ChatLayout } from '@/components/chat';

export default function UniverseChatPage({
  params,
}: {
  params: { universeId: string };
}) {
  return (
    <div className="h-screen">
      <ChatLayout universeId={params.universeId} />
    </div>
  );
}
```

### With React Router

```tsx
// routes/Chat.tsx
import { useParams } from 'react-router-dom';
import { ChatLayout } from '@/components/chat';

export function ChatRoute() {
  const { universeId } = useParams<{ universeId: string }>();
  
  if (!universeId) {
    return <div>Universe not found</div>;
  }
  
  return (
    <div className="h-screen">
      <ChatLayout universeId={universeId} />
    </div>
  );
}
```

---

## Advanced Customization

### Custom Entity Click Handler

```tsx
'use client';

import { ChatSidebar } from '@/components/chat';
import { useRouter } from 'next/navigation';

export function CustomSidebar({ universeId }: { universeId: string }) {
  const router = useRouter();
  
  return (
    <ChatSidebar
      universeId={universeId}
      activeConversationId={undefined}
      onConversationSelect={(id) => {
        router.push(`/chat/${id}`);
      }}
      onNewConversation={() => {
        router.push('/chat/new');
      }}
    />
  );
}
```

### Adding Analytics

```tsx
'use client';

import { ChatSidebar } from '@/components/chat';
import { trackEvent } from '@/lib/analytics';

export function AnalyticsSidebar({ universeId }: { universeId: string }) {
  return (
    <ChatSidebar
      universeId={universeId}
      onConversationSelect={(id) => {
        trackEvent('conversation_selected', { conversationId: id });
      }}
      onNewConversation={() => {
        trackEvent('new_conversation_started');
      }}
    />
  );
}
```

---

## Mobile Optimization

### Responsive Layout

```tsx
'use client';

import { ChatLayout } from '@/components/chat';
import { useState } from 'react';

export default function ResponsiveChat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="h-screen relative">
      {/* Mobile: Overlay sidebar */}
      <div className={`
        lg:hidden fixed inset-0 bg-black/50 z-40
        ${sidebarOpen ? 'block' : 'hidden'}
      `} onClick={() => setSidebarOpen(false)} />
      
      <div className={`
        lg:relative absolute inset-y-0 left-0 z-50
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform
      `}>
        <ChatLayout universeId="universe-123" />
      </div>
      
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-vhs rounded-md"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        Menu
      </button>
    </div>
  );
}
```

---

## Testing Examples

### Unit Test

```typescript
// ChatHistory.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatHistory } from '@/components/chat';

describe('ChatHistory', () => {
  it('renders conversation list', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          conversations: [
            { 
              id: '1', 
              title: 'Test Chat', 
              updatedAt: new Date(),
              messageCount: 5 
            }
          ]
        })
      })
    ) as jest.Mock;

    render(
      <ChatHistory
        universeId="test-universe"
        onSelect={jest.fn()}
        onNew={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Chat')).toBeInTheDocument();
    });
  });

  it('calls onNew when new chat clicked', async () => {
    const onNew = jest.fn();
    
    render(
      <ChatHistory
        universeId="test-universe"
        onSelect={jest.fn()}
        onNew={onNew}
      />
    );

    fireEvent.click(screen.getByText('New Chat'));
    expect(onNew).toHaveBeenCalled();
  });
});
```

### E2E Test

```typescript
// sidebar.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat Sidebar', () => {
  test('can switch between tabs', async ({ page }) => {
    await page.goto('/chat');

    // Click Projects tab
    await page.click('[aria-label="Projects"]');
    await expect(page.locator('text=Scripts')).toBeVisible();

    // Click Discover tab
    await page.click('[aria-label="Discover"]');
    await expect(page.locator('text=Recent')).toBeVisible();

    // Click back to Chats
    await page.click('[aria-label="Chats"]');
    await expect(page.locator('text=New Chat')).toBeVisible();
  });

  test('can collapse sidebar', async ({ page }) => {
    await page.goto('/chat');

    // Get initial width
    const sidebar = page.locator('[aria-label="Chat sidebar"]');
    const initialWidth = await sidebar.evaluate((el) => el.clientWidth);

    // Click collapse button
    await page.click('[aria-label="Collapse sidebar"]');

    // Verify width decreased
    await page.waitForTimeout(300); // Wait for animation
    const collapsedWidth = await sidebar.evaluate((el) => el.clientWidth);
    expect(collapsedWidth).toBeLessThan(initialWidth);
  });

  test('can delete conversation', async ({ page }) => {
    await page.goto('/chat');

    // Hover over conversation
    await page.hover('text=Test Conversation');

    // Click delete button
    await page.click('[aria-label="Delete conversation"]');

    // Confirm deletion
    page.on('dialog', dialog => dialog.accept());

    // Verify removed
    await expect(page.locator('text=Test Conversation')).not.toBeVisible();
  });
});
```

---

## Performance Tips

### Lazy Loading

```tsx
'use client';

import dynamic from 'next/dynamic';

// Lazy load heavy components
const ChatLayout = dynamic(() => 
  import('@/components/chat').then(mod => ({ default: mod.ChatLayout })),
  { ssr: false }
);

export default function ChatPage() {
  return <ChatLayout universeId="universe-123" />;
}
```

### Memoization

```tsx
'use client';

import { ChatSidebar } from '@/components/chat';
import { memo } from 'react';

const MemoizedSidebar = memo(ChatSidebar, (prev, next) => {
  return prev.universeId === next.universeId &&
         prev.activeConversationId === next.activeConversationId;
});

export default function OptimizedChat() {
  return <MemoizedSidebar universeId="universe-123" />;
}
```

---

## Common Patterns

### Loading State

```tsx
'use client';

import { ChatLayout } from '@/components/chat';
import { Suspense } from 'react';

function ChatSkeleton() {
  return (
    <div className="h-screen flex">
      <div className="w-80 bg-sidebar-bg animate-pulse" />
      <div className="flex-1 bg-surface-primary" />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatLayout universeId="universe-123" />
    </Suspense>
  );
}
```

### Error Boundary

```tsx
'use client';

import { Component, ReactNode } from 'react';

class ChatErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-surface-primary">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">
              Something went wrong
            </h2>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-vhs text-white rounded-md"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
import { ChatLayout } from '@/components/chat';

export default function ChatPage() {
  return (
    <ChatErrorBoundary>
      <ChatLayout universeId="universe-123" />
    </ChatErrorBoundary>
  );
}
```

---

These examples cover common use cases. All components are fully typed with TypeScript and include proper error handling.
