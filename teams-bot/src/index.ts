import 'dotenv/config'
import express from 'express'
import { CloudAdapter, ConfigurationBotFrameworkAuthentication } from 'botbuilder'
import { SalesCopilotBot } from './bot'

const app  = express()
const port = parseInt(process.env.PORT ?? '3978', 10)

app.use(express.json())

const auth    = new ConfigurationBotFrameworkAuthentication({
  MicrosoftAppId:     process.env.BOT_APP_ID,
  MicrosoftAppPassword: process.env.BOT_APP_PASSWORD,
  MicrosoftAppType:   'MultiTenant',
})
const adapter = new CloudAdapter(auth)
const bot     = new SalesCopilotBot()

adapter.onTurnError = async (ctx, error) => {
  console.error('[Bot error]', error)
  await ctx.sendActivity('Something went wrong. Please try again.')
}

app.post('/api/messages', async (req, res) => {
  await adapter.process(req, res, ctx => bot.run(ctx))
})

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

app.listen(port, () => console.log(`Sales Copilot Teams bot listening on port ${port}`))
