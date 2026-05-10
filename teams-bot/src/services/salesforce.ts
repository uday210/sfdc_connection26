import jsforce from 'jsforce'

let _conn: jsforce.Connection | null = null

async function getConn(): Promise<jsforce.Connection> {
  if (_conn) return _conn
  const conn = new jsforce.Connection({ loginUrl: process.env.SF_LOGIN_URL ?? 'https://login.salesforce.com' })
  await conn.login(process.env.SF_USERNAME!, process.env.SF_PASSWORD! + (process.env.SF_SECURITY_TOKEN ?? ''))
  _conn = conn
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
