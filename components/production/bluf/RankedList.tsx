export function RankedList({
  items,
  variant = 'priority',
}: {
  items: { label: string; detail?: string }[]
  variant?: 'priority' | 'blocker'
}) {
  if (variant === 'blocker') {
    return (
      <ul className="blocker-list">
        {items.map((item, i) => (
          <li className="blocker-item" key={i}>
            <svg
              className="blocker-icon"
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="8" cy="8" r="6" />
              <path d="M10 6L6 10M6 6l4 4" />
            </svg>
            <span>
              <strong>{item.label}</strong>
              {item.detail && ` \u2014 ${item.detail}`}
            </span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ol className="priority-list">
      {items.map((item, i) => (
        <li className="priority-item" key={i}>
          <span className="priority-num">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span>
            {item.label}
            {item.detail && (
              <span style={{ color: 'var(--text-tertiary)', marginLeft: 8 }}>
                {item.detail}
              </span>
            )}
          </span>
        </li>
      ))}
    </ol>
  )
}
