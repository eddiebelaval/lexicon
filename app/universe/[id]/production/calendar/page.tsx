'use client';

import { useParams } from 'next/navigation';
import { CalendarView } from '@/components/production/calendar-view';

export default function CalendarPage() {
  const params = useParams();
  return <CalendarView universeId={params.id as string} />;
}
