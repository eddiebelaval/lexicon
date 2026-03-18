'use client';

import { useProduction } from '@/components/production/production-context';
import { PostBoard } from '@/components/production/post-board';

export default function PostPage() {
  const { production, loading } = useProduction();

  if (loading || !production) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return <PostBoard productionId={production.id} />;
}
