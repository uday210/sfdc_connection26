'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Calendar, User, AlertTriangle, FileText, Check, X } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'

function fmt(d: unknown) {
  if (!d) return '—'
  return new Date(d as string).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  // Date update state
  const [dateField, setDateField]     = useState<'start' | 'end'>('end')
  const [newDate, setNewDate]         = useState('')
  const [confirmDate, setConfirmDate] = useState(false)
  const [dateMsg, setDateMsg]         = useState('')

  // Note state
  const [note, setNote]               = useState('')
  const [confirmNote, setConfirmNote] = useState(false)
  const [noteMsg, setNoteMsg]         = useState('')

  useEffect(() => {
    fetch(`/api/sf/projects/${id}`)
      .then(r => r.json())
      .then(d => { setProject(d.project); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const submitDate = async () => {
    const res  = await fetch('/api/sf/update-date', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: id, field: dateField, newDate }),
    })
    const data = await res.json()
    setDateMsg(data.message ?? data.error)
    setConfirmDate(false)
    setNewDate('')
    if (data.success) {
      setProject(p => p ? { ...p, [`${dateField === 'start' ? 'Start' : 'End'}_Date__c`]: newDate } : p)
    }
  }

  const submitNote = async () => {
    const res  = await fetch('/api/sf/log-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: id, noteBody: note }),
    })
    const data = await res.json()
    setNoteMsg(data.message ?? data.error)
    setConfirmNote(false)
    setNote('')
  }

  if (loading) return <div className="text-sm text-gray-400 py-12 text-center">Loading…</div>
  if (!project) return <div className="text-sm text-red-500 py-12 text-center">Project not found.</div>

  const account = project['Account__r'] as Record<string, unknown>
  const owner   = project['Owner']     as Record<string, unknown>

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft size={15} /> Back to dashboard
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-900">{project['Name'] as string}</h1>
          <StatusBadge status={project['Status__c'] as string} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Building2 size={14} /> <span className="font-medium">{account?.['Name'] as string}</span>
            <span className="text-gray-400">· {account?.['Industry'] as string}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <User size={14} /> {owner?.['Name'] as string}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={14} /> {fmt(project['Start_Date__c'])} → {fmt(project['End_Date__c'])}
          </div>
          {account?.['Phone'] && (
            <div className="text-gray-500">{account['Phone'] as string}</div>
          )}
        </div>

        {project['Description__c'] && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">
            {project['Description__c'] as string}
          </p>
        )}

        {project['Risks__c'] && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3">
            <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{project['Risks__c'] as string}</p>
          </div>
        )}

        {project['LastActivity'] && (
          <p className="text-xs text-gray-400">Last activity: {project['LastActivity'] as string}</p>
        )}
      </div>

      {/* Account detail card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Account Details</h2>
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
          {[
            ['Type',       account?.['Type']],
            ['Location',   [account?.['BillingCity'], account?.['BillingState']].filter(Boolean).join(', ')],
            ['Revenue',    account?.['AnnualRevenue'] ? `$${Number(account['AnnualRevenue']).toLocaleString()}` : null],
            ['Employees',  account?.['NumberOfEmployees'] ? Number(account['NumberOfEmployees']).toLocaleString() : null],
            ['Website',    account?.['Website']],
            ['Phone',      account?.['Phone']],
          ].filter(([, v]) => Boolean(v)).map(([label, value]) => (
            <div key={label as string}>
              <span className="text-gray-400 text-xs">{label}</span>
              <p className="font-medium truncate">{value as string}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Update date */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Update Project Date</h2>
        {dateMsg && <p className="text-sm text-green-600">{dateMsg}</p>}
        {!confirmDate ? (
          <div className="flex gap-3">
            <select value={dateField} onChange={e => setDateField(e.target.value as 'start' | 'end')}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="start">Start date</option>
              <option value="end">End date</option>
            </select>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1" />
            <button disabled={!newDate} onClick={() => setConfirmDate(true)}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40">
              Update
            </button>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
            <p className="text-sm text-amber-800">
              Confirm: move <strong>{project['Name'] as string}</strong> {dateField} date to <strong>{fmt(newDate)}</strong>?
            </p>
            <div className="flex gap-2">
              <button onClick={submitDate} className="flex items-center gap-1.5 bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-green-700">
                <Check size={14} /> Yes, update
              </button>
              <button onClick={() => setConfirmDate(false)} className="flex items-center gap-1.5 bg-gray-200 text-gray-700 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-300">
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log note */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FileText size={15} /> Log a Note
        </h2>
        {noteMsg && <p className="text-sm text-green-600">{noteMsg}</p>}
        {!confirmNote ? (
          <div className="flex gap-3">
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="e.g. Discussed EU data center scope with client…"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
            <button disabled={!note.trim()} onClick={() => setConfirmNote(true)}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-40 self-start">
              Log
            </button>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
            <p className="text-sm text-amber-800">Log this note on <strong>{project['Name'] as string}</strong>: <em>"{note}"</em>?</p>
            <div className="flex gap-2">
              <button onClick={submitNote} className="flex items-center gap-1.5 bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-green-700">
                <Check size={14} /> Yes, log it
              </button>
              <button onClick={() => setConfirmNote(false)} className="flex items-center gap-1.5 bg-gray-200 text-gray-700 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-300">
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
