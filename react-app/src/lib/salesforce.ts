import jsforce from 'jsforce'

interface TokenCache {
  conn: jsforce.Connection
  expiresAt: number
}

let _cache: TokenCache | null = null

async function fetchToken(): Promise<{ accessToken: string; instanceUrl: string }> {
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
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Salesforce OAuth failed: ${err}`)
  }
  const json = await res.json() as { access_token: string; instance_url: string }
  return { accessToken: json.access_token, instanceUrl: json.instance_url }
}

export async function getSFConnection(): Promise<jsforce.Connection> {
  // Reuse cached connection if it hasn't expired (refresh 5 min before expiry)
  if (_cache && Date.now() < _cache.expiresAt) {
    return _cache.conn
  }

  const { accessToken, instanceUrl } = await fetchToken()
  const conn = new jsforce.Connection({ instanceUrl, accessToken })

  // Client credentials tokens last 2 hours by default; cache for 110 min
  _cache = { conn, expiresAt: Date.now() + 110 * 60 * 1000 }
  return conn
}

export async function getProjects() {
  const conn = await getSFConnection()
  const result = await conn.query<Record<string, unknown>>(`
    SELECT Id, Name, Status__c, Start_Date__c, End_Date__c,
           Description__c, Risks__c, OwnerId, Owner.Name,
           Account__r.Id, Account__r.Name, Account__r.Industry,
           Account__r.Type, Account__r.Phone, Account__r.Website,
           Account__r.BillingCity, Account__r.BillingState,
           Account__r.AnnualRevenue, Account__r.NumberOfEmployees
    FROM Project__c
    ORDER BY Account__r.Name, Name
  `)
  return result.records
}

export async function getProject(id: string) {
  const conn = await getSFConnection()
  const result = await conn.query<Record<string, unknown>>(`
    SELECT Id, Name, Status__c, Start_Date__c, End_Date__c,
           Description__c, Risks__c, OwnerId, Owner.Name,
           Account__r.Id, Account__r.Name, Account__r.Industry,
           Account__r.Type, Account__r.Phone, Account__r.Website,
           Account__r.BillingCity, Account__r.BillingState,
           Account__r.AnnualRevenue, Account__r.NumberOfEmployees
    FROM Project__c
    WHERE Id = '${id}'
    LIMIT 1
  `)
  return result.records[0] ?? null
}

export async function updateProjectDate(
  projectId: string,
  field: 'start' | 'end',
  newDate: string
) {
  const conn = await getSFConnection()
  const fieldName = field === 'start' ? 'Start_Date__c' : 'End_Date__c'
  await conn.sobject('Project__c').update({ Id: projectId, [fieldName]: newDate })
  return { success: true }
}

export async function logProjectNote(projectId: string, noteBody: string) {
  const conn = await getSFConnection()
  await conn.sobject('Task').create({
    Subject: 'Voice note',
    Description: noteBody,
    WhatId: projectId,
    Status: 'Completed',
    ActivityDate: new Date().toISOString().split('T')[0],
    Priority: 'Normal',
  })
  return { success: true }
}

export async function getRecentActivity(projectId: string) {
  const conn = await getSFConnection()
  const result = await conn.query<Record<string, unknown>>(`
    SELECT Subject, ActivityDate
    FROM Task
    WHERE WhatId = '${projectId}'
    ORDER BY CreatedDate DESC
    LIMIT 1
  `)
  if (result.records.length === 0) return null
  const t = result.records[0]
  return `${t['Subject']}${t['ActivityDate'] ? ' on ' + t['ActivityDate'] : ''}`
}
