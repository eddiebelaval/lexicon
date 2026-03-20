import type { ReactNode } from 'react'

export type KPI = {
  label: string
  value: string | number
  color?: string
  meta?: ReactNode
}

export function KPIRow({ items }: { items: KPI[] }) {
  return (
    <div className="heartbeat">
      {items.map((item) => (
        <div className="hb-cell" key={item.label}>
          <div className="hb-label">{item.label}</div>
          <div
            className="hb-value"
            style={item.color ? { color: item.color } : undefined}
          >
            {item.value}
          </div>
          {item.meta && <div className="hb-meta">{item.meta}</div>}
        </div>
      ))}
    </div>
  )
}
