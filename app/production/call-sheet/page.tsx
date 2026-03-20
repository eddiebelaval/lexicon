'use client';

import { CallSheetView } from '@/components/production/call-sheet-view';
import { useProduction } from '@/components/production/production-context';
import { Loader2 } from 'lucide-react';

export default function CallSheetPage() {
  const { production, loading } = useProduction();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!production) {
    return (
      <div className="text-center py-20 text-gray-500 text-sm">
        No production found.
      </div>
    );
  }

  return <CallSheetView productionId={production.id} />;
}
