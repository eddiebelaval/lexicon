import type { BlufStatus } from './BriefingParts'

function healthPillClass(health: BlufStatus): string {
  switch (health) {
    case 'healthy':
      return 'pill--healthy'
    case 'warning':
      return 'pill--warning'
    case 'critical':
      return 'pill--critical'
    case 'idle':
    case 'unknown':
    default:
      return 'pill--neutral'
  }
}

function healthLabel(health: BlufStatus): string {
  switch (health) {
    case 'healthy':
      return 'Healthy'
    case 'warning':
      return 'Warning'
    case 'critical':
      return 'Critical'
    case 'idle':
      return 'Idle'
    case 'unknown':
    default:
      return 'Unknown'
  }
}

export function StatusBadge({ health }: { health: BlufStatus }) {
  return (
    <span className={`pill ${healthPillClass(health)}`}>
      <span className="pill-dot" />
      {healthLabel(health)}
    </span>
  )
}
