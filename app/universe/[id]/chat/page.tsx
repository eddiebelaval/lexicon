'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { ChatLayout } from '@/components/chat';
import { Suspense } from 'react';

function ChatPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const universeId = params.id as string;
  const initialQuery = searchParams.get('q') || undefined;

  return (
    <ChatLayout
      universeId={universeId}
      initialQuery={initialQuery}
    />
  );
}

/**
 * Chat Page - Perplexity-style AI chat for a universe
 *
 * Features:
 * - Full ChatLayout with sidebar + chat area
 * - Accepts ?q= param for initial query from landing page
 * - Streaming AI responses with citations
 */
export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="animate-pulse text-[#888]">Loading chat...</div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
