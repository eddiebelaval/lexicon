function barClass(pct: number): string {
  if (pct >= 75) return 'progress-fill progress-fill--healthy'
  if (pct >= 40) return 'progress-fill progress-fill--warning'
  return 'progress-fill progress-fill--low'
}

export function MiniBar({
  label,
  value,
  pct,
}: {
  label: string
  value?: string
  pct: number
}) {
  return (
    <div className="mini-bar">
      <div className="mini-bar-info">
        <span className="mini-bar-label">{label}</span>
        <span className="mini-bar-value">{value ?? `${Math.round(pct)}%`}</span>
      </div>
      <div className="progress-track">
        <div className={barClass(pct)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
