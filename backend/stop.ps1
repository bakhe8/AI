$pidFile = "$PSScriptRoot\.server.pid"

if (Test-Path $pidFile) {
    $serverPid = Get-Content $pidFile -Raw
    $serverPid = $serverPid.Trim()
    
    try {
        Get-Process -Id $serverPid -ErrorAction Stop | Out-Null
        Stop-Process -Id $serverPid -Force
        Write-Host "✅ Server stopped (PID: $serverPid)" -ForegroundColor Green
        Start-Sleep -Milliseconds 500
    } catch {
        Write-Host "⚠️ Process with PID $serverPid not found (already stopped?)" -ForegroundColor Yellow
    }
    
    Remove-Item $pidFile -ErrorAction SilentlyContinue
} else {
    Write-Host "ℹ️ No server running (.server.pid file not found)" -ForegroundColor Cyan
    Write-Host "If you want to stop all node processes, run:" -ForegroundColor Gray
    Write-Host "  Get-Process -Name node | Stop-Process -Force" -ForegroundColor Gray
}
