function gaugeColor(pct: number): string {
  if (pct >= 75) return 'var(--bluf-healthy)'
  if (pct >= 40) return 'var(--bluf-warning)'
  return 'var(--bluf-critical)'
}

export function GaugeRing({
  value,
  label,
  color,
}: {
  value: number
  label?: string
  color?: string
}) {
  const c = color ?? gaugeColor(value)
  const bg = `conic-gradient(${c} ${value * 3.6}deg, var(--bg-primary) 0)`

  return (
    <div className="gauge-ring" style={{ background: bg }}>
      <div className="gauge-ring-inner">
        <div className="gauge-ring-value">{Math.round(value)}%</div>
        {label && <div className="gauge-ring-label">{label}</div>}
      </div>
    </div>
  )
}
