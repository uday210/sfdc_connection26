'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Building2 } from 'lucide-react'
import { ProjectCard } from '@/components/ProjectCard'
import { ChatInterface } from '@/components/ChatInterface'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sf/projects')
      .then(r => r.json())
      .then(d => { setProjects(d.projects ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const total    = projects.length
  const active   = projects.filter(p => p['Status__c'] === 'In Progress' || p['Status__c'] === 'Implementation').length
  const atRisk   = projects.filter(p => p['Status__c'] === 'At Risk' || p['Risks__c']).length
  const accounts = new Set(projects.map(p => (p['Account__r'] as Record<string, unknown>)?.['Name'])).size

  // Group by account
  const byAccount = projects.reduce<Record<string, Record<string, unknown>[]>>((acc, p) => {
    const name = ((p['Account__r'] as Record<string, unknown>)?.['Name'] as string) ?? 'Unknown'
    ;(acc[name] ??= []).push(p)
    return acc
  }, {})

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: total,   icon: <Clock size={18} className="text-blue-500" /> },
          { label: 'Active',         value: active,  icon: <CheckCircle2 size={18} className="text-green-500" /> },
          { label: 'At Risk',        value: atRisk,  icon: <AlertTriangle size={18} className="text-red-500" /> },
          { label: 'Accounts',       value: accounts,icon: <Building2 size={18} className="text-indigo-500" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            {s.icon}
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '—' : s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main layout: project grid + chat */}
      <div className="flex gap-6 items-start">

        {/* Projects */}
        <div className="flex-1 min-w-0 space-y-6">
          {loading && (
            <p className="text-sm text-gray-400 text-center py-12">Loading projects…</p>
          )}
          {!loading && projects.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-12">No projects found. Check your Salesforce connection.</p>
          )}
          {!loading && Object.entries(byAccount).map(([accountName, acctProjects]) => (
            <div key={accountName}>
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={14} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-600">{accountName}</h2>
                <span className="text-xs text-gray-400">({acctProjects.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {acctProjects.map(p => (
                  <ProjectCard key={p['Id'] as string} project={p} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Chat sidebar */}
        <div className="w-[360px] shrink-0 sticky top-[73px] h-[calc(100vh-105px)]">
          <ChatInterface />
        </div>
      </div>
    </div>
  )
}
