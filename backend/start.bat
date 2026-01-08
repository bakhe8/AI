@echo off
setlocal
cd /d "%~dp0"
set "PORT=3000"

echo Stopping any previous instance...
call stop.bat >nul 2>nul

echo Starting AI Kernel Server on http://localhost:%PORT%
echo Press Ctrl+C to stop
echo.
start /B node src/server.js > server.log 2> server.error.log
timeout /t 2 /nobreak >nul

powershell -NoProfile -Command "Get-Process -Name node | Where-Object {$_.Path -like '*node.exe'} | Select-Object -First 1 | ForEach-Object {$_.Id} | Out-File -FilePath '.server.pid' -Encoding ASCII"

echo Server started. Check http://localhost:3000
echo Logs: %cd%\server.log
echo Errors: %cd%\server.error.log
endlocal
