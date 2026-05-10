import jsforce from 'jsforce'

interface TokenCache { conn: jsforce.Connection; expiresAt: number }
let _cache: TokenCache | null = null

async function getConn(): Promise<jsforce.Connection> {
  if (_cache && Date.now() < _cache.expiresAt) return _cache.conn

  const res = await fetch(
    `${process.env.SF_LOGIN_URL ?? 'https://login.salesforce.com'}/services/oauth2/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'client_credentials',
        client_id:     process.env.SF_CLIENT_ID!,
        client_secret: process.env.SF_CLIENT_SECRET!,
      }),
    }
  )
  if (!res.ok) throw new Error(`Salesforce OAuth failed: ${await res.text()}`)
  const { access_token, instance_url } = await res.json() as { access_token: string; instance_url: string }
  const conn = new jsforce.Connection({ instanceUrl: instance_url, accessToken: access_token })
  _cache = { conn, expiresAt: Date.now() + 110 * 60 * 1000 }
  return conn
}

export interface ProjectSummary {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
  ownerName: string
  accountName: string
  risks: string
  description: string
}

export async function findProjects(search: string): Promise<ProjectSummary[]> {
  const conn = await getConn()
  const term = `%${search}%`
  const res = await conn.query<Record<string, unknown>>(
    `SELECT Id, Name, Status__c, Start_Date__c, End_Date__c,
            Owner.Name, Account__r.Name, Risks__c, Description__c
     FROM Project__c
     WHERE Name LIKE '${term}'
     ORDER BY Name LIMIT 5`
  )
  return res.records.map(r => mapProject(r))
}

export async function getProjectById(id: string): Promise<ProjectSummary | null> {
  const conn = await getConn()
  const res = await conn.query<Record<string, unknown>>(
    `SELECT Id, Name, Status__c, Start_Date__c, End_Date__c,
            Owner.Name, Account__r.Name, Risks__c, Description__c
     FROM Project__c WHERE Id = '${id}' LIMIT 1`
  )
  if (!res.records.length) return null
  return mapProject(res.records[0])
}

export async function updateProjectDate(projectId: string, field: 'start' | 'end', newDate: string): Promise<string> {
  const conn = await getConn()
  const sfField = field === 'start' ? 'Start_Date__c' : 'End_Date__c'
  await conn.sobject('Project__c').update({ Id: projectId, [sfField]: newDate })
  return `${field === 'start' ? 'Start' : 'End'} date updated to ${newDate}.`
}

export async function logNote(projectId: string, noteBody: string): Promise<string> {
  const conn = await getConn()
  await conn.sobject('Task').create({
    Subject: 'Teams note',
    Description: noteBody,
    WhatId: projectId,
    Status: 'Completed',
    ActivityDate: new Date().toISOString().split('T')[0],
  })
  return 'Note logged successfully.'
}

function mapProject(r: Record<string, unknown>): ProjectSummary {
  const owner   = r['Owner']   as Record<string, unknown> | null
  const account = r['Account__r'] as Record<string, unknown> | null
  return {
    id:          r['Id']           as string,
    name:        r['Name']         as string,
    status:      r['Status__c']    as string,
    startDate:   r['Start_Date__c'] as string ?? '',
    endDate:     r['End_Date__c']   as string ?? '',
    ownerName:   owner?.['Name']   as string ?? '',
    accountName: account?.['Name'] as string ?? '',
    risks:       r['Risks__c']     as string ?? '',
    description: r['Description__c'] as string ?? '',
  }
}
