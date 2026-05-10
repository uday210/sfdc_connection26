import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSFConnection } from '@/lib/salesforce'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// MCP-style tools — each one calls Salesforce directly via client credentials
const tools: Anthropic.Tool[] = [
  {
    name: 'get_projects',
    description: 'Get all Salesforce projects with their status, dates, owner, account, and risk info. Use for "what\'s on my plate", "show all projects", status overviews.',
    input_schema: {
      type: 'object' as const,
      properties: {
        filter_status: {
          type: 'string',
          description: 'Optional status to filter by: Planning, In Progress, Implementation, On Hold, Complete, At Risk',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_project_detail',
    description: 'Get detailed info on a single project by name (partial match). Use when user asks about a specific project.',
    input_schema: {
      type: 'object' as const,
      properties: {
        project_name: { type: 'string', description: 'Project name or partial name to search for' },
      },
      required: ['project_name'],
    },
  },
  {
    name: 'update_project_date',
    description: 'Update the start or end date of a project. Always confirm with the user before calling this.',
    input_schema: {
      type: 'object' as const,
      properties: {
        project_id:  { type: 'string', description: 'Salesforce Project__c record Id' },
        date_field:  { type: 'string', enum: ['start', 'end'], description: 'Which date to update' },
        new_date:    { type: 'string', description: 'New date in YYYY-MM-DD format' },
      },
      required: ['project_id', 'date_field', 'new_date'],
    },
  },
  {
    name: 'log_project_note',
    description: 'Log a note or activity on a project as a Salesforce Task. Always confirm with the user before calling this.',
    input_schema: {
      type: 'object' as const,
      properties: {
        project_id: { type: 'string', description: 'Salesforce Project__c record Id' },
        note_body:  { type: 'string', description: 'The note text to log' },
      },
      required: ['project_id', 'note_body'],
    },
  },
]

async function runTool(name: string, input: Record<string, unknown>): Promise<string> {
  const conn = await getSFConnection()

  if (name === 'get_projects') {
    const status = input['filter_status'] as string | undefined
    const where  = status ? `WHERE Status__c = '${status}'` : ''
    const res    = await conn.query<Record<string, unknown>>(
      `SELECT Id, Name, Status__c, Start_Date__c, End_Date__c, Risks__c,
              Owner.Name, Account__r.Name
       FROM Project__c ${where} ORDER BY Account__r.Name, Name`
    )
    return JSON.stringify(res.records.map(r => ({
      id:      r['Id'],
      name:    r['Name'],
      status:  r['Status__c'],
      start:   r['Start_Date__c'],
      end:     r['End_Date__c'],
      risks:   r['Risks__c'] ?? null,
      owner:   (r['Owner'] as Record<string,unknown>)?.['Name'],
      account: (r['Account__r'] as Record<string,unknown>)?.['Name'],
    })))
  }

  if (name === 'get_project_detail') {
    const term = (input['project_name'] as string).replace(/'/g, "\\'")
    const res  = await conn.query<Record<string, unknown>>(
      `SELECT Id, Name, Status__c, Start_Date__c, End_Date__c,
              Description__c, Risks__c, Owner.Name, Account__r.Name
       FROM Project__c WHERE Name LIKE '%${term}%' LIMIT 3`
    )
    if (!res.records.length) return JSON.stringify({ error: 'No project found matching that name' })
    return JSON.stringify(res.records)
  }

  if (name === 'update_project_date') {
    const field = (input['date_field'] as string) === 'start' ? 'Start_Date__c' : 'End_Date__c'
    await conn.sobject('Project__c').update({
      Id: input['project_id'] as string,
      [field]: input['new_date'] as string,
    })
    return JSON.stringify({ success: true, message: `${input['date_field']} date updated to ${input['new_date']}` })
  }

  if (name === 'log_project_note') {
    await conn.sobject('Task').create({
      Subject: 'Copilot note',
      Description: input['note_body'] as string,
      WhatId: input['project_id'] as string,
      Status: 'Completed',
      ActivityDate: new Date().toISOString().split('T')[0],
      Priority: 'Normal',
    })
    return JSON.stringify({ success: true, message: 'Note logged successfully' })
  }

  return JSON.stringify({ error: `Unknown tool: ${name}` })
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: message as string }
    ]

    // Agentic loop — Claude calls tools until done
    let response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      system: `You are Sales Copilot, a concise AI assistant for a sales team's Salesforce projects.
You have tools to query and update Salesforce projects. Always be brief and direct.
When asked about project status or "what's on my plate", call get_projects.
For write operations (update date, log note), confirm the action first in your reply.
Format dates as "Month Day, Year". Use plain text, no markdown.`,
      tools,
      messages,
    })

    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]

      // Run all tool calls in parallel
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => ({
          type: 'tool_result' as const,
          tool_use_id: block.id,
          content: await runTool(block.name, block.input as Record<string, unknown>),
        }))
      )

      messages.push({ role: 'assistant', content: response.content })
      messages.push({ role: 'user', content: toolResults })

      response = await anthropic.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 1024,
        system: messages[0] ? undefined : undefined,
        tools,
        messages,
      })
    }

    const textBlock = response.content.find(b => b.type === 'text') as Anthropic.TextBlock | undefined
    return NextResponse.json({ reply: textBlock?.text ?? 'No response generated.' })

  } catch (err) {
    console.error('POST /api/sf/chat:', err)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
