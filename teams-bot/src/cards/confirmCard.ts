export function buildConfirmCard(message: string, confirmData: Record<string, unknown>) {
  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.5',
    body: [
      {
        type: 'TextBlock',
        text: '⚠️ Confirm Action',
        weight: 'Bolder',
        size: 'Medium',
      },
      {
        type: 'TextBlock',
        text: message,
        wrap: true,
      },
    ],
    actions: [
      {
        type: 'Action.Submit',
        title: '✅ Yes, proceed',
        style: 'positive',
        data: { ...confirmData, confirmed: true },
      },
      {
        type: 'Action.Submit',
        title: '❌ Cancel',
        data: { action: 'cancel' },
      },
    ],
  }
}
