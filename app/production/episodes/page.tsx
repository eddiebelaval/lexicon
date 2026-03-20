import { PageHeader } from '@/components/shell';

export default function EpisodesPage() {
  return (
    <div>
      <PageHeader title="Episodes" description="Track episodes from production through delivery" />
      <div className="text-center py-20" style={{ color: 'var(--text-tertiary)' }}>
        <p>Coming soon</p>
      </div>
    </div>
  );
}
