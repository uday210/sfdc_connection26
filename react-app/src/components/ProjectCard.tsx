'use client'

import Link from 'next/link'
import { Building2, Calendar, AlertTriangle, User } from 'lucide-react'
import { StatusBadge } from './StatusBadge'

interface Props {
  project: Record<string, unknown>
}

function fmt(d: unknown) {
  if (!d) return '—'
  return new Date(d as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ProjectCard({ project }: Props) {
  const account = project['Account__r'] as Record<string, unknown>
  const owner = project['Owner'] as Record<string, unknown>
  const hasRisk = Boolean(project['Risks__c'])
  const isOverdue = project['End_Date__c']
    ? new Date(project['End_Date__c'] as string) < new Date()
    : false

  return (
    <Link href={`/projects/${project['Id']}`}>
      <div className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col gap-3 ${hasRisk || isOverdue ? 'border-red-200' : 'border-gray-200'}`}>

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
            {project['Name'] as string}
          </h3>
          <StatusBadge status={project['Status__c'] as string} />
        </div>

        {/* Account */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Building2 size={13} className="shrink-0" />
          <span className="truncate">{account?.['Name'] as string}</span>
          {account?.['Industry'] && (
            <span className="text-gray-400">· {account['Industry'] as string}</span>
          )}
        </div>

        {/* Dates */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Calendar size={13} className="shrink-0" />
          <span>{fmt(project['Start_Date__c'])} → {fmt(project['End_Date__c'])}</span>
          {isOverdue && <span className="text-red-500 font-medium ml-1">Overdue</span>}
        </div>

        {/* Owner */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <User size={13} className="shrink-0" />
          <span>{owner?.['Name'] as string}</span>
        </div>

        {/* Risk */}
        {hasRisk && (
          <div className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg p-2 mt-auto">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            <span className="line-clamp-2">{project['Risks__c'] as string}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
