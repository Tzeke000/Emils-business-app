# 🌙 Emil Bridge Supervisor

A local companion service that runs on your Windows PC to manage the desktop-control-bridge lifecycle on behalf of Emil's Base44 web app.

## Why This Exists

The Base44 web app runs in a browser — it **cannot** directly start, stop, or restart Windows processes. This supervisor bridges that gap by:

1. Polling Base44 for `BridgeCommand` records every 5–10 seconds
2. Executing PowerShell commands locally to control the bridge
3. Reporting results back to Base44 (BridgeCommand, SystemHealth, ActivityLog)
4. Enforcing safety rules (max restarts, failure escalation)
5. Exposing a heartbeat endpoint so the UI can show supervisor status

## Prerequisites

- **Windows 10/11** (PowerShell 5.1+)
- **Node.js 18+** (for native `fetch` support)
- **Desktop-control-bridge** already cloned/installed locally
- **Base44 service token** (from Base44 Dashboard → Settings → API Keys)

## Quick Start

```powershell
# 1. Navigate to the supervisor folder
cd local-supervisor

# 2. Run interactive setup (creates .env file)
node setup.js

# 3. Start the supervisor
node supervisor.js
```

## Configuration

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `BASE44_APP_ID` | ✅ | Your Base44 app ID |
| `BASE44_SERVICE_TOKEN` | ✅ | Service token from Base44 dashboard |
| `BASE44_API_URL` | | API endpoint (default: `https://app.base44.com/api`) |
| `BRIDGE_REPO_PATH` | ✅ | Local path to desktop-control-bridge |
| `BRIDGE_ENV_PATH` | | Path to bridge .env (default: `BRIDGE_REPO_PATH\.env`) |
| `BRIDGE_PORT` | | Bridge port (default: `47821`) |
| `BRIDGE_PROCESS_NAME` | | Process name for matching (default: `node`) |
| `POLL_INTERVAL_MS` | | How often to poll for commands (default: `7000`) |
| `HEARTBEAT_INTERVAL_MS` | | How often to update health (default: `30000`) |
| `HEARTBEAT_PORT` | | Local heartbeat HTTP port (default: `47900`) |
| `MAX_RESTARTS_PER_HOUR` | | Safety limit (default: `2`) |
| `COMMAND_EXPIRY_SECONDS` | | Commands older than this expire (default: `300`) |

## How It Works

### Command Queue Pattern

```
Base44 Web App                    Local Supervisor
──────────────                    ────────────────
User clicks "Restart"  ──────►  BridgeCommand { status: "queued" }
                                        │
                                        ▼
                                  Supervisor polls
                                  Sees queued command
                                        │
                                        ▼
                                  Executes restart
                                  Updates: status → "running"
                                        │
                                        ▼
                                  Verifies health
                                  Updates: status → "succeeded"
                                  Updates: SystemHealth
                                  Creates: ActivityLog entry
```

### Safety Rules

| Rule | Detail |
|------|--------|
| **Max 2 restarts/hour** | Prevents restart loops; configurable via `MAX_RESTARTS_PER_HOUR` |
| **Escalate after 2 failures** | If 2 consecutive restarts fail, supervisor blocks further attempts and logs a critical alert |
| **Health verification** | Restart is not marked "succeeded" until bridge responds to health check |
| **Command expiry** | Commands older than 5 minutes are marked "expired" and skipped |
| **Graceful shutdown** | Supervisor marks `watchdog_state: paused` in SystemHealth on exit |

### What Gets Updated

On every command execution:

| Entity | Fields Updated |
|--------|----------------|
| **BridgeCommand** | `status`, `started_at`, `finished_at`, `result_summary`, `error_message`, `after_health_status` |
| **SystemHealth** | `bridge_online`, `bridge_status`, `bridge_listener_pid`, `bridge_port`, `bridge_last_health_ok_at`, `last_bridge_health_check`, `watchdog_state`, `overall_status`, `bridge_restart_attempt_count_24h` |
| **ActivityLog** | `action_type`, `description`, `command_sent`, `result`, `confidence`, `importance`, `verification_status`, `artifact_type`, `error_message` |

### Heartbeat

The supervisor runs a tiny HTTP server on `http://127.0.0.1:47900/health` that returns:

```json
{
  "status": "ok",
  "supervisor": "emil-bridge-supervisor",
  "uptime_seconds": 3600,
  "last_heartbeat": "2026-04-08T12:00:00Z",
  "recent_restarts": 0,
  "consecutive_failures": 0
}
```

Emil or the dashboard can hit this endpoint to verify the supervisor is alive.

## Install as Windows Service

### Option 1: Windows Task Scheduler (Recommended)

Run as Administrator:

```powershell
# Install (starts at boot)
.\install-task.ps1

# Manual controls
Start-ScheduledTask -TaskName "EmilBridgeSupervisor"
Stop-ScheduledTask -TaskName "EmilBridgeSupervisor"

# Uninstall
.\uninstall-task.ps1
```

### Option 2: Startup Folder

1. Create a shortcut to run: `node C:\path\to\local-supervisor\supervisor.js`
2. Press `Win+R`, type `shell:startup`, press Enter
3. Move the shortcut into the Startup folder

### Option 3: Manual

Just run `node supervisor.js` in a terminal when you want the supervisor active.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "BASE44_APP_ID is not configured" | Run `node setup.js` or edit `.env` |
| Commands stay "queued" | Supervisor is not running; start it |
| "Max restarts exceeded" | Wait for cooldown or reset by restarting supervisor |
| Bridge won't start | Check `BRIDGE_REPO_PATH` points to correct directory |
| "fetch is not defined" | Update to Node.js 18+ |
| Heartbeat not responding | Check `HEARTBEAT_PORT` isn't in use |

## File Structure

```
local-supervisor/
├── .env.example          # Config template
├── .env                  # Your local config (git-ignored)
├── package.json          # No external dependencies
├── config.js             # Loads and validates .env
├── base44-client.js      # Lightweight Base44 API client
├── bridge-scripts.js     # Bridge lifecycle commands
├── supervisor.js         # Main loop (entry point)
├── setup.js              # Interactive setup helper
├── install-task.ps1      # Windows Task Scheduler installer
├── uninstall-task.ps1    # Task Scheduler uninstaller
└── README.md             # This file
```

## Zero External Dependencies

This supervisor uses **only Node.js built-ins** — no `npm install` required:
- `http` for health checks and heartbeat server
- `child_process` for PowerShell execution
- `fs` for config loading
- `fetch` (built into Node 18+) for Base44 API calls

---

*Part of Emil's Business App — built with 🌙 moonlight and Base44*