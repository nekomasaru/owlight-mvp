@echo off
cd /d "%~dp0"
echo -----------------------------------------
echo OWLight: %~dp0
echo Starting Dev Server...
echo -----------------------------------------
call npm run dev
pause
