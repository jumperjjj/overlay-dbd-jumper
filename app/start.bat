@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js nao encontrado. Instale o Node.js LTS e tente novamente.
 pause
 exit /b
)
start "DBD Overlay Server" cmd /k node server.js
timeout /t 2 >nul
start http://127.0.0.1:8765/panel.html
