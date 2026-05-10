export interface Account {
  Id: string
  Name: string
  Industry: string | null
  Type: string | null
  Phone: string | null
  Website: string | null
  BillingCity: string | null
  BillingState: string | null
  AnnualRevenue: number | null
  NumberOfEmployees: number | null
}

export interface Project {
  Id: string
  Name: string
  Status__c: string
  Start_Date__c: string | null
  End_Date__c: string | null
  Description__c: string | null
  Risks__c: string | null
  OwnerId: string
  Owner: { Name: string }
  Account__r: Account
  LastActivity?: string
}

export type ProjectStatus =
  | 'Planning'
  | 'In Progress'
  | 'Implementation'
  | 'On Hold'
  | 'Complete'
  | 'At Risk'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ActionResult {
  success: boolean
  message: string
}
