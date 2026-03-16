'use client';

import { useParams } from 'next/navigation';
import { IntakeWizard } from '@/components/production/intake/intake-wizard';

export default function IntakePage() {
  const params = useParams();
  return <IntakeWizard universeId={params.id as string} />;
}
