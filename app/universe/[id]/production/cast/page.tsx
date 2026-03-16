'use client';

import { useParams } from 'next/navigation';
import { CastBoard } from '@/components/production/cast-board';

export default function CastPage() {
  const params = useParams();
  return <CastBoard universeId={params.id as string} />;
}
