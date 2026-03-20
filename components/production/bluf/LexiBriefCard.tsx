'use client'

import { renderBold } from './BriefingParts'

const TELEGRAM_BOT_URL = 'https://t.me/LexiProductionBot'
const ACCENT_COLOR = 'var(--vhs-orange)'

export function LexiBriefCard({
  briefText,
  generatedAt,
}: {
  briefText: string
  generatedAt: string
}) {
  const time = new Date(generatedAt)
  const timeStr = time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <div className="agent-brief" style={{ borderLeftColor: ACCENT_COLOR }}>
      <div className="agent-brief-header">
        <div
          className="agent-brief-avatar"
          style={{ background: `${ACCENT_COLOR}18`, color: ACCENT_COLOR }}
        >
          L
        </div>
        <div className="agent-brief-name">Lexi</div>
        <div className="agent-brief-time">{timeStr}</div>
      </div>
      <div className="agent-brief-body">
        {renderBold(briefText)}
      </div>
      <div className="agent-brief-followup">
        <a
          className="agent-brief-send"
          href={TELEGRAM_BOT_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Continue in Telegram
        </a>
      </div>
    </div>
  )
}
