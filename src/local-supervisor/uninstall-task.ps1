# Uninstall Emil Bridge Supervisor scheduled task
# Run this script as Administrator

$taskName = "EmilBridgeSupervisor"

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "✓ Scheduled task '$taskName' removed."
} else {
    Write-Host "Task '$taskName' not found."
}