@echo off
REM ============================================================================
REM  VNTECH ERP - KHOI DONG CUTOVER (Phuong an A)
REM    Node SSR (giao dien)  ->  Java API (nghiep vu)  ->  MySQL
REM
REM  Cach dung:  bam dup file nay. Sau do mo trinh duyet:
REM                http://127.0.0.1:9000
REM ============================================================================
setlocal
cd /d "%~dp0.."

echo ============================================================
echo  VNTECH ERP - KHOI DONG HE THONG (Java + MySQL)
echo ============================================================
echo.

REM --- 1) MySQL ---------------------------------------------------------------
echo [1/4] Kiem tra MySQL...
sc query MySQL80 | findstr /C:"RUNNING" >nul
if errorlevel 1 (
  echo       MySQL chua chay - dang khoi dong...
  net start MySQL80 >nul 2>&1
)
echo       OK

REM --- 2) Java API ------------------------------------------------------------
echo [2/4] Khoi dong Java API (:18081)...
start "VNTECH Java API" cmd /k "cd /d %~dp0..\java-backend && set JAVA_HOME=C:\Users\PC\.jdks\openjdk-26.0.2.1 && "%JAVA_HOME%\bin\java.exe" -jar web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar --server.port=18081"
echo       Dang cho Java san sang...
set /a _n=0
:waitjava
timeout /t 2 /nobreak >nul
set /a _n+=1
curl -s -o nul http://127.0.0.1:18081/api/health 2>nul
if errorlevel 1 (
  if %_n% lss 25 goto waitjava
  echo       CANH BAO: Java chua phan hoi sau 50s - xem cua so "VNTECH Java API"
) else (
  echo       Java OK
)

REM --- 3) Node UI -------------------------------------------------------------
echo [3/4] Khoi dong giao dien Node SSR (:8787)...
start "VNTECH Node UI" cmd /k "cd /d %~dp0.. && node scripts\local-server.mjs"
timeout /t 5 /nobreak >nul
echo       OK

REM --- 4) Proxy ---------------------------------------------------------------
echo [4/4] Khoi dong Proxy cutover (:9000)...
start "VNTECH Proxy" cmd /k "cd /d %~dp0.. && node tools\cutover-proxy.mjs --port 9000 --ui-port 8787 --api-port 18081"
timeout /t 3 /nobreak >nul

echo.
echo ============================================================
echo   SAN SANG
echo ============================================================
echo.
echo   MO TRINH DUYET:   http://127.0.0.1:9000
echo.
echo   Tai khoan:        admin
echo   Mat khau:         Vntech@2026
echo.
echo   - /api/*  -> Java :18081  (nghiep vu + MySQL)
echo   - con lai -> Node :8787   (giao dien)
echo   - Duong rollback: http://127.0.0.1:8787 (backend JS cu)
echo ============================================================
start http://127.0.0.1:9000
endlocal
