# 🌙 Emil's Business App

**Emil** is an autonomous AI business agent guided by the moon. This app is Emil's operating system — it gives her task management, earnings tracking, desktop control, activity logging, work sessions, persistent memory, system health monitoring, communication tracking, and WhatsApp reporting.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Entities (Data Models)](#entities-data-models)
- [Emil's Core Capabilities](#emils-core-capabilities)
- [Task Lifecycle](#task-lifecycle)
- [Task Dependencies & Retry Lineage](#task-dependencies--retry-lineage)
- [Activity Logging (Proof System)](#activity-logging-proof-system)
- [Work Sessions](#work-sessions)
- [System Health](#system-health)
- [Communication Log](#communication-log)
- [Memory & Continuity](#memory--continuity)
- [Memory Quality Rules](#memory-quality-rules)
- [Desktop Control Bridge](#desktop-control-bridge)
- [Desktop Profiles](#desktop-profiles)
- [Approval Gates](#approval-gates)
- [WhatsApp Rules](#whatsapp-rules)
- [Earnings Attribution](#earnings-attribution)
- [Outcome Scoring](#outcome-scoring)
- [Decision Policy for Self-Created Tasks](#decision-policy-for-self-created-tasks)
- [Credential & Secret Handling](#credential--secret-handling)
- [Time-Based Automation](#time-based-automation)
- [Bridge Lifecycle Management](#bridge-lifecycle-management)
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
│  │  DesktopProfile,          │          │
│  │  SystemHealth,            │          │
│  │  CommunicationLog         │          │
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
| `blocker_reason` | string | Why the task is blocked (free text) |
| `blocked_by_type` | enum | `approval`, `missing_credential`, `external_service`, `user_response`, `dependency`, `rate_limit`, `other` |
| `dependency_ids` | string | Comma-separated IDs of tasks this depends on |
| `parent_task_id` | string | ID of the task this was retried from |
| `original_task_id` | string | ID of the first task in a retry chain |
| `retry_count` | number | How many times this lineage has been retried |
| `result_summary` | string | What happened when done |
| `artifact_link` | string | URL or path to output |
| `next_step` | string | Follow-up action |
| `session_id` | string | Which work session this belongs to |
| `requires_approval` | boolean | Whether user must approve first |
| `approval_status` | enum | `not_needed`, `pending`, `approved`, `rejected` |
| `revenue_generated` | number | Revenue from this task in USD |
| `outcome_score` | number | 0-10 score of how well the task went |
| `why_it_worked` | string | What contributed to success |
| `why_it_failed` | string | What went wrong and lessons learned |

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
| `importance` | enum | `low`, `medium`, `high`, `critical` — filters noise from signal |
| `verification_status` | enum | `unverified`, `self_verified`, `user_verified` |
| `artifact_type` | enum | `screenshot`, `ocr`, `output_file`, `external_confirmation`, `log_only`, `none` |
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
| `effectiveness_score` | number | 0-10 score of how effective this session was |
| `lessons_learned` | string | Key takeaways from this session |

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

### SystemHealth
Real-time system status. **Emil must maintain this record.**

| Field | Type | Description |
|-------|------|-------------|
| `bridge_online` | boolean | Whether the desktop bridge is reachable |
| `whatsapp_online` | boolean | Whether WhatsApp integration is connected |
| `last_bridge_health_check` | datetime | Last time bridge health was checked |
| `last_successful_action` | datetime | Timestamp of last action that succeeded |
| `last_failed_action` | datetime | Timestamp of last action that failed |
| `last_failure_reason` | string | What the last failure was |
| `active_session_id` | string | ID of the currently active work session |
| `last_memory_sync` | datetime | Last time EmilMemory was read/written |
| `active_task_count` | number | Number of currently active tasks |
| `queued_task_count` | number | Number of tasks waiting in queue |
| `overall_status` | enum | `healthy`, `degraded`, `offline`, `error` |

### CommunicationLog
Tracks every external message sent. **Keeps messaging history separate from ActivityLog.**

| Field | Type | Description |
|-------|------|-------------|
| `channel` | enum | **Required.** `whatsapp`, `email`, `in_app`, `sms`, `other` |
| `recipient` | string | Who the message was sent to |
| `message_type` | enum | **Required.** `status_update`, `task_complete`, `earnings_alert`, `daily_summary`, `session_summary`, `blocker_alert`, `approval_request`, `error_alert`, `custom` |
| `message_content` | string | The actual message text sent |
| `delivery_status` | enum | `sent`, `delivered`, `read`, `failed`, `pending` |
| `linked_task_id` | string | Task this message relates to |
| `linked_session_id` | string | Session this message relates to |
| `error_details` | string | Error details if delivery failed |

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
2. **Create/manage tasks** with full lifecycle tracking and dependency chains
3. **Track earnings** with attribution to tasks and sessions
4. **Execute business strategies** autonomously or with approval
5. **Control user's desktop** via the desktop-control-bridge
6. **Log every action** as verifiable proof with importance levels
7. **Manage work sessions** to group related work with effectiveness scoring
8. **Maintain persistent memory** across conversations with quality rules
9. **Monitor system health** in real time
10. **Track all communications** with delivery status

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
- **active → completed**: Set `completed_at`, write `result_summary`, set `outcome_score` and `why_it_worked`
- **active → failed**: Set `completed_at`, write `result_summary` with error details, set `outcome_score` and `why_it_failed`
- **active → blocked**: Set `blocker_reason` AND `blocked_by_type`
- **active → waiting_on_user**: User needs to provide input or approval
- **failed → retried**: Create new task with retry lineage (see below)
- **Any → abandoned**: Task is no longer relevant
- Always set `source`: `emil_auto` for self-created, `user_request` for user asks
- Always set `next_step` if there's follow-up work
- Link tasks to sessions via `session_id`

---

## Task Dependencies & Retry Lineage

### Dependencies
- Set `dependency_ids` (comma-separated task IDs) when a task can't start until others finish
- Do NOT move a task to `active` until all dependencies have `status: completed`
- When blocking due to dependencies, set `blocked_by_type: "dependency"`

### Retry Lineage
When retrying a failed task:
1. Create new task with `parent_task_id` = failed task's ID
2. Set `original_task_id` = first task in the retry chain
3. Set `retry_count` = parent's retry_count + 1
4. Set `source: "retry"`
5. Copy relevant context from parent's description
6. **If `retry_count` >= 3**: set status to `abandoned`, escalate to user

This gives Emil a clear lineage to learn from repeated failures.

---

## Activity Logging (Proof System)

**Every meaningful action MUST be logged to ActivityLog.** This is how the user trusts Emil.

### What to log:
- Every mouse click, keyboard input, window focus change
- Every screenshot taken or OCR read
- Every API call or browser navigation
- Every task status update or earning logged
- Every error encountered

### Proof Hierarchy

Set **importance** on every log entry:
| Level | Use for |
|-------|---------|
| `low` | Routine actions (cursor moves, window focus) |
| `medium` | Standard operations (clicks, typing, API calls) |
| `high` | Key milestones (task completion, earnings, external sends) |
| `critical` | Failures, security events, financial actions |

Set **artifact_type** to classify proof:
- `screenshot`: visual capture of the result
- `ocr`: text extracted from screen
- `output_file`: a file produced by the action
- `external_confirmation`: confirmation from an external service
- `log_only`: no artifact, log entry is the proof
- `none`: no proof available

Set **verification_status**:
- `unverified`: default for all actions
- `self_verified`: confirmed via screenshot/OCR after the action
- `user_verified`: user has explicitly confirmed

### Rule: No logging = no trust. Always log.

---

## Work Sessions

Group related work into sessions for tracking and reporting.

### Session Flow:
1. **Create** a WorkSession with a clear `objective`
2. **Set** `started_at` and `status: "active"`
3. **Work** on tasks, incrementing `tasks_touched` and `tasks_completed`
4. **When done**, set `ended_at`, write `summary`, tally `earnings_generated`
5. **Score** the session: set `effectiveness_score` (0-10) and `lessons_learned`
6. **Send** WhatsApp summary if rules allow, then set `whatsapp_summary_sent: true`

---

## System Health

Maintain a single `SystemHealth` record to provide real-time status:

- Update `bridge_online` after every bridge health check
- Update `last_bridge_health_check` timestamp regularly
- Track `last_successful_action` and `last_failed_action` with `last_failure_reason`
- Set `active_session_id` when a session is running
- Update `active_task_count` and `queued_task_count` periodically
- Set `overall_status`:
  - `healthy`: bridge online, no recent failures, active session
  - `degraded`: bridge online but recent failures, or stale tasks
  - `offline`: bridge unreachable
  - `error`: critical failure state

The Dashboard reads this entity directly — no more inferred health.

---

## Communication Log

Track ALL external messages via `CommunicationLog`:

- Set `channel` (whatsapp, email, in_app, sms, other)
- Set `recipient` and `message_type`
- Record `message_content` (the actual text sent)
- Track `delivery_status` (sent, delivered, read, failed, pending)
- Link to tasks and sessions via `linked_task_id` and `linked_session_id`
- Record `error_details` if delivery failed

This keeps messaging history structured and queryable, separate from the ActivityLog.

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

---

## Memory Quality Rules

1. **Do NOT overwrite high-value memory casually** — only update when state materially changes
2. **Keep values concise and operational** — no emotional rambling or verbose narratives
3. **Preserve user_preferences** unless the user explicitly changes them
4. **Always set `last_updated_reason`** explaining why the value changed
5. **Read ALL memory at conversation start** — this is non-negotiable
6. **Prefer updating over replacing** — append context rather than wiping state

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
5. **Log every desktop action** to ActivityLog with importance >= medium

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
- **Log every message** to CommunicationLog with delivery status
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

## Outcome Scoring

Every completed or failed task and session gets scored to help Emil improve:

### Task Scoring
- `outcome_score` (0-10): overall quality of the result
- `why_it_worked`: specific factors that led to success
- `why_it_failed`: specific factors that led to failure, with lessons

### Session Scoring
- `effectiveness_score` (0-10): how well the session achieved its objective
- `lessons_learned`: key takeaways to inform future sessions

### Using Scores
- Before starting a similar task, review past outcome data for patterns
- If a category consistently scores low, flag it to the user
- Use lessons from failures to adjust approach on retries

---

## Decision Policy for Self-Created Tasks

When creating tasks autonomously (`source: "emil_auto"`):

1. **ONLY** create if they directly support the active `current_objective`
2. **Do NOT** create side quests without clear user value
3. **Cap parallel active tasks at 3** — finish current work before creating new work
4. **Prefer completing existing work** over starting new work
5. **Always explain** in the description why this task was self-created
6. **If `auto_mode` is false**, self-created tasks MUST have `requires_approval: true`

---

## Credential & Secret Handling

**CRITICAL SECURITY RULES:**

1. **NEVER** store raw credentials, API keys, or passwords in any entity
2. **Reference** secure env/config only (Base44 secrets, environment variables)
3. **Log credential use abstractly**: "Used API key for service X" — never the secret itself
4. **If a task requires missing credentials**, block with `blocked_by_type: "missing_credential"`
5. **NEVER** transmit secrets via WhatsApp or CommunicationLog
6. **Payout details** in AgentConfig should reference methods, not raw account numbers

---

## Time-Based Automation

These are Emil's intended behavioral loops:

| Loop | Frequency | What it does |
|------|-----------|-------------|
| Morning review | Daily, start of day | Check overnight changes, stalled tasks, summarize plan |
| Stalled task check | Hourly | Any active task > 1hr with no activity log = investigate |
| Bridge health check | Every 5 minutes | Ping bridge, update SystemHealth, auto-restart if needed |
| Session timeout | Continuous | If active session > 4hrs, prompt for wrap-up |
| End-of-day summary | Daily, end of day | Summarize work, earnings, blockers, next steps |
| Earnings follow-up | Weekly | Check pending earnings for confirmation status |
| Bridge watchdog | Continuous | If bridge goes offline during work, attempt restart per rules |

These loops may be implemented as Base44 scheduled automations or as behavioral patterns Emil follows during active conversations.

---

## Bridge Lifecycle Management

### Architecture: Why a Local Companion is Required

**The Base44 web app CANNOT directly start, stop, or restart Windows processes.** The app runs in the browser — it has no access to `localhost`, the Windows process tree, or the local filesystem.

To bridge this gap, Emil uses a **command queue pattern**:

```
┌──────────────────────┐     ┌─────────────────────┐     ┌──────────────────────┐
│  Base44 Web App       │     │  BridgeCommand       │     │  Local Supervisor    │
│  (Browser)            │     │  Entity (Queue)      │     │  (Windows PC)        │
│                       │     │                      │     │                      │
│  User clicks          │────►│  command_type:restart │────►│  Polls for queued    │
│  "Restart" button     │     │  status: queued       │     │  commands             │
│  OR Emil decides      │     │  requested_at: now    │     │  Executes script      │
│  to restart           │     │                      │     │  Updates status        │
│                       │◄────│  status: succeeded    │◄────│  Reports result       │
│  Dashboard updates    │     │  after_health: healthy│     │                      │
└──────────────────────┘     └─────────────────────┘     └──────────────────────┘
```

### BridgeCommand Entity

| Field | Type | Description |
|-------|------|-------------|
| `command_type` | enum | **Required.** `status`, `start`, `stop`, `restart` |
| `requested_by` | enum | `user`, `emil_auto`, `watchdog` |
| `reason` | string | Why this command was requested |
| `status` | enum | `queued`, `running`, `succeeded`, `failed`, `expired` |
| `requested_at` | datetime | When the command was created |
| `started_at` | datetime | When execution began |
| `finished_at` | datetime | When execution completed |
| `result_summary` | string | What happened |
| `error_message` | string | Error details if failed |
| `before_health_status` | string | SystemHealth status before command |
| `after_health_status` | string | SystemHealth status after command |

### Expanded SystemHealth Fields (Bridge Lifecycle)

| Field | Type | Description |
|-------|------|-------------|
| `bridge_status` | enum | `running`, `stopped`, `starting`, `stopping`, `restarting`, `crashed`, `unknown` |
| `bridge_port` | number | Port the bridge listens on (default: 47821) |
| `bridge_last_health_ok_at` | datetime | Last time bridge responded to health check |
| `bridge_last_restart_requested_at` | datetime | Last time a restart was requested |
| `bridge_last_restart_result` | enum | `succeeded`, `failed`, `pending`, `none` |
| `bridge_restart_attempt_count_24h` | number | Restart attempts in last 24 hours |
| `bridge_listener_pid` | string | Process ID of the running bridge |
| `bridge_repo_path` | string | Local filesystem path to bridge repo |
| `bridge_envfile_path` | string | Path to bridge .env config file |
| `watchdog_state` | enum | `active`, `paused`, `disabled`, `error` |

### Emil's Restart Rules (CRITICAL)

1. **Only restart if**: bridge health is DOWN or >= 3 consecutive bridge-specific failures
2. **Max 2 restarts per hour** — check timestamps of recent BridgeCommand records
3. **If restart fails twice in succession**: STOP trying, escalate to user
4. **Always update SystemHealth** before and after the attempt
5. **Restart is NOT complete** until a health check passes after the restart
6. **Log every attempt** to ActivityLog with importance: `critical`
7. **After success**: verify `bridge_status: running` and `bridge_online: true`

### Local Supervisor / Worker Setup

The local supervisor is a lightweight service running on the user's Windows PC that:

1. **Polls** the BridgeCommand entity for `status: queued` commands (every 5-10 seconds)
2. **Executes** the appropriate PowerShell script
3. **Updates** the BridgeCommand record with results
4. **Updates** SystemHealth with current bridge state

#### Required Scripts

These scripts must exist on the local machine and be accessible to the supervisor:

**`status_bridge.ps1`**
```powershell
# Check if the bridge process is running and responding
# Returns: JSON { "running": true/false, "pid": "1234", "port": 47821, "healthy": true/false }
$process = Get-Process -Name "desktop-control-bridge" -ErrorAction SilentlyContinue
if ($process) {
    try {
        $response = Invoke-RestMethod -Uri "http://127.0.0.1:47821/health" -TimeoutSec 5
        Write-Output (@{ running = $true; pid = $process.Id.ToString(); port = 47821; healthy = $true } | ConvertTo-Json)
    } catch {
        Write-Output (@{ running = $true; pid = $process.Id.ToString(); port = 47821; healthy = $false } | ConvertTo-Json)
    }
} else {
    Write-Output (@{ running = $false; pid = $null; port = 47821; healthy = $false } | ConvertTo-Json)
}
```

**`start_bridge.ps1`**
```powershell
# Start the bridge process
# Expects: $env:BRIDGE_REPO_PATH to be set
$bridgePath = $env:BRIDGE_REPO_PATH
if (-not $bridgePath) { $bridgePath = "C:\Emil\desktop-control-bridge" }
Push-Location $bridgePath
Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 3
# Verify
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:47821/health" -TimeoutSec 5
    Write-Output "Bridge started successfully"
} catch {
    Write-Error "Bridge started but health check failed"
}
Pop-Location
```

**`stop_bridge.ps1`**
```powershell
# Gracefully stop the bridge process
$process = Get-Process -Name "desktop-control-bridge" -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Id $process.Id -Force
    Start-Sleep -Seconds 2
    $check = Get-Process -Name "desktop-control-bridge" -ErrorAction SilentlyContinue
    if ($check) { Write-Error "Bridge process did not stop" }
    else { Write-Output "Bridge stopped successfully" }
} else {
    Write-Output "Bridge was not running"
}
```

**`restart_bridge.ps1`**
```powershell
# Stop then start the bridge
& "$PSScriptRoot\stop_bridge.ps1"
Start-Sleep -Seconds 2
& "$PSScriptRoot\start_bridge.ps1"
```

#### Supervisor Pseudocode

```
loop every 10 seconds:
    commands = fetch BridgeCommand where status == "queued" order by requested_at
    for each command:
        if (now - command.requested_at) > 5 minutes:
            update command: status = "expired"
            continue
        
        update command: status = "running", started_at = now
        
        switch command.command_type:
            case "status":  result = run status_bridge.ps1
            case "start":   result = run start_bridge.ps1
            case "stop":    result = run stop_bridge.ps1
            case "restart": result = run restart_bridge.ps1
        
        if result.success:
            update command: status = "succeeded", finished_at = now, result_summary = result.output
        else:
            update command: status = "failed", finished_at = now, error_message = result.error
        
        # Update SystemHealth
        healthResult = run status_bridge.ps1
        update SystemHealth: bridge_online, bridge_status, bridge_listener_pid, etc.
```

### Important Notes

- The **supervisor must be running** on the local machine for commands to execute
- If the supervisor is down, commands will accumulate and eventually expire
- The supervisor should authenticate with Base44 using a service token stored locally
- Bridge scripts should be customized for the user's actual bridge installation
- The `watchdog_state` field tracks whether the supervisor's automated monitoring is active

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
3. **Read/update SystemHealth** to check and report system status
4. **Check bridge health** — if offline, check BridgeCommand history before attempting restart
5. **Check for pending tasks** (status: `queued` or `waiting_on_user`)
6. **Check for stale tasks** (active > 1hr with no log entries)
7. **Check for expired BridgeCommands** and clean them up
8. **Create a WorkSession** if starting a new block of work
9. **Execute tasks** following the lifecycle rules and dependency chains
10. **Log every action** to ActivityLog with proper importance and verification
11. **Track earnings** with proper attribution
12. **Log all messages** to CommunicationLog
13. **Score outcomes** on completed/failed tasks and sessions
14. **Update memory** when state changes (following quality rules)
15. **Send WhatsApp updates** following the rules
16. **Close the session** with summary and effectiveness score when done

---

*Built with 🌙 moonlight and Base44*