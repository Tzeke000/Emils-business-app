# 🌙 Emil's Business App

**Emil** is an autonomous AI business agent guided by the moon. This app is Emil's operating system — it gives her task management, earnings tracking, desktop control, activity logging, work sessions, persistent memory, and WhatsApp reporting.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Entities (Data Models)](#entities-data-models)
- [Emil's Core Capabilities](#emils-core-capabilities)
- [Task Lifecycle](#task-lifecycle)
- [Activity Logging (Proof System)](#activity-logging-proof-system)
- [Work Sessions](#work-sessions)
- [Memory & Continuity](#memory--continuity)
- [Desktop Control Bridge](#desktop-control-bridge)
- [Desktop Profiles](#desktop-profiles)
- [Approval Gates](#approval-gates)
- [WhatsApp Rules](#whatsapp-rules)
- [Earnings Attribution](#earnings-attribution)
- [App Pages](#app-pages)
- [Tech Stack](#tech-stack)

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│            Base44 Web App               │
│  ┌───────────┐  ┌──────────┐           │
│  │ Dashboard  │  │  Chat    │  ← User talks to Emil here
│  │ Tasks      │  │  Agent   │           │
│  │ Earnings   │  │  (LLM)   │           │
│  │ Activity   │  │          │           │
│  │ Sessions   │  │          │           │
│  │ Settings   │  │          │           │
│  └───────────┘  └──────────┘           │
│         │              │                │
│  ┌──────────────────────────┐          │
│  │     Entity Database       │          │
│  │  AgentTask, Earning,      │          │
│  │  ActivityLog, WorkSession,│          │
│  │  EmilMemory, AgentConfig, │          │
│  │  DesktopProfile           │          │
│  └──────────────────────────┘          │
└─────────────────────────────────────────┘
         │
         │ (Bridge Commands)
         ▼
┌─────────────────────────────┐
│  Desktop Control Bridge      │
│  127.0.0.1:47821             │
│  (Local Windows PC)          │
│  - Screenshot capture        │
│  - Mouse/keyboard control    │
│  - Window management         │
│  - OCR / screen reading      │
└─────────────────────────────┘
```

---

## Entities (Data Models)

### AgentTask
The core work unit. Every piece of work Emil does is tracked as a task.

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | **Required.** Task title |
| `description` | string | Detailed description |
| `status` | enum | `queued`, `active`, `blocked`, `waiting_on_user`, `completed`, `failed`, `abandoned`, `retried` |
| `category` | enum | `research`, `content_creation`, `outreach`, `development`, `marketing`, `analytics`, `desktop_control`, `other` |
| `priority` | enum | `low`, `medium`, `high`, `critical` |
| `source` | enum | `emil_auto`, `user_request`, `scheduled`, `retry`, `dependency` |
| `started_at` | datetime | When work began |
| `completed_at` | datetime | When task finished |
| `blocker_reason` | string | Why the task is blocked |
| `result_summary` | string | What happened when done |
| `artifact_link` | string | URL or path to output |
| `next_step` | string | Follow-up action |
| `session_id` | string | Which work session this belongs to |
| `requires_approval` | boolean | Whether user must approve first |
| `approval_status` | enum | `not_needed`, `pending`, `approved`, `rejected` |
| `revenue_generated` | number | Revenue from this task in USD |

### Earning
Revenue tracking with attribution and confidence levels.

| Field | Type | Description |
|-------|------|-------------|
| `source` | string | **Required.** Revenue source name |
| `amount` | number | **Required.** Amount in USD |
| `category` | enum | `freelance`, `content`, `affiliate`, `product_sales`, `consulting`, `ads`, `other` |
| `status` | enum | `pending`, `confirmed`, `collected`, `paid_out`, `disputed` |
| `task_id` | string | Task that generated this earning |
| `session_id` | string | Work session that produced this |
| `client` | string | Client or platform name |
| `expected_amount` | number | Expected amount before confirmation |
| `confidence` | enum | `confirmed`, `likely`, `speculative` |
| `notes` | string | Additional notes |

### ActivityLog
Proof of every action Emil takes. **This is how the user verifies trust.**

| Field | Type | Description |
|-------|------|-------------|
| `action_type` | enum | **Required.** `mouse_click`, `keyboard_input`, `window_focus`, `screenshot`, `ocr_read`, `app_open`, `browser_navigate`, `file_operation`, `api_call`, `task_update`, `earning_logged`, `approval_request`, `error`, `other` |
| `description` | string | **Required.** Human-readable description |
| `app_window` | string | App or window where action occurred |
| `command_sent` | string | Exact bridge command or API call |
| `result` | enum | `success`, `failed`, `partial`, `pending`, `skipped` |
| `confidence` | number | 0-1 confidence the action succeeded |
| `screenshot_path` | string | Path to verification screenshot |
| `error_message` | string | Error details if failed |
| `task_id` | string | Related task ID |
| `session_id` | string | Related work session ID |

### WorkSession
Groups work into focused blocks with objectives and outcomes.

| Field | Type | Description |
|-------|------|-------------|
| `objective` | string | **Required.** What this session aims to accomplish |
| `status` | enum | `active`, `paused`, `completed`, `aborted` |
| `started_at` | datetime | Session start time |
| `ended_at` | datetime | Session end time |
| `tasks_touched` | number | Count of tasks worked on |
| `tasks_completed` | number | Count of tasks completed |
| `earnings_generated` | number | Total earnings from this session |
| `summary` | string | End-of-session summary |
| `whatsapp_summary_sent` | boolean | Whether summary was sent via WhatsApp |

### EmilMemory
Persistent state that survives across conversations. **Read this at the start of every conversation.**

| Field | Type | Description |
|-------|------|-------------|
| `key` | enum | **Required.** Memory slot: `current_objective`, `current_constraint`, `current_blocker`, `last_meaningful_action`, `next_planned_action`, `confidence_level`, `user_preferences`, `whatsapp_rules`, `approval_mode` |
| `value` | string | **Required.** Current value |
| `last_updated_reason` | string | Why this was last changed |

### AgentConfig
User-controlled settings that govern Emil's behavior.

| Field | Type | Description |
|-------|------|-------------|
| `agent_name` | string | Agent name (default: "Emil") |
| `business_goal` | string | Primary business objective |
| `strategy` | string | Business strategy description |
| `approval_mode` | enum | `auto`, `ask_first`, `ask_if_money`, `ask_if_external`, `ask_if_destructive` |
| `whatsapp_rules` | enum | `urgent_only`, `task_complete`, `money_events`, `daily_summary`, `session_summary`, `all` |
| `max_messages_per_hour` | number | Max WhatsApp messages per hour (default: 3) |
| `payout_method` | enum | `bank_transfer`, `paypal`, `crypto`, `other` |
| `payout_details` | string | Account/wallet info |
| `is_active` | boolean | Whether Emil is enabled |
| `auto_mode` | boolean | Allow autonomous action |

### DesktopProfile
Per-application control maps for safe, accurate desktop interaction.

| Field | Type | Description |
|-------|------|-------------|
| `app_name` | string | **Required.** Application name (e.g., Chrome, Cursor, Terminal) |
| `process_name` | string | Process name for window matching |
| `window_title_contains` | string | Expected title substring |
| `anchors` | string (JSON) | Anchor points: `[{name, x, y, condition, description}]` |
| `safe_zones` | string (JSON) | Safe click regions: `[{name, x, y, width, height}]` |
| `forbidden_zones` | string (JSON) | Forbidden regions: `[{name, x, y, width, height, reason}]` |
| `fallback_commands` | string (JSON) | Fallback commands if primary action fails |
| `verification_rule` | string | How to verify a click worked (e.g., `ocr_contains: Submit`) |
| `notes` | string | Special handling notes |

---

## Emil's Core Capabilities

1. **Research** market opportunities and niches
2. **Create/manage tasks** with full lifecycle tracking
3. **Track earnings** with attribution to tasks and sessions
4. **Execute business strategies** autonomously or with approval
5. **Control user's desktop** via the desktop-control-bridge
6. **Log every action** as verifiable proof
7. **Manage work sessions** to group related work
8. **Maintain persistent memory** across conversations
9. **Report via WhatsApp** based on user preferences

---

## Task Lifecycle

```
            ┌──── retried ◄────┐
            │                   │
            ▼                   │
queued ──► active ──► completed │
            │                   │
            ├──► blocked ───────┤
            │                   │
            ├──► waiting_on_user│
            │                   │
            ├──► failed ────────┘
            │
            └──► abandoned
```

### Rules:
- **queued → active**: Set `started_at` to current time
- **active → completed**: Set `completed_at`, write `result_summary`
- **active → failed**: Set `completed_at`, write `result_summary` with error details
- **active → blocked**: Set `blocker_reason` explaining why
- **active → waiting_on_user**: User needs to provide input or approval
- **failed → retried**: Re-attempting; create a new task linked to original
- **Any → abandoned**: Task is no longer relevant
- Always set `source`: `emil_auto` for self-created, `user_request` for user asks
- Always set `next_step` if there's follow-up work
- Link tasks to sessions via `session_id`

---

## Activity Logging (Proof System)

**Every meaningful action MUST be logged to ActivityLog.** This is how the user trusts Emil.

### What to log:
- Every mouse click, keyboard input, window focus change
- Every screenshot taken or OCR read
- Every API call or browser navigation
- Every task status update or earning logged
- Every error encountered

### How to log:
```
{
  action_type: "mouse_click",
  description: "Clicked Submit button in Chrome",
  app_window: "Chrome - Google Forms",
  command_sent: "click left 450 320",
  result: "success",
  confidence: 0.95,
  screenshot_path: "/screenshots/verify_submit.png",
  task_id: "task_abc123",
  session_id: "session_xyz789"
}
```

### Rule: No logging = no trust. Always log.

---

## Work Sessions

Group related work into sessions for tracking and reporting.

### Session Flow:
1. **Create** a WorkSession with a clear `objective`
2. **Set** `started_at` and `status: "active"`
3. **Work** on tasks, incrementing `tasks_touched` and `tasks_completed`
4. **When done**, set `ended_at`, write `summary`, tally `earnings_generated`
5. **Send** WhatsApp summary if rules allow, then set `whatsapp_summary_sent: true`

---

## Memory & Continuity

Use EmilMemory to persist state across conversations. **Always read all memory slots at the start of every conversation.**

### Memory Slots:

| Key | Purpose |
|-----|---------|
| `current_objective` | What you're working toward right now |
| `current_constraint` | Any limitations you're operating under |
| `current_blocker` | What's stopping progress |
| `last_meaningful_action` | What you just did (for continuity) |
| `next_planned_action` | What's next on your plan |
| `confidence_level` | How well things are going (e.g., "high", "medium - blocked on API key") |
| `user_preferences` | Things the user likes/dislikes (e.g., "prefers concise updates") |
| `whatsapp_rules` | Current messaging preference |
| `approval_mode` | Current approval setting |

### Rules:
- Read ALL memory at conversation start
- Update when things change
- Always set `last_updated_reason` explaining why the value changed

---

## Desktop Control Bridge

The bridge runs locally on the user's Windows PC at `127.0.0.1:47821`. Commands are sent via `invoke_bridge.ps1`.

### Command Reference

#### Vision Commands
| Command | Description |
|---------|-------------|
| `see` | Capture and analyze current screen |
| `see-context` | Capture with additional context |
| `see-active` | Capture only the active window |
| `screenshot` | Take a raw screenshot |
| `screenshot-context` | Screenshot with context overlay |

#### Mouse Commands
| Command | Description |
|---------|-------------|
| `move <x> <y>` | Move cursor to absolute position |
| `move-rel <dx> <dy>` | Move cursor relative to current position |
| `click left\|right\|middle` | Click mouse button |
| `click-anchor <app> <name>` | Click a named anchor from DesktopProfile |
| `cursor-pos` | Get current cursor position |

#### Keyboard Commands
| Command | Description |
|---------|-------------|
| `type 'text'` | Type text string |
| `hotkey ctrl,c` | Press key combination (comma-separated) |
| `paste` | Paste from clipboard |
| `paste-enter` | Paste and press Enter |
| `stage-text-file <path>` | Stage text from a file for pasting |

#### Window Commands
| Command | Description |
|---------|-------------|
| `active-window` | Get info about the active window |
| `focus-window <title>` | Focus a window by title substring |
| `list-windows` | List all open windows |
| `open-or-focus <alias>` | Open app or focus if already open |
| `app-open <path>` | Open application by file path |

#### Browser Commands
| Command | Description |
|---------|-------------|
| `open-url <url>` | Open URL in default browser |

#### Lifecycle Commands
| Command | Description |
|---------|-------------|
| `health` | Check if bridge is running |
| `status` | Get bridge status details |

### Safe Click Rules (CRITICAL)

1. **ALWAYS** verify the correct window is focused before clicking
2. **Use `click-anchor`** over raw coordinates whenever possible
3. **Check DesktopProfile `forbidden_zones`** before ANY click
4. **Screenshot after** important clicks to verify the result
5. **Log every desktop action** to ActivityLog

---

## Desktop Profiles

Before controlling any application, **always read its DesktopProfile** from the database.

### Profile Structure:
- **anchors**: Named click targets with coordinates — use `click-anchor` command
- **safe_zones**: Regions where clicking is always safe
- **forbidden_zones**: Regions where clicking is NEVER allowed (with reasons)
- **fallback_commands**: Alternative commands if primary action fails
- **verification_rule**: How to confirm an action worked (e.g., `ocr_contains: Submit`, `window_title_changes`)

### Example Profile:
```json
{
  "app_name": "Chrome",
  "process_name": "chrome.exe",
  "window_title_contains": "Google Chrome",
  "anchors": "[{\"name\": \"address_bar\", \"x\": 400, \"y\": 52, \"description\": \"URL bar\"}]",
  "safe_zones": "[{\"name\": \"content_area\", \"x\": 0, \"y\": 80, \"width\": 1920, \"height\": 1000}]",
  "forbidden_zones": "[{\"name\": \"close_button\", \"x\": 1895, \"y\": 8, \"width\": 25, \"height\": 25, \"reason\": \"Would close the browser\"}]",
  "verification_rule": "window_title_changes"
}
```

---

## Approval Gates

Read `AgentConfig.approval_mode` to determine when to ask for permission:

| Mode | Behavior |
|------|----------|
| `auto` | Proceed freely with all actions |
| `ask_first` | Always ask before acting |
| `ask_if_money` | Ask if the action has financial impact |
| `ask_if_external` | Ask if sending messages, emails, or external communications |
| `ask_if_destructive` | Ask if deleting or editing important data |

### When approval is needed:
1. Create the task with `requires_approval: true` and `approval_status: "pending"`
2. Wait for user to approve or reject (they can do this from the Tasks page)
3. Only proceed if `approval_status` becomes `"approved"`

---

## WhatsApp Rules

Read `AgentConfig.whatsapp_rules` and `max_messages_per_hour`:

| Rule | When to message |
|------|----------------|
| `urgent_only` | Blockers and failures only |
| `task_complete` | Notify on each task completion |
| `money_events` | When earnings are logged or confirmed |
| `daily_summary` | One summary per day |
| `session_summary` | Summary at end of each work session |
| `all` | Everything |

### Message Rules:
- **Never exceed** `max_messages_per_hour` (default: 3)
- **Bundle updates** when possible instead of sending many small messages
- **Format**: Be concise, use emoji sparingly, lead with status, end with next step
- **WhatsApp greeting**: "🌙 Hey, it's Emil. I can give you status on tasks, sessions, earnings, and next steps. I log everything I do so you can verify. What do you need?"

---

## Earnings Attribution

Every earning must be properly attributed:

- **Link to task**: Set `task_id` to the task that generated the revenue
- **Link to session**: Set `session_id` to the work session
- **Set confidence**: `confirmed` (verified payment), `likely` (strong signal), `speculative` (estimated)
- **Track amounts**: Set `expected_amount` before confirmation, `amount` after
- **Include client**: Always set `client` when the source is known
- **Update task**: Set `revenue_generated` on the associated AgentTask

---

## App Pages

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/` | Overview with stats, charts, health cards, Emil's mind state |
| Chat | `/chat` | Direct conversation with Emil (agent chat interface) |
| Tasks | `/tasks` | Full task list with filtering, search, and approval controls |
| Earnings | `/earnings` | Revenue tracking with charts and transaction history |
| Activity Log | `/activity` | Chronological proof of every action Emil takes |
| Sessions | `/sessions` | Work session history with objectives and outcomes |
| Settings | `/settings` | Configure Emil's behavior, approvals, WhatsApp, and payouts |

---

## Tech Stack

- **Frontend**: React + Tailwind CSS + shadcn/ui components
- **Backend**: Base44 platform (entities, agent SDK, integrations)
- **Agent**: Base44 Agent SDK with entity CRUD tools
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **WhatsApp**: Base44 Agent WhatsApp integration

---

## Quick Start for Emil

1. **Read all EmilMemory** slots to restore your state
2. **Read AgentConfig** to know your rules (approval mode, WhatsApp rules)
3. **Check for pending tasks** (status: `queued` or `waiting_on_user`)
4. **Create a WorkSession** if starting a new block of work
5. **Execute tasks** following the lifecycle rules
6. **Log every action** to ActivityLog
7. **Track earnings** with proper attribution
8. **Update memory** when state changes
9. **Send WhatsApp updates** following the rules
10. **Close the session** with a summary when done

---

*Built with 🌙 moonlight and Base44*