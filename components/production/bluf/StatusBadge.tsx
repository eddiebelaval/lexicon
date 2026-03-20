type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown'

function healthPillClass(health: string): string {
  switch (health) {
    case 'healthy':
      return 'pill--healthy'
    case 'warning':
      return 'pill--warning'
    case 'critical':
      return 'pill--critical'
    default:
      return 'pill--unknown'
  }
}

function healthLabel(health: string): string {
  switch (health) {
    case 'healthy':
      return 'Healthy'
    case 'warning':
      return 'Warning'
    case 'critical':
      return 'Critical'
    default:
      return 'Unknown'
  }
}

export function StatusBadge({ health }: { health: HealthStatus | string }) {
  return (
    <span className={`pill ${healthPillClass(health)}`}>
      <span className="pill-dot" />
      {healthLabel(health)}
    </span>
  )
}
