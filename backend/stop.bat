@echo off
setlocal
cd /d "%~dp0"
echo Stopping AI Kernel Server...

if exist .server.pid (
    set /p PID=<.server.pid
    powershell -NoProfile -Command "$pid=%PID%; $p=Get-Process -Id $pid -ErrorAction SilentlyContinue; if ($p) { $cmd=(Get-CimInstance Win32_Process -Filter \"ProcessId=$pid\").CommandLine; if ($cmd -and $cmd -like '*src\\server.js*' -and $cmd -like '*%cd%*') { Stop-Process -Id $pid -Force; 'stopped' } else { 'pid-mismatch' } } else { 'not-running' }" > .stop.tmp
    set /p RESULT=<.stop.tmp
    del .stop.tmp
    if "%RESULT%"=="stopped" (
        del .server.pid
        echo Server stopped successfully
        exit /b 0
    ) else if "%RESULT%"=="pid-mismatch" (
        echo PID file does not match this project server. Not stopping.
        exit /b 1
    ) else (
        del .server.pid
        echo No server running
        exit /b 0
    )
)

powershell -NoProfile -Command "$procs=Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*src\\server.js*' -and $_.CommandLine -like '*%cd%*' }; if ($procs) { $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }; 'stopped' } else { 'not-found' }" > .stop.tmp
set /p RESULT=<.stop.tmp
del .stop.tmp
if "%RESULT%"=="stopped" (
    echo Server stopped successfully
) else (
    echo No server running
)
endlocal
