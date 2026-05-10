import {
  ActivityHandler,
  MessageFactory,
  TurnContext,
  CardFactory,
} from 'botbuilder'
import { findProjects, getProjectById, updateProjectDate, logNote } from './services/salesforce'
import { buildProjectCard } from './cards/projectCard'
import { buildConfirmCard } from './cards/confirmCard'

export class SalesCopilotBot extends ActivityHandler {
  constructor() {
    super()

    this.onMessage(async (ctx, next) => {
      const activity = ctx.activity

      // Adaptive Card submit action
      if (activity.value) {
        await this.handleCardAction(ctx, activity.value as Record<string, unknown>)
        await next()
        return
      }

      const text = (activity.text ?? '').trim()
      if (!text) { await next(); return }

      await this.handleText(ctx, text)
      await next()
    })

    this.onMembersAdded(async (ctx, next) => {
      for (const member of ctx.activity.membersAdded ?? []) {
        if (member.id !== ctx.activity.recipient.id) {
          await ctx.sendActivity(
            "👋 Hey, Sales Copilot here! I can help you check project status, update dates, or log notes — all from Teams.\n\nTry: **status Northwind** or **show Acme**"
          )
        }
      }
      await next()
    })
  }

  private async handleText(ctx: TurnContext, text: string) {
    const lower = text.toLowerCase()

    // status / show / find <name>
    const match = lower.match(/^(?:status|show|find|project|get|brief me on)\s+(.+)/)
    if (match) {
      const term = match[1].trim()
      const projects = await findProjects(term)
      if (!projects.length) {
        await ctx.sendActivity(`No projects found matching **"${term}"**.`)
        return
      }
      if (projects.length === 1) {
        await ctx.sendActivity({
          attachments: [CardFactory.adaptiveCard(buildProjectCard(projects[0]))],
        })
        return
      }
      // Multiple — list options
      const list = projects.map((p, i) => `${i + 1}. **${p.name}** (${p.accountName}) — ${p.status}`).join('\n')
      await ctx.sendActivity(`Found ${projects.length} matches:\n\n${list}\n\nReply with the number or a more specific name.`)
      return
    }

    // help
    if (lower.includes('help') || lower === 'hi' || lower === 'hello') {
      await ctx.sendActivity(
        '**Sales Copilot — available commands:**\n\n' +
        '• `status <project name>` — get project card\n' +
        '• `show <project name>` — same as status\n' +
        '• `help` — this message\n\n' +
        'You can also update dates and log notes using the buttons on a project card.'
      )
      return
    }

    await ctx.sendActivity(`Sorry, I didn't understand that. Try **status <project name>** or type **help**.`)
  }

  private async handleCardAction(ctx: TurnContext, value: Record<string, unknown>) {
    const action = value['action'] as string

    if (action === 'cancel') {
      await ctx.sendActivity('Action cancelled.')
      return
    }

    if (action === 'updateDate') {
      const projectId = value['projectId'] as string
      const field     = value['field']     as 'start' | 'end'
      const newDate   = value['newDate']   as string
      const confirmed = value['confirmed'] as boolean | undefined

      if (!newDate) { await ctx.sendActivity('Please pick a date first.'); return }

      if (!confirmed) {
        const project = await getProjectById(projectId)
        const msg = `Move **${project?.name ?? projectId}** ${field} date to **${newDate}**?`
        await ctx.sendActivity({
          attachments: [CardFactory.adaptiveCard(
            buildConfirmCard(msg, { action: 'updateDate', projectId, field, newDate })
          )],
        })
        return
      }

      const result = await updateProjectDate(projectId, field, newDate)
      await ctx.sendActivity(`✅ ${result}`)
      return
    }

    if (action === 'logNote') {
      const projectId = value['projectId'] as string
      const noteBody  = value['noteBody']  as string
      const confirmed = value['confirmed'] as boolean | undefined

      if (!noteBody?.trim()) { await ctx.sendActivity('Please enter a note first.'); return }

      if (!confirmed) {
        const project = await getProjectById(projectId)
        const msg = `Log this note on **${project?.name ?? projectId}**?\n\n_"${noteBody}"_`
        await ctx.sendActivity({
          attachments: [CardFactory.adaptiveCard(
            buildConfirmCard(msg, { action: 'logNote', projectId, noteBody })
          )],
        })
        return
      }

      const result = await logNote(projectId, noteBody)
      await ctx.sendActivity(`✅ ${result}`)
      return
    }
  }
}
