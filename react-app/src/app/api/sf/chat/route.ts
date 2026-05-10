import { NextRequest, NextResponse } from 'next/server'
import { getProjects, updateProjectDate, logProjectNote } from '@/lib/salesforce'

// Simple intent-matching chat that calls Salesforce actions directly.
// Swap for Agentforce Headless API when org config is ready.
export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    const text = (message as string).toLowerCase()

    if (text.includes('status') || text.includes('summary') || text.includes('brief') || text.includes('plate')) {
      const projects = await getProjects()
      const atRisk = (projects as Record<string, unknown>[]).filter((p) => p['Status__c'] === 'At Risk')
      const inProgress = (projects as Record<string, unknown>[]).filter((p) => p['Status__c'] === 'In Progress' || p['Status__c'] === 'Implementation')
      let reply = `You have ${projects.length} projects total. `
      if (atRisk.length > 0) {
        reply += `${atRisk.length} at risk: ${atRisk.map((p) => (p['Name'] as string)).join(', ')}. `
      }
      if (inProgress.length > 0) {
        reply += `${inProgress.length} active: ${inProgress.map((p) => (p['Name'] as string)).join(', ')}.`
      }
      return NextResponse.json({ reply })
    }

    return NextResponse.json({
      reply: `I heard: "${message}". To use full AI commands, connect the Agentforce Headless API. For now try: "what's on my plate", "project status", or use the dashboard cards to update dates and log notes directly.`,
    })
  } catch (err) {
    console.error('POST /api/sf/chat:', err)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
