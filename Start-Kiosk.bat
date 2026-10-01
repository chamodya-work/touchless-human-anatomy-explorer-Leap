@echo off
REM =====================================================================
REM  Start-Kiosk.bat  --  Touchless Human Anatomy Explorer
REM ---------------------------------------------------------------------
REM  Starts a local static web server for THIS folder and opens the
REM  explorer full-screen in Chrome or Edge (kiosk mode).
REM
REM  Needs NOTHING installed on the machine: it uses the portable server
REM  bundled in tools\server\miniserve.exe. If that is missing it falls
REM  back to Python, then Node, and finally to the default browser.
REM
REM  Usage: double-click this file. To stop, close the "AnatomyServer"
REM  window that appears, or run Stop-Kiosk.bat.
REM
REM  Test hook: if the environment variable ANATOMY_NO_BROWSER is set,
REM  the browser is NOT opened (the server still starts). Useful for
REM  automated checks. See SETUP.md.
REM =====================================================================

setlocal EnableExtensions
cd /d "%~dp0"

REM ---- Settings -------------------------------------------------------
set "PORT=8080"
set "URL=http://localhost:%PORT%/"
REM ---------------------------------------------------------------------

echo.
echo  Touchless Human Anatomy Explorer
echo  Serving: %CD%
echo.

REM ---- 1) Pick and start a static server -----------------------------
set "SERVER_KIND="

if exist "%~dp0tools\server\miniserve.exe" goto :use_miniserve
where python >nul 2>nul && goto :use_python
where py     >nul 2>nul && goto :use_py
where node   >nul 2>nul && goto :use_node
goto :no_server

:use_miniserve
echo  [server] Using the bundled portable server ^(miniserve^) - zero install.
start "AnatomyServer" /min "%~dp0tools\server\miniserve.exe" --index index.html -p %PORT%
set "SERVER_KIND=miniserve (bundled)"
goto :wait

:use_python
echo  [server] Bundled server not found - falling back to Python.
start "AnatomyServer" /min cmd /c "python -m http.server %PORT%"
set "SERVER_KIND=python -m http.server"
goto :wait

:use_py
echo  [server] Bundled server not found - falling back to the Python launcher.
start "AnatomyServer" /min cmd /c "py -m http.server %PORT%"
set "SERVER_KIND=py -m http.server"
goto :wait

:use_node
echo  [server] Bundled server not found - falling back to Node ^(npx serve^).
start "AnatomyServer" /min cmd /c "npx --yes serve -l %PORT% ."
set "SERVER_KIND=npx serve"
goto :wait

:no_server
echo.
echo  [ERROR] No static server available.
echo          - The bundled server was not found at: tools\server\miniserve.exe
echo          - Neither Python nor Node is installed on this machine either.
echo          See SETUP.md. To fix: restore tools\server\miniserve.exe,
echo          or install Python 3 and run this file again.
echo.
pause
exit /b 1

:wait
REM Give the server a moment to bind the port.
timeout /t 2 /nobreak >nul

REM ---- 2) Open the interface in kiosk mode ---------------------------
if defined ANATOMY_NO_BROWSER goto :no_browser

set "PF=%ProgramFiles%"
set "PF86=%ProgramFiles(x86)%"
set "LAD=%LocalAppData%"
set "BROWSER="

if exist "%PF%\Google\Chrome\Application\chrome.exe" set "BROWSER=%PF%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%PF86%\Google\Chrome\Application\chrome.exe" set "BROWSER=%PF86%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%LAD%\Google\Chrome\Application\chrome.exe" set "BROWSER=%LAD%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%PF86%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%PF86%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%PF%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%PF%\Microsoft\Edge\Application\msedge.exe"

if not defined BROWSER goto :open_default

echo  [browser] Opening in kiosk mode - press Alt+F4 to exit.
start "" "%BROWSER%" --kiosk --no-first-run --disable-features=TranslateUI "%URL%"
goto :done

:open_default
echo  [browser] Chrome/Edge not found - opening in the default browser, not fullscreen.
start "" "%URL%"
goto :done

:no_browser
echo  [browser] ANATOMY_NO_BROWSER is set - skipping browser launch.

:done
echo.
echo  Ready at %URL%
echo  Server: %SERVER_KIND%
echo  To stop the server: close the "AnatomyServer" window, or run Stop-Kiosk.bat.
echo.
endlocal
exit /b 0
