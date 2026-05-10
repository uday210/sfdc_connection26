# Sales Copilot — CNX26 POC Suite

> Project context for Claude Code. Read this first on every session.
> Last updated: 2026-05-10

## What this project is

A suite of **three interconnected POCs** for **Salesforce Connections 2026** (Chicago, June 3–4), all built around a single "Sales Copilot" agent and a shared data model. The unifying theme is **Headless 360**: one agent, multiple surfaces — voice phone call, Microsoft Teams chat, and programmatic API/MCP. Sales reps get CRM context and push updates from wherever they work, without opening Salesforce.

## Three POC tracks

| # | Track | Surface | Status |
|---|---|---|---|
| 1 | **Agentforce Voice** | Phone call via Amazon Connect | Partial — agent exists, not fully configured |
| 2 | **Headless 360** | MCP tools / API / any channel | Not started |
| 3 | **MS Teams Integration** | Teams bot / adaptive cards | Not started |

---

## Track 1 — Agentforce Voice + Amazon Connect

### What it demonstrates
Sales rep calls a real phone number → Amazon Connect routes to Agentforce Voice → rep gets CRM briefings and logs updates by speaking, hands-free.

### Target environment
- **Org type**: Salesforce SDO Lite from Partner Learning Camp
- **Voice stack**: Agentforce Voice (GA Oct 2025), tested via **Voice Preview** in Agentforce Builder
- **PSTN**: Amazon Connect (user has AWS account) → real phone number → Agentforce Voice contact flow
- **Region**: Canada (Voice GA region)

### Current agent config (partially built)
| Field | Value |
|---|---|
| Name | Sales Copilot |
| API Name | Sales_Copilot |
| Type | Service Agent (voice-optimized) |
| Agent User | dedicated user, profile = Einstein Agent User |
| Event logging | ON |

### What still needs configuring
- Topics not fully wired to actions
- Amazon Connect contact flow → Agentforce Voice not yet connected
- PSTN phone number not provisioned
- Confirmation flow on write operations incomplete

### Demo script (90-second stage moment)
```
REP   : Hey, give me a quick summary of the Northwind cloud migration.
AGENT : Northwind cloud migration is in implementation, on track to finish
        June 15. Last activity was a status call with Priya yesterday.
        One open risk flagged around data migration scope.
REP   : OK, push the end date by two weeks and log a note that scope
        expanded to include the EU data center.
AGENT : Just to confirm — move Northwind end date from June 15 to June 29,
        and log a note about EU data center scope expansion. Should I do both?
REP   : Yes.
AGENT : Done. End date updated, note logged on the project. Anything else?
```

### Amazon Connect setup notes
- Create an Amazon Connect instance in the AWS account
- Add a claimed phone number (US/Canada)
- Create a contact flow that routes to Agentforce Voice via the Salesforce + Amazon Connect integration (AppExchange managed package or direct API)
- Reference: Salesforce + Amazon Connect Agentforce Voice connector (available post Oct 2025 GA)

---

## Track 2 — Headless 360 (MCP / API surface)

### What it demonstrates
The **exact same Apex actions** from Track 1 are exposed as MCP tools, callable from Claude Code, Slack, a web app, or any AI agent. "Build once, render anywhere." This is the Headless 360 story — Agentforce as a headless capability layer, not just a chat widget.

### Architecture
```
Apex Actions (GetProjectSummary, UpdateProjectDate, LogProjectNote, FindProject)
       ↓
Agentforce API (headless invocation endpoint)  ←→  or direct Apex REST
       ↓
MCP Server (Node/Python bridge)
       ↓
Claude Code / Slack bot / custom UI / any LLM
```

### Demo scenarios
- **Claude Code**: "Summarize my at-risk projects" → MCP tool call → Apex → spoken/written summary
- **Slack**: slash command `/sfdc status Northwind` → MCP → Apex → Slack message with project card
- **Any agent**: Agentforce actions become universal tools for any AI system

### What to build
- [ ] Expose Apex actions as Agentforce External Service or REST endpoints
- [ ] Thin MCP server (Node.js or Python) that wraps those REST calls
- [ ] Register MCP server in Claude Code settings
- [ ] Demo: run "what's on my plate" from Claude Code terminal hitting live SFDC org

---

## Track 3 — Microsoft Teams Integration

### What it demonstrates
Sales reps can view Salesforce opportunity/project data and push updates **without leaving Microsoft Teams** — as a bot, adaptive card, or messaging extension. The Agentforce agent (or direct Salesforce REST API) powers it under the hood.

### Use cases
- **Opportunity update**: rep types `/sfdc update Northwind stage Closed Won` in Teams → bot updates Opportunity stage in Salesforce → confirms in chat
- **Project status card**: rep opens a record card in Teams showing live SFDC data, clicks "Update Status" → adaptive card form → writes back to Salesforce
- **AI-assisted**: message the Teams bot in natural language → Agentforce Headless API processes it → response back in Teams

### Architecture options
| Option | Complexity | Demo appeal |
|---|---|---|
| Teams bot (Bot Framework) + Salesforce REST API directly | Medium | High — fast, clean |
| Teams bot → Agentforce Headless API → Apex actions | Higher | Highest — shows H360 end-to-end |
| Teams messaging extension with adaptive cards | Medium | High — native Teams UX |

**Recommended approach for POC**: Teams bot + Agentforce Headless API. Shows the full H360 story and reuses the same Apex actions from Tracks 1 & 2.

