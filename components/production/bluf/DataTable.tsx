import type { ReactNode } from 'react'

export type Column = {
  key: string
  label: string
  align?: 'left' | 'right'
}

export function DataTable({
  columns,
  rows,
  compact = false,
}: {
  columns: Column[]
  rows: Record<string, ReactNode>[]
  compact?: boolean
}) {
  return (
    <table className={`dash-table${compact ? ' dash-table--compact' : ''}`}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} className={col.align === 'right' ? 'num' : ''}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((col) => (
              <td
                key={col.key}
                className={
                  col.key === 'name'
                    ? 'name'
                    : col.align === 'right'
                      ? 'num'
                      : ''
                }
              >
                {row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
