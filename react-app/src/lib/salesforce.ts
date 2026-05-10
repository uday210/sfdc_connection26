import jsforce from 'jsforce'

let _conn: jsforce.Connection | null = null

export async function getSFConnection(): Promise<jsforce.Connection> {
  if (_conn && _conn.accessToken) {
    return _conn
  }

  const conn = new jsforce.Connection({
    loginUrl: process.env.SF_LOGIN_URL ?? 'https://login.salesforce.com',
  })

  await conn.login(
    process.env.SF_USERNAME!,
    process.env.SF_PASSWORD! + (process.env.SF_SECURITY_TOKEN ?? '')
  )

  _conn = conn
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
