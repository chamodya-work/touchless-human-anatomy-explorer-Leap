@echo off
REM =====================================================================
REM  Stop-Kiosk.bat  --  Touchless Human Anatomy Explorer
REM ---------------------------------------------------------------------
REM  Stops the static server started by Start-Kiosk.bat.
REM =====================================================================

echo Stopping the anatomy server...

REM Servers started by Start-Kiosk.bat all use the window title "AnatomyServer".
REM /T also kills child processes (e.g. the python.exe behind a cmd window).
taskkill /f /t /fi "WINDOWTITLE eq AnatomyServer*" >nul 2>nul

REM The bundled server, in case it was started another way
taskkill /f /im miniserve.exe >nul 2>nul
taskkill /f /im caddy.exe      >nul 2>nul

echo Done. If a stray server window is still open, just close it manually.
timeout /t 2 /nobreak >nul
exit /b 0
