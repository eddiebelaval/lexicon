'use client';

import { useParams } from 'next/navigation';
import { ProductionDashboard } from '@/components/production/production-dashboard';

export default function ProductionDashboardPage() {
  const params = useParams();
  return <ProductionDashboard universeId={params.id as string} />;
}
