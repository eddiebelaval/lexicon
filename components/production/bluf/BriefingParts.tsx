import type { CSSProperties } from 'react'

export type BlufStatus = 'healthy' | 'warning' | 'critical' | 'idle' | 'unknown'

const statusColors: Record<BlufStatus, string> = {
  healthy: 'var(--bluf-healthy)',
  warning: 'var(--bluf-warning)',
  critical: 'var(--bluf-critical)',
  idle: 'var(--text-tertiary)',
  unknown: 'var(--text-tertiary)',
}

export function renderBold(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  )
}

export function StatusDot({ status }: { status: BlufStatus }) {
  const color = statusColors[status] ?? 'var(--text-tertiary)'
  return (
    <span
      className="agent-status-dot"
      style={{ '--dot-color': color } as CSSProperties}
    />
  )
}
