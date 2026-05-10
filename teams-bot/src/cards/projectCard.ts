import { ProjectSummary } from '../services/salesforce'

function fmt(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const statusColour: Record<string, string> = {
  'Planning':       'default',
  'In Progress':    'good',
  'Implementation': 'accent',
  'On Hold':        'warning',
  'Complete':       'good',
  'At Risk':        'attention',
}

export function buildProjectCard(project: ProjectSummary) {
  const facts = [
    { title: 'Account',  value: project.accountName },
    { title: 'Status',   value: project.status },
    { title: 'Owner',    value: project.ownerName },
    { title: 'Start',    value: fmt(project.startDate) },
    { title: 'End',      value: fmt(project.endDate) },
  ]

  if (project.risks) {
    facts.push({ title: '⚠ Risk', value: project.risks.slice(0, 120) })
  }

  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.5',
    body: [
      {
        type: 'TextBlock',
        text: project.name,
        size: 'Large',
        weight: 'Bolder',
        wrap: true,
        color: statusColour[project.status] ?? 'default',
      },
      {
        type: 'FactSet',
        facts,
      },
      ...(project.description ? [{
        type: 'TextBlock',
        text: project.description,
        wrap: true,
        isSubtle: true,
        size: 'Small',
      }] : []),
    ],
    actions: [
      {
        type: 'Action.ShowCard',
        title: 'Update end date',
        card: {
          type: 'AdaptiveCard',
          body: [
            { type: 'TextBlock', text: 'Pick a new end date:', wrap: true },
            { type: 'Input.Date', id: 'newDate', label: 'New end date' },
          ],
          actions: [
            {
              type: 'Action.Submit',
              title: 'Update',
              data: { action: 'updateDate', projectId: project.id, field: 'end' },
            },
          ],
        },
      },
      {
        type: 'Action.ShowCard',
        title: 'Log a note',
        card: {
          type: 'AdaptiveCard',
          body: [
            { type: 'TextBlock', text: 'Note:', wrap: true },
            { type: 'Input.Text', id: 'noteBody', isMultiline: true, placeholder: 'e.g. Discussed EU data center scope…' },
          ],
          actions: [
            {
              type: 'Action.Submit',
              title: 'Log',
              data: { action: 'logNote', projectId: project.id },
            },
          ],
        },
      },
    ],
  }
}
