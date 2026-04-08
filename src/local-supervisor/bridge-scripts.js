/* eslint-disable */
// Execute bridge lifecycle PowerShell scripts
const { exec } = require('child_process');
const config = require('./config');
const http = require('http');

function runPowerShell(script) {
  return new Promise((resolve, reject) => {
    const cmd = `powershell -ExecutionPolicy Bypass -Command "${script.replace(/"/g, '\\"')}"`;
    exec(cmd, { timeout: 30000 }, (err, stdout, stderr) => {
      if (err) {
        resolve({ success: false, output: stderr || err.message, exitCode: err.code });
      } else {
        resolve({ success: true, output: stdout.trim(), exitCode: 0 });
      }
    });
  });
}

async function checkBridgeHealth() {
  const port = config.bridge.port;
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/health`, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ healthy: res.statusCode === 200, statusCode: res.statusCode, body: data });
      });
    });
    req.on('error', () => resolve({ healthy: false, statusCode: 0, body: '' }));
    req.on('timeout', () => { req.destroy(); resolve({ healthy: false, statusCode: 0, body: 'timeout' }); });
  });
}

async function getBridgePid() {
  const processName = config.bridge.processName;
  const port = config.bridge.port;
  // Find node process listening on bridge port
  const result = await runPowerShell(
    `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1`
  );
  if (result.success && result.output && /^\d+$/.test(result.output.trim())) {
    return result.output.trim();
  }
  return null;
}

async function statusBridge() {
  const health = await checkBridgeHealth();
  const pid = await getBridgePid();
  return {
    running: health.healthy || !!pid,
    healthy: health.healthy,
    pid: pid,
    port: config.bridge.port,
  };
}

async function startBridge() {
  const repoPath = config.bridge.repoPath;
  const envPath = config.bridge.envPath || `${repoPath}\\.env`;

  // Check if already running
  const current = await statusBridge();
  if (current.healthy) {
    return { success: true, output: 'Bridge is already running and healthy', pid: current.pid };
  }

  // Start the bridge
  const result = await runPowerShell(
    `Push-Location '${repoPath}'; Start-Process -FilePath 'node' -ArgumentList 'server.js' -WindowStyle Hidden -PassThru | Select-Object -ExpandProperty Id; Pop-Location`
  );

  if (!result.success) {
    return { success: false, output: result.output, pid: null };
  }

  // Wait for startup
  await new Promise(r => setTimeout(r, 3000));

  // Verify health
  const after = await statusBridge();
  if (after.healthy) {
    return { success: true, output: 'Bridge started successfully', pid: after.pid };
  } else {
    return { success: false, output: 'Bridge process started but health check failed', pid: after.pid };
  }
}

async function stopBridge() {
  const pid = await getBridgePid();
  if (!pid) {
    return { success: true, output: 'Bridge was not running' };
  }

  const result = await runPowerShell(`Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue`);
  await new Promise(r => setTimeout(r, 2000));

  // Verify stopped
  const after = await statusBridge();
  if (!after.running) {
    return { success: true, output: `Bridge stopped (was PID ${pid})` };
  } else {
    return { success: false, output: 'Bridge process did not stop' };
  }
}

async function restartBridge() {
  // Stop first
  const stopResult = await stopBridge();
  await new Promise(r => setTimeout(r, 2000));

  // Start
  const startResult = await startBridge();
  return {
    success: startResult.success,
    output: `Stop: ${stopResult.output} | Start: ${startResult.output}`,
    pid: startResult.pid,
  };
}

module.exports = {
  statusBridge,
  startBridge,
  stopBridge,
  restartBridge,
  checkBridgeHealth,
  getBridgePid,
};