### Demo script
```
REP (in Teams): @SalesCopilot what's the status of Northwind?
BOT           : Northwind Cloud Migration — Implementation phase.
                End date: June 15. One open risk: EU data center scope.
                Owner: Priya Singh. [Update Status] [Log Note] [View in Salesforce]
REP           : Push the end date by two weeks.
BOT           : Confirm: move Northwind end date from Jun 15 → Jun 29?
                [Confirm] [Cancel]
REP           : [clicks Confirm]
BOT           : Done. Northwind end date updated to June 29.
```

### What to build
- [ ] Azure Bot registration (free tier fine for POC)
- [ ] Node.js bot app (Bot Framework SDK)
- [ ] Connect bot to Agentforce Headless API or Salesforce REST
- [ ] Adaptive card templates for project summary + confirmation
- [ ] Teams App manifest + install to a test team
- [ ] Optional: Salesforce Connected App for OAuth flow

---

## Shared data model

> **Open question:** Custom `Project__c` object, or use `Opportunity` conversationally as "project"? Defaulting to `Project__c`.

`Project__c` schema:
- `Name`
- `OwnerId`
- `Status__c` (Picklist: Planning, In Progress, Implementation, On Hold, Complete, At Risk)
- `Start_Date__c` (Date)
- `End_Date__c` (Date)
- `Account__c` (Lookup → Account)
- `Description__c` (Long text)
- `Risks__c` (Long text)

Seed with 5–6 realistic projects across varied statuses and owners for demo.

---

## Shared Apex actions (used by all three tracks)

```
GetProjectSummary(projectIdentifier: String) → ProjectSummary
  - Resolves identifier → ProjectId (partial-name match)
  - Returns: name, status, start_date, end_date, owner_name, last_activity_text, risk_text
  - Voice-friendly: short fields, no IDs

FindProject(searchTerm: String) → List<ProjectMatch>
  - Disambiguation helper. Top 3 matches with name + account.

UpdateProjectDate(projectId: Id, dateField: String, newDate: Date) → ConfirmationResult
  - dateField: "start" or "end" only
  - Validates: end_date >= start_date, ownership check
  - Returns success/failure + new value for confirmation

LogProjectNote(projectId: Id, noteBody: String) → ConfirmationResult
  - Creates Task: Subject="Voice note", Description=noteBody, WhatId=projectId
```

All actions enforce: `OwnerId = $RunningUser.Id OR running user is on project team`.

---

## Identity / security

- **Voice Preview / Voice call**: caller = Salesforce user context passed by Agentforce Voice
- **PSTN via Amazon Connect**: ANI lookup against `User.Phone`, fall back to spoken PIN
- **Teams**: OAuth 2.0 flow — user authenticates once, bot uses their token for all SFDC calls
- **MCP/API**: Named credential or connected app with per-user OAuth
- Every write validates ownership server-side. Never trust the channel to filter.

---

## Build sequence (3.5 weeks to CNX)

**Week 1 (now → May 17)** — Foundation
- [ ] Confirm `Project__c` path (or Opportunity pivot)
- [ ] Create `Project__c` with seed data (5–6 records)
- [ ] Create Agent User + permission sets
- [ ] Stub all four Apex actions with hardcoded returns
- [ ] Verify Agentforce Voice license is active in SDO

**Week 2 (May 18–24)** — Voice agent + Amazon Connect
- [ ] Wire topics to actions in Agentforce Builder
- [ ] Confirmation flow on all write operations
- [ ] Test in Voice Preview end-to-end
- [ ] Provision Amazon Connect instance + phone number
- [ ] Connect Amazon Connect contact flow → Agentforce Voice
- [ ] Test with real phone call

**Week 3 (May 25–31)** — Headless 360 + Teams
- [ ] Expose Apex actions via REST / Agentforce Headless API
- [ ] Build thin MCP server, register in Claude Code
- [ ] Demo "what's on my plate" from Claude Code hitting live org
- [ ] Azure Bot registration + Node.js bot skeleton
- [ ] Connect Teams bot to Agentforce Headless or SFDC REST
- [ ] Adaptive cards for project summary + confirmation

**Week 4 (Jun 1–3)** — Polish + fallback
- [ ] Record polished demo video for each track (always have a fallback)
- [ ] Run-throughs with timing (90s per track max)
- [ ] Teams App manifest finalized + installed
- [ ] Practice live demo sequence

---

## Conventions for Claude Code

- Apex class naming: `SalesCopilot_*` prefix (e.g., `SalesCopilot_GetProjectSummary`)
- Tests: `_Test` suffix, ≥85% coverage, named methods (`testHappyPath`, `testOwnershipDenied`, `testInvalidDate`)
- Action input/output: inner classes marked `@InvocableVariable`
- All actions: `@InvocableMethod` with descriptive `label` and `description`
- Voice-spoken response strings: `static final` constants at top of class
- Never hardcode IDs. Use SOQL and `Schema.Project__c.SObjectType`.
- MCP server code lives in `/mcp-server/` directory
- Teams bot code lives in `/teams-bot/` directory

---

## Open questions

1. `Project__c` custom object, or pivot to `Opportunity`?
2. Demo venue — partner booth, session, Agentforce City, or internal run-through only?
3. Live PSTN demo on stage, or recorded video fallback for voice track?
4. Teams track: show bot in natural language (Agentforce Headless) or adaptive card form (SFDC REST direct)?
5. Which AWS region for Amazon Connect? (Match Salesforce org region)

---

## Key credentials / resources needed

- AWS account access (user confirmed they have this) — for Amazon Connect
- Salesforce SDO Lite org credentials
- Azure subscription (free tier OK) — for Teams bot registration
- Teams developer tenant or test team for bot installation
