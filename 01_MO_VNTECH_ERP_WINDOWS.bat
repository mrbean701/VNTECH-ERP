@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
set "PORT=8787"
if exist ".env" (
  for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
    if /I "%%A"=="VNTECH_APP_PORT" set "PORT=%%B"
  )
)
echo Mo VNTECH ERP FULL W2 tai http://127.0.0.1:%PORT%/?vntech_build=full-w2
start "" "http://127.0.0.1:%PORT%/?vntech_build=full-w2"
endlocal
