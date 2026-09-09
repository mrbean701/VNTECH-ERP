@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title VNTECH ERP V5.3.0 FULL W2 - CAI MOI SERVER
echo ===============================================================
echo VNTECH ERP V5.3.0 FULL W2 - FULL SERVER INSTALLER
echo Cai moi doc lap, tu kiem tra source, migration, build va runtime.
echo Trust Lock: Development Mode - License Enforcement Disabled.
echo ===============================================================
echo.
set "VNTECH_FINAL_CLEAN_INSTALL=1"
where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] Can Node.js 22.13 tro len va Docker Desktop/Engine.
  pause
  exit /b 1
)
node scripts\verify-full-release.mjs --strict-package
if errorlevel 1 (
  echo [LOI] Bo cai khong dat kiem tra toan ven. Dung cai dat.
  pause
  exit /b 1
)
node scripts\universal-installer.mjs
set "VNTECH_EXIT=%ERRORLEVEL%"
if not "%VNTECH_EXIT%"=="0" pause
exit /b %VNTECH_EXIT%
