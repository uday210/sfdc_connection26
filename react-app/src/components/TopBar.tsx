'use client'

type Props = {
  stats: { pipeline: number; atRisk: number; active: number; accounts: number }
  loading: boolean
}

export function TopBar({ stats, loading }: Props) {
  const now = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-panel)',
      padding: '0 24px',
      height: 52,
      flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 32 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 0.5,
        }}>SC</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
          Sales Command Center
        </span>
        <span style={{
          fontSize: 10, color: 'var(--accent-cyan)', fontWeight: 500,
          background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
          borderRadius: 20, padding: '2px 8px', letterSpacing: 0.3,
        }}>HEADLESS 360</span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 1, flex: 1 }}>
        {[
          { label: 'Projects', value: stats.pipeline, color: 'var(--accent-blue)' },
          { label: 'Active', value: stats.active, color: 'var(--accent-green)' },
          { label: 'At Risk', value: stats.atRisk, color: 'var(--accent-red)' },
          { label: 'Accounts', value: stats.accounts, color: 'var(--accent-purple)' },
        ].map(s => (
          <div key={s.label} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0 20px',
            borderLeft: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums' }}>
              {loading ? '—' : s.value}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent-green)',
            animation: 'pulse-glow 2s ease infinite',
            boxShadow: '0 0 6px var(--accent-green)',
          }} />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Live · Salesforce SDO</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{now}</span>
        <span style={{
          fontSize: 10, color: 'var(--text-muted)',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          borderRadius: 5, padding: '3px 8px',
        }}>CNX26</span>
      </div>
    </div>
  )
}
