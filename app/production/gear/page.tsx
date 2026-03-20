'use client';

import { useProduction } from '@/components/production/production-context';
import { GearBoard } from '@/components/production/gear-board';

export default function GearPage() {
  const { production, loading } = useProduction();

  if (loading || !production) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return <GearBoard productionId={production.id} />;
}
