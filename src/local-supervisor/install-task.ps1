# Install Emil Bridge Supervisor as a Windows Scheduled Task
# Run this script as Administrator

$supervisorPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source

if (-not $nodePath) {
    Write-Error "Node.js not found. Install Node.js 18+ first."
    exit 1
}

$taskName = "EmilBridgeSupervisor"
$description = "Emil Bridge Supervisor - monitors and manages the desktop-control-bridge"

# Remove existing task if present
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Removing existing task..."
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create the action
$action = New-ScheduledTaskAction `
    -Execute $nodePath `
    -Argument "supervisor.js" `
    -WorkingDirectory $supervisorPath

# Trigger: at system startup
$trigger = New-ScheduledTaskTrigger -AtStartup

# Settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -RestartCount 3 `
    -ExecutionTimeLimit (New-TimeSpan -Days 365)

# Register the task (runs as current user)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Limited

Register-ScheduledTask `
    -TaskName $taskName `
    -Description $description `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal

Write-Host ""
Write-Host "✓ Scheduled task '$taskName' installed."
Write-Host "  It will start automatically at system boot."
Write-Host ""
Write-Host "Manual controls:"
Write-Host "  Start: Start-ScheduledTask -TaskName $taskName"
Write-Host "  Stop:  Stop-ScheduledTask -TaskName $taskName"
Write-Host "  Remove: Unregister-ScheduledTask -TaskName $taskName"
Write-Host ""