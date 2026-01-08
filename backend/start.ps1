# Stop any existing server from this project
$pidFile = "$PSScriptRoot\.server.pid"
if (Test-Path $pidFile) {
    Write-Host "Found existing server, stopping it..." -ForegroundColor Yellow
    & "$PSScriptRoot\stop.ps1"
    Start-Sleep -Seconds 1
}

Write-Host "Starting AI Kernel Server..." -ForegroundColor Green

# Start server in background
$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = "node"
$processInfo.Arguments = "src/server.js"
$processInfo.WorkingDirectory = $PSScriptRoot
$processInfo.UseShellExecute = $false
$processInfo.CreateNoWindow = $true
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $processInfo
$process.Start() | Out-Null

# Save PID (without newline)
$process.Id.ToString() | Out-File -FilePath $pidFile -Encoding ASCII -NoNewline

Start-Sleep -Seconds 2

# Check if running
try {
    Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop | Out-Null
    Write-Host "✅ Server started successfully on http://localhost:3000" -ForegroundColor Green
    Write-Host "PID: $($process.Id)" -ForegroundColor Cyan
    Write-Host "To stop: .\stop.ps1" -ForegroundColor Gray
} catch {
    Write-Host "❌ Server failed to start. Check logs:" -ForegroundColor Red
    Write-Host "  server.log: $PSScriptRoot\server.log" -ForegroundColor Yellow
    Write-Host "  server.error.log: $PSScriptRoot\server.error.log" -ForegroundColor Yellow
    
    # Clean up PID file if start failed
    Remove-Item $pidFile -ErrorAction SilentlyContinue
}
