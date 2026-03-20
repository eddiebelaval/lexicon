'use client'

import { StatusDot } from './BriefingParts'

export type AlertItem = {
  severity: 'critical' | 'warning' | 'info'
  type: string
  message: string
  details?: string
}

export function BLUFAlert({ alerts }: { alerts: AlertItem[] }) {
  const critical = alerts.filter((a) => a.severity === 'critical')
  const warnings = alerts.filter((a) => a.severity === 'warning')

  if (critical.length > 0) {
    const top3 = critical.slice(0, 3)
    return (
      <div className="mega-brief-alert">
        <strong>{critical.length} critical alert{critical.length !== 1 ? 's' : ''}</strong>
        {top3.map((a, i) => (
          <div key={i}>{a.type}: {a.message}</div>
        ))}
      </div>
    )
  }

  if (warnings.length > 0) {
    const top3 = warnings.slice(0, 3)
    return (
      <div className="mega-brief-warning">
        <strong>{warnings.length} warning{warnings.length !== 1 ? 's' : ''}</strong>
        {top3.map((a, i) => (
          <div key={i}>{a.type}: {a.message}</div>
        ))}
      </div>
    )
  }

  return (
    <div className="mega-brief-clear">
      <StatusDot status="healthy" /> All clear
    </div>
  )
}
