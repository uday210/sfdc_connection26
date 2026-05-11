'use client'

import type { Account } from '@/app/page'

type Props = {
  accounts: Account[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading: boolean
}

const healthColor = {
  Healthy: 'var(--accent-green)',
  Watch: 'var(--accent-amber)',
  'At Risk': 'var(--accent-red)',
}

const healthBg = {
  Healthy: 'rgba(16,185,129,0.08)',
  Watch: 'rgba(245,158,11,0.08)',
  'At Risk': 'rgba(239,68,68,0.08)',
}

export function AccountSidebar({ accounts, selectedId, onSelect, loading }: Props) {
  return (
    <div style={{
      width: 240,
      flexShrink: 0,
      borderRight: '1px solid var(--border)',
      background: 'var(--bg-panel)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
          Accounts
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <div className="skeleton" style={{ height: 62, borderRadius: 8 }} />
          </div>
        ))}

        {!loading && accounts.map(acc => {
          const isSelected = acc.id === selectedId
          const color = healthColor[acc.healthLabel]
          const bg = healthBg[acc.healthLabel]

          return (
            <button
              key={acc.id}
              onClick={() => onSelect(acc.id)}
              style={{
                width: '100%', textAlign: 'left',
                padding: '10px 12px',
                marginBottom: 4,
                borderRadius: 8,
                border: isSelected
                  ? `1px solid ${color}40`
                  : '1px solid transparent',
                background: isSelected ? bg : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={e => {
                if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  lineHeight: 1.3,
                  maxWidth: 150,
                }}>
                  {acc.name}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: color,
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}>
                  {acc.healthScore}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {acc.industry || 'Unknown'} · {acc.projects.length}p
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 600,
                  color: color,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                  {acc.healthLabel}
                </span>
              </div>

              {/* Health bar */}
              <div style={{
                marginTop: 7,
                height: 2,
                borderRadius: 2,
                background: 'var(--border)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${acc.healthScore}%`,
                  background: color,
                  borderRadius: 2,
                  transition: 'width 0.6s ease',
                  boxShadow: `0 0 6px ${color}`,
                }} />
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Health score
        </p>
        {(['Healthy', 'Watch', 'At Risk'] as const).map(l => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: healthColor[l], flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {l} {l === 'Healthy' ? '≥70' : l === 'Watch' ? '40–69' : '<40'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
