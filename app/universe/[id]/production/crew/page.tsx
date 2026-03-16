'use client';

import { useParams } from 'next/navigation';
import { CrewBoard } from '@/components/production/crew-board';

export default function CrewPage() {
  const params = useParams();
  return <CrewBoard universeId={params.id as string} />;
}
