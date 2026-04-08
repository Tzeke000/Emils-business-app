/* eslint-disable */
// Emil Bridge Supervisor — Main Loop
// Polls Base44 for BridgeCommand records, executes them locally, updates status
const http = require('http');
const config = require('./config');
const api = require('./base44-client');
const bridge = require('./bridge-scripts');

// State
let running = true;
let lastHeartbeat = new Date();
let recentRestarts = []; // timestamps of recent restart attempts
let consecutiveRestartFailures = 0;
let supervisorStartedAt = new Date();

function log(level, msg) {
  const ts = new Date().toISOString();
  const prefix = { info: '✓', warn: '⚠', error: '✗', debug: '·' }[level] || '·';
  console.log(`[${ts}] ${prefix} ${msg}`);
}

// ── Safety Rules ──

function canRestart() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  recentRestarts = recentRestarts.filter(t => t > oneHourAgo);
  if (recentRestarts.length >= config.safety.maxRestartsPerHour) {
    return { allowed: false, reason: `Max ${config.safety.maxRestartsPerHour} restarts/hour exceeded (${recentRestarts.length} recent)` };
  }
  if (consecutiveRestartFailures >= 2) {
    return { allowed: false, reason: `2 consecutive restart failures — escalating to user` };
  }
  return { allowed: true, reason: null };
}

// ── Command Execution ──

async function executeCommand(cmd) {
  const commandId = cmd.id;
  const commandType = cmd.command_type;
  log('info', `Executing: ${commandType} (id: ${commandId}, by: ${cmd.requested_by})`);

  // Mark as running
  await api.entities.update('BridgeCommand', commandId, {
    status: 'running',
    started_at: new Date().toISOString(),
  });

  let result;
  let activityDescription;

  switch (commandType) {
    case 'status': {
      const status = await bridge.statusBridge();
      result = {
        success: true,
        output: `running=${status.running}, healthy=${status.healthy}, pid=${status.pid}`,
      };
      activityDescription = `Bridge status check: ${result.output}`;
      break;
    }
    case 'start': {
      result = await bridge.startBridge();
      activityDescription = `Bridge start: ${result.output}`;
      break;
    }
    case 'stop': {
      result = await bridge.stopBridge();
      activityDescription = `Bridge stop: ${result.output}`;
      break;
    }
    case 'restart': {
      // Safety check
      const check = canRestart();
      if (!check.allowed) {
        result = { success: false, output: check.reason };
        activityDescription = `Bridge restart BLOCKED: ${check.reason}`;
        log('warn', `Restart blocked: ${check.reason}`);
        break;
      }
      recentRestarts.push(Date.now());
      result = await bridge.restartBridge();
      if (!result.success) {
        consecutiveRestartFailures++;
      } else {
        consecutiveRestartFailures = 0;
      }
      activityDescription = `Bridge restart: ${result.output}`;
      break;
    }
    default:
      result = { success: false, output: `Unknown command type: ${commandType}` };
      activityDescription = `Unknown bridge command: ${commandType}`;
  }

  // Get post-command health
  const afterHealth = await bridge.statusBridge();
  const afterStatus = afterHealth.healthy ? 'healthy' : afterHealth.running ? 'degraded' : 'offline';

  // Update BridgeCommand record
  await api.entities.update('BridgeCommand', commandId, {
    status: result.success ? 'succeeded' : 'failed',
    finished_at: new Date().toISOString(),
    result_summary: result.output.slice(0, 500),
    error_message: result.success ? '' : result.output.slice(0, 500),
    after_health_status: afterStatus,
  });

  // Update SystemHealth
  await updateSystemHealth(afterHealth);

  // Write ActivityLog
  await api.entities.create('ActivityLog', {
    action_type: 'api_call',
    description: activityDescription.slice(0, 500),
    command_sent: `${commandType}_bridge (supervisor)`,
    result: result.success ? 'success' : 'failed',
    confidence: result.success && afterHealth.healthy ? 1.0 : result.success ? 0.7 : 0.0,
    importance: commandType === 'status' ? 'medium' : 'high',
    verification_status: afterHealth.healthy ? 'self_verified' : 'unverified',
    artifact_type: 'log_only',
    error_message: result.success ? '' : result.output.slice(0, 500),
  });

  log(result.success ? 'info' : 'error', `${commandType} → ${result.success ? 'succeeded' : 'FAILED'}: ${result.output.slice(0, 100)}`);
}

// ── SystemHealth Update ──

