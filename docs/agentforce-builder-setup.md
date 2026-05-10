# Agentforce Builder — Manual Topic Wiring Guide

> GenAI planner and plugin metadata are not deployable via SFDX for SDO orgs.
> Complete this setup in Agentforce Builder UI. Takes ~20 minutes.

## Step 1 — Open the Agent

1. Go to Setup → **Agentforce Agents**
2. Click **Sales Copilot**
3. Click **Open in Builder**

---

## Step 2 — Add Topic: Get Project Summary

**Click "Add Topic"**

| Field | Value |
|---|---|
| Topic Label | Get Project Summary |
| Classification Description (Scope) | Use when the rep asks for a project status, briefing, summary, or any details about a specific project or account engagement. Example triggers: "give me the status of Northwind", "brief me on the Acme migration", "what's the latest on Globex", "how is the Contoso project going". Do NOT use for date changes or note logging. |

**Instructions (paste exactly):**
```
1. Extract the project name or account name from the rep's request. It may be a partial name or nickname.
2. Call GetProjectSummary with the extracted identifier.
3. If found=false and multipleMatches=false, tell the rep no project was found and ask them to try a different name.
4. If multipleMatches=true, call FindProject with the same identifier and read back the matches. Ask which one they meant.
5. Once found, speak back the voiceSummary field. Keep it natural — do not read raw field names or IDs.
6. After the summary, offer: "Would you like to update a date or log a note on this project?"
```

**Add Actions:**
- Click **Add Action** → Search `SalesCopilot_GetProjectSummary` → Add
- Click **Add Action** → Search `SalesCopilot_FindProject` → Add
- Set `SalesCopilot_GetProjectSummary` as the **primary action**

---

## Step 3 — Add Topic: Update Project Date

**Click "Add Topic"**

| Field | Value |
|---|---|
| Topic Label | Update Project Date |
| Classification Description (Scope) | Use when the rep asks to push, move, shift, extend, or change a project date. Example triggers: "push the Northwind end date by two weeks", "move Acme go-live to June 30", "shift the Globex start date out a month". Do NOT use for logging notes or retrieving summaries. |

**Instructions:**
```
1. Identify the project and which date to change (start or end). If unclear, ask.
2. Determine the new date. If rep says "push by two weeks", first call GetProjectSummary to get the current date, then calculate the new value.
3. ALWAYS confirm before writing. Say: "Just to confirm — I'll move [project] [start/end] date from [old] to [new]. Shall I go ahead?" Wait for yes.
4. If yes, call UpdateProjectDate with the project ID, field (start or end), and the new date.
5. Speak back the voiceConfirmation field.
6. After confirming, ask if they also want to log a note about the reason.
```

**Add Actions:**
- `SalesCopilot_GetProjectSummary`
- `SalesCopilot_FindProject`
- `SalesCopilot_UpdateProjectDate` → mark **Requires Confirmation**

---

## Step 4 — Add Topic: Log Project Note

**Click "Add Topic"**

| Field | Value |
|---|---|
| Topic Label | Log Project Note |
| Classification Description (Scope) | Use when the rep wants to log a note, record a meeting outcome, capture a decision, or add an activity against a project. Example triggers: "log a note on Northwind that scope expanded to EU", "add an activity for Acme — discussed budget with Priya". Do NOT use for date changes or project summaries. |

**Instructions:**
```
1. Identify the project. If not clear, ask.
2. Extract the note content. Clean up filler words (um, uh). Keep the meaning intact.
3. ALWAYS confirm before logging. Say: "I'll log this note on [project] at [account]: '[note text]'. Go ahead?" Wait for yes.
4. Call LogProjectNote with the project ID and note body.
5. Speak back the voiceConfirmation.
6. Offer: "Would you like to do anything else with this project?"
```

**Add Actions:**
- `SalesCopilot_GetProjectSummary`
- `SalesCopilot_FindProject`
- `SalesCopilot_LogProjectNote` → mark **Requires Confirmation**

---

## Step 5 — Add Topic: What's On My Plate

**Click "Add Topic"**

| Field | Value |
|---|---|
| Topic Label | What Is On My Plate |
| Classification Description (Scope) | Use when the rep asks for a workload overview or wants to know what needs attention. Example triggers: "what's on my plate", "what projects need my attention", "what's at risk this week", "do I have anything overdue". Do NOT use when the rep names a specific project. |

**Instructions:**
```
1. Call FindProject with a broad search to get the rep's projects.
2. Filter for Status = "At Risk" or End_Date before today.
3. Return up to 3. For each: "[Project] at [Account] — [status], due [end date]. [Risk if any]."
4. Keep total response under 6 sentences. Prioritize At Risk over overdue.
5. End with: "Would you like a full summary or to take action on any of these?"
6. If none flagged: "You have no at-risk or overdue projects right now. Nice work!"
```

**Add Actions:**
- `SalesCopilot_FindProject`
- `SalesCopilot_GetProjectSummary`

---

## Step 6 — Activate and Test

1. Click **Activate** on the agent
2. Click **Preview** → select **Voice Preview**
3. Test with:
   - *"Give me a summary of the Northwind cloud migration"*
   - *"Push the end date by two weeks"*
   - *"Log a note that scope expanded to include EU data center"*
   - *"What's on my plate?"*

---

## Step 7 — Check Event Logs

After testing, go to **Setup → Event Log Files** to verify:
- Conversation transcript logged
- Actions invoked correctly
- No errors in the agent execution log
