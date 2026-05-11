'use client'

import { useState } from 'react'
import type { Account, Project } from '@/app/page'

type Props = {
  account: Account | null
  loading: boolean
  onRefresh: () => void
}

const statusColor: Record<string, string> = {
  'At Risk':       'var(--accent-red)',
  'In Progress':   'var(--accent-blue)',
  'Implementation':'var(--accent-cyan)',
  'Planning':      'var(--accent-purple)',
  'On Hold':       'var(--accent-amber)',
  'Complete':      'var(--accent-green)',
}

function fmt(d: unknown) {
  if (!d) return '—'
  return new Date(d as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ProjectRow({ project, onRefresh }: { project: Project; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [dateField, setDateField] = useState<'start' | 'end'>('end')
  const [newDate, setNewDate] = useState('')
  const [note, setNote] = useState('')
  const [confirm, setConfirm] = useState<'date' | 'note' | null>(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const color = statusColor[project.Status__c] ?? 'var(--text-muted)'

  const doDate = async () => {
    setBusy(true)
    const r = await fetch('/api/sf/update-date', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.Id, field: dateField, newDate }),
    })
    const d = await r.json()
    setMsg(d.success ? `Date updated to ${newDate}` : d.error)
    setConfirm(null); setNewDate(''); setBusy(false)
    if (d.success) setTimeout(onRefresh, 800)
  }

  const doNote = async () => {
    setBusy(true)
    const r = await fetch('/api/sf/log-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.Id, noteBody: note }),
    })
    const d = await r.json()
    setMsg(d.success ? 'Note logged.' : d.error)
    setConfirm(null); setNote(''); setBusy(false)
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid var(--border)`,
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 8,
      transition: 'border-color 0.15s',
    }}>
      {/* Row header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', textAlign: 'left',
          padding: '12px 16px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        {/* Status dot */}
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: color, flexShrink: 0,
          boxShadow: `0 0 6px ${color}`,
        }} />

        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left' }}>
          {project.Name}
        </span>

        <span style={{
          fontSize: 10, fontWeight: 600, color,
          textTransform: 'uppercase', letterSpacing: 0.5,
          background: `${color}15`,
          borderRadius: 5, padding: '3px 8px',
          flexShrink: 0,
        }}>
          {project.Status__c}
        </span>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>End date</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>
            {fmt(project.End_Date__c)}
          </p>
        </div>

        <span style={{ fontSize: 16, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 4 }}>
          {expanded ? '⌃' : '⌄'}
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '14px 16px',
          display: 'flex', flexDirection: 'column', gap: 14,
        }} className="animate-slide-in">

          {project.Risks__c && (
            <div style={{
              padding: '8px 12px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 7,
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                ⚠ Risk
              </span>
              <p style={{ fontSize: 12, color: '#fca5a5', margin: '4px 0 0' }}>{project.Risks__c}</p>
            </div>
          )}

          {project.Description__c && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              {project.Description__c}
            </p>
          )}

          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>Owner: <span style={{ color: 'var(--text-secondary)' }}>{project.Owner?.Name}</span></span>
            <span>Start: <span style={{ color: 'var(--text-secondary)' }}>{fmt(project.Start_Date__c)}</span></span>
          </div>

          {msg && <p style={{ fontSize: 11, color: 'var(--accent-green)', margin: 0 }}>{msg}</p>}

          {/* Actions */}
          {!confirm ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirm('date')} style={btnStyle('blue')}>
                Move Date
              </button>
              <button onClick={() => setConfirm('note')} style={btnStyle('purple')}>
                Log Note
              </button>
            </div>
          ) : confirm === 'date' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={dateField}
                  onChange={e => setDateField(e.target.value as 'start' | 'end')}
                  style={selectStyle}
                >
                  <option value="start">Start date</option>
                  <option value="end">End date</option>
                </select>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  style={{ ...selectStyle, flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button disabled={!newDate || busy} onClick={doDate} style={btnStyle('green')}>
                  {busy ? 'Saving…' : 'Confirm Update'}
                </button>
                <button onClick={() => setConfirm(null)} style={btnStyle('ghost')}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                placeholder="e.g. EU data center scope discussed with client…"
                style={{
                  ...selectStyle,
                  resize: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button disabled={!note.trim() || busy} onClick={doNote} style={btnStyle('purple')}>
                  {busy ? 'Logging…' : 'Log Note'}
                </button>
                <button onClick={() => setConfirm(null)} style={btnStyle('ghost')}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const btnStyle = (variant: 'blue' | 'green' | 'purple' | 'ghost'): React.CSSProperties => {
  const map = {
    blue:   { background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.25)' },
    green:  { background: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)', border: '1px solid rgba(16,185,129,0.25)' },
    purple: { background: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)', border: '1px solid rgba(139,92,246,0.25)' },
    ghost:  { background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
  }
  return {
    ...map[variant],
    padding: '6px 14px',
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity 0.15s',
  }
}

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-base)',
  border: '1px solid var(--border-bright)',
  borderRadius: 7,
  padding: '6px 10px',
  fontSize: 12,
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  outline: 'none',
}

export function Account360Panel({ account, loading, onRefresh }: Props) {
  if (loading) {
    return (
      <div style={{ flex: 1, padding: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 70, borderRadius: 10 }} />
        ))}
      </div>
    )
  }

  if (!account) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Select an account</p>
      </div>
    )
  }

  const acc = account.projects[0]?.Account__r

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      borderRight: '1px solid var(--border)',
    }}>
      {/* Account header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              {account.name}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              {acc?.Industry ?? ''}{acc?.Type ? ` · ${acc.Type}` : ''}
              {acc?.BillingCity ? ` · ${acc.BillingCity}, ${acc.BillingState}` : ''}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 22, fontWeight: 800,
              color: account.healthLabel === 'Healthy' ? 'var(--accent-green)'
                   : account.healthLabel === 'Watch' ? 'var(--accent-amber)'
                   : 'var(--accent-red)',
              lineHeight: 1,
            }}>
              {account.healthScore}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Health Score
            </div>
          </div>
        </div>

        {/* Account quick stats */}
        <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
          {acc?.AnnualRevenue && (
            <span>Revenue: <span style={{ color: 'var(--text-secondary)' }}>
              ${(acc.AnnualRevenue / 1e6).toFixed(1)}M
            </span></span>
          )}
          {acc?.NumberOfEmployees && (
            <span>Employees: <span style={{ color: 'var(--text-secondary)' }}>
              {Number(acc.NumberOfEmployees).toLocaleString()}
            </span></span>
          )}
          {acc?.Website && (
            <a href={acc.Website} target="_blank" rel="noopener" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>
              {acc.Website.replace(/^https?:\/\//, '')}
            </a>
          )}
          <span>{account.projects.length} project{account.projects.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Projects list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
        <p style={{
          fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
        }}>
          Projects — click to expand
        </p>

        {account.projects.map(p => (
          <ProjectRow key={p.Id} project={p} onRefresh={onRefresh} />
        ))}
      </div>
    </div>
  )
}
