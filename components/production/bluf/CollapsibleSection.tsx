import type { ReactNode } from 'react'

export function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string
  count?: number | string
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <details className="dash-collapse" open={defaultOpen || undefined}>
      <summary>
        {title}
        {count != null && <span className="dash-collapse-count">{count}</span>}
        <svg
          className="dash-collapse-chevron"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 4l4 4-4 4" />
        </svg>
      </summary>
      <div className="dash-collapse-body">{children}</div>
    </details>
  )
}
