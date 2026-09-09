@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title VNTECH ERP V5.3.0 FULL W2 - NANG CAP GIU NGUYEN DU LIEU
echo ===============================================================
echo VNTECH ERP V5.3.0 FULL W2 - NANG CAP GIU NGUYEN DU LIEU
echo Co backup va rollback; giu tai khoan, du an, PostgreSQL, storage.
echo ===============================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] Can Node.js 22.13 tro len.
  pause
  exit /b 1
)
node scripts\upgrade-preserve-data.mjs
set "VNTECH_EXIT=%ERRORLEVEL%"
if not "%VNTECH_EXIT%"=="0" pause
exit /b %VNTECH_EXIT%
