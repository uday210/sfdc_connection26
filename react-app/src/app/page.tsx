'use client'

import { useEffect, useState, useCallback } from 'react'
import { AccountSidebar } from '@/components/AccountSidebar'
import { Account360Panel } from '@/components/Account360Panel'
import { AICopilotPanel } from '@/components/AICopilotPanel'
import { TopBar } from '@/components/TopBar'

export type Project = {
  Id: string
  Name: string
  Status__c: string
  Start_Date__c: string
  End_Date__c: string
  Description__c: string
  Risks__c: string
  Owner: { Name: string }
  Account__r: {
    Id: string
    Name: string
    Industry: string
    Type: string
    Phone: string
    Website: string
    BillingCity: string
    BillingState: string
    AnnualRevenue: number
    NumberOfEmployees: number
  }
}

export type Account = {
  id: string
  name: string
  industry: string
  projects: Project[]
  healthScore: number
  healthLabel: 'Healthy' | 'Watch' | 'At Risk'
}

function computeHealth(projects: Project[]): { score: number; label: Account['healthLabel'] } {
  if (!projects.length) return { score: 50, label: 'Watch' }
  let score = 100
  for (const p of projects) {
    if (p.Status__c === 'At Risk') score -= 30
    if (p.Risks__c) score -= 15
    if (p.Status__c === 'On Hold') score -= 10
    if (p.Status__c === 'Complete') score += 5
  }
  score = Math.max(0, Math.min(100, score))
  const label: Account['healthLabel'] = score >= 70 ? 'Healthy' : score >= 40 ? 'Watch' : 'At Risk'
  return { score, label }
}

export default function CommandCenter() {
  const [projects, setProjects] = useState<Project[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    fetch('/api/sf/projects')
      .then(r => r.json())
      .then(d => {
        const raw: Project[] = d.projects ?? []
        setProjects(raw)

        const byAccount = raw.reduce<Record<string, Project[]>>((acc, p) => {
          const id = p.Account__r?.Id ?? 'unknown'
          ;(acc[id] ??= []).push(p)
          return acc
        }, {})

        const accts: Account[] = Object.entries(byAccount).map(([id, projs]) => {
          const { score, label } = computeHealth(projs)
          return {
            id,
            name: projs[0].Account__r?.Name ?? 'Unknown',
            industry: projs[0].Account__r?.Industry ?? '',
            projects: projs,
            healthScore: score,
            healthLabel: label,
          }
        }).sort((a, b) => a.healthScore - b.healthScore)

        setAccounts(accts)
        if (!selectedAccountId && accts.length) {
          setSelectedAccountId(accts[0].id)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selectedAccountId])

  useEffect(() => { refresh() }, [])

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) ?? null

  const stats = {
    pipeline: projects.length,
    atRisk: projects.filter(p => p.Status__c === 'At Risk' || p.Risks__c).length,
    active: projects.filter(p => ['In Progress', 'Implementation'].includes(p.Status__c)).length,
    accounts: accounts.length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)' }}>
      <TopBar stats={stats} loading={loading} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Account list */}
        <AccountSidebar
          accounts={accounts}
          selectedId={selectedAccountId}
          onSelect={setSelectedAccountId}
          loading={loading}
        />

        {/* Center: Account 360 */}
        <Account360Panel
          account={selectedAccount}
          loading={loading}
          onRefresh={refresh}
        />

        {/* Right: AI Copilot */}
        <AICopilotPanel account={selectedAccount} />
      </div>
    </div>
  )
}
