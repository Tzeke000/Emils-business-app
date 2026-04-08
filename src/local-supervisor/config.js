/* eslint-disable */
// Load .env file manually (no external deps)
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env file not found. Copy .env.example to .env and configure it.');
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const config = {
  base44: {
    appId: process.env.BASE44_APP_ID,
    serviceToken: process.env.BASE44_SERVICE_TOKEN,
    apiUrl: process.env.BASE44_API_URL || 'https://app.base44.com/api',
  },
  bridge: {
    repoPath: process.env.BRIDGE_REPO_PATH || 'C:\\Emil\\desktop-control-bridge',
    envPath: process.env.BRIDGE_ENV_PATH || '',
    port: parseInt(process.env.BRIDGE_PORT) || 47821,
    processName: process.env.BRIDGE_PROCESS_NAME || 'node',
  },
  supervisor: {
    pollIntervalMs: Math.max(5000, parseInt(process.env.POLL_INTERVAL_MS) || 7000),
    heartbeatIntervalMs: parseInt(process.env.HEARTBEAT_INTERVAL_MS) || 30000,
    heartbeatPort: parseInt(process.env.HEARTBEAT_PORT) || 47900,
  },
  safety: {
    maxRestartsPerHour: parseInt(process.env.MAX_RESTARTS_PER_HOUR) || 2,
    commandExpirySeconds: parseInt(process.env.COMMAND_EXPIRY_SECONDS) || 300,
  },
};

// Validate required fields
if (!config.base44.appId || config.base44.appId === 'your_app_id_here') {
  console.error('ERROR: BASE44_APP_ID is not configured in .env');
  process.exit(1);
}
if (!config.base44.serviceToken || config.base44.serviceToken === 'your_service_token_here') {
  console.error('ERROR: BASE44_SERVICE_TOKEN is not configured in .env');
  process.exit(1);
}

module.exports = config;