async function updateSystemHealth(bridgeStatus) {
  const healthRecords = await api.entities.list('SystemHealth', '-updated_date', 1);
  const now = new Date().toISOString();

  const healthData = {
    bridge_online: bridgeStatus.healthy,
    bridge_status: bridgeStatus.healthy ? 'running' : bridgeStatus.running ? 'crashed' : 'stopped',
    bridge_port: config.bridge.port,
    bridge_listener_pid: bridgeStatus.pid || '',
    bridge_repo_path: config.bridge.repoPath,
    bridge_envfile_path: config.bridge.envPath || `${config.bridge.repoPath}\\.env`,
    last_bridge_health_check: now,
    watchdog_state: 'active',
  };

  if (bridgeStatus.healthy) {
    healthData.bridge_last_health_ok_at = now;
    healthData.last_successful_action = now;
  } else {
    healthData.last_failed_action = now;
    healthData.last_failure_reason = 'Bridge health check failed';
  }

  // Count 24h restarts
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  healthData.bridge_restart_attempt_count_24h = recentRestarts.filter(t => t > oneDayAgo).length;

  // Set overall status
  if (bridgeStatus.healthy) {
    healthData.overall_status = 'healthy';
  } else if (bridgeStatus.running) {
    healthData.overall_status = 'degraded';
  } else {
    healthData.overall_status = 'offline';
  }

  if (healthRecords && healthRecords.length > 0) {
    await api.entities.update('SystemHealth', healthRecords[0].id, healthData);
  } else {
    await api.entities.create('SystemHealth', healthData);
  }
}

// ── Poll Loop ──

async function pollCommands() {
  try {
    const commands = await api.entities.filter('BridgeCommand', { status: 'queued' }, '-created_date', 10);

    if (!commands || commands.length === 0) return;

    for (const cmd of commands) {
      // Check for expiry
      if (cmd.requested_at) {
        const age = (Date.now() - new Date(cmd.requested_at).getTime()) / 1000;
        if (age > config.safety.commandExpirySeconds) {
          log('warn', `Command expired: ${cmd.command_type} (id: ${cmd.id}, age: ${Math.round(age)}s)`);
          await api.entities.update('BridgeCommand', cmd.id, {
            status: 'expired',
            finished_at: new Date().toISOString(),
            result_summary: `Command expired after ${Math.round(age)}s`,
          });
          continue;
        }
      }

      await executeCommand(cmd);
    }
  } catch (err) {
    log('error', `Poll error: ${err.message}`);
  }
}

// ── Heartbeat ──

async function sendHeartbeat() {
  try {
    const status = await bridge.statusBridge();
    await updateSystemHealth(status);
    lastHeartbeat = new Date();
  } catch (err) {
    log('error', `Heartbeat error: ${err.message}`);
  }
}

function startHeartbeatServer() {
  const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      const uptime = Math.round((Date.now() - supervisorStartedAt.getTime()) / 1000);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        supervisor: 'emil-bridge-supervisor',
        uptime_seconds: uptime,
        last_heartbeat: lastHeartbeat.toISOString(),
        recent_restarts: recentRestarts.length,
        consecutive_failures: consecutiveRestartFailures,
      }));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(config.supervisor.heartbeatPort, '127.0.0.1', () => {
    log('info', `Heartbeat server on http://127.0.0.1:${config.supervisor.heartbeatPort}/health`);
  });
}

// ── Main ──

async function main() {
  log('info', '═══════════════════════════════════════════');
  log('info', '  Emil Bridge Supervisor starting...');
  log('info', `  App ID: ${config.base44.appId}`);
  log('info', `  Bridge: 127.0.0.1:${config.bridge.port}`);
  log('info', `  Repo: ${config.bridge.repoPath}`);
  log('info', `  Poll interval: ${config.supervisor.pollIntervalMs}ms`);
  log('info', `  Max restarts/hr: ${config.safety.maxRestartsPerHour}`);
  log('info', '═══════════════════════════════════════════');

  // Initial health check
  const initialStatus = await bridge.statusBridge();
  log('info', `Initial bridge status: running=${initialStatus.running}, healthy=${initialStatus.healthy}, pid=${initialStatus.pid}`);
  await updateSystemHealth(initialStatus);

  // Start heartbeat server
  startHeartbeatServer();

  // Main poll loop
  log('info', 'Supervisor ready. Polling for commands...');

  async function loop() {
    while (running) {
      await pollCommands();
      await new Promise(r => setTimeout(r, config.supervisor.pollIntervalMs));
    }
  }

  // Heartbeat loop
  async function heartbeatLoop() {
    while (running) {
      await new Promise(r => setTimeout(r, config.supervisor.heartbeatIntervalMs));
      await sendHeartbeat();
    }
  }

  // Run both loops
  loop();
  heartbeatLoop();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    log('info', 'Shutting down supervisor...');
    running = false;
    // Mark watchdog as paused
    try {
      const healthRecords = await api.entities.list('SystemHealth', '-updated_date', 1);
      if (healthRecords && healthRecords.length > 0) {
        await api.entities.update('SystemHealth', healthRecords[0].id, { watchdog_state: 'paused' });
      }
    } catch (e) { /* ignore on shutdown */ }
    process.exit(0);
  });
}

main().catch(err => {
  log('error', `Fatal: ${err.message}`);
  process.exit(1);
});