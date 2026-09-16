@echo off
REM ============================================================================
REM  VNTECH ERP - KHOI DONG CUTOVER (Phuong an A)
REM    Node SSR (giao dien)  ->  Java API (nghiep vu)  ->  MySQL
REM
REM  Cach dung:  bam dup file nay. Sau do mo trinh duyet:
REM                http://127.0.0.1:9000
REM
REM  Script CHAY LAI DUOC NHIEU LAN: dich vu nao dang chay se duoc bo qua.
REM
REM  GHI CHU KY THUAT (de tranh tai phat loi):
REM   - Khong dat JAVA_HOME va dung %JAVA_HOME% tren cung mot dong lenh:
REM     cmd.exe mo rong %VAR% truoc khi lenh "set" kip chay.
REM   - Khong dung %_n% / %_UP% ben trong khoi ( ... ) vi chung duoc mo rong
REM     MOT LAN luc phan tich khoi, khong phai moi vong lap.
REM ============================================================================
setlocal EnableExtensions
cd /d "%~dp0.."
set "ROOT=%CD%"

echo ============================================================
echo  VNTECH ERP - KHOI DONG HE THONG (Java + MySQL)
echo ============================================================
echo.

REM --- Tim Java ---------------------------------------------------------------
set "JAVA_EXE="
if exist "C:\Users\PC\.jdks\openjdk-26.0.2.1\bin\java.exe" set "JAVA_EXE=C:\Users\PC\.jdks\openjdk-26.0.2.1\bin\java.exe"
if not defined JAVA_EXE (
  for /d %%D in ("C:\Users\PC\.jdks\*") do if exist "%%D\bin\java.exe" set "JAVA_EXE=%%D\bin\java.exe"
)
if not defined JAVA_EXE (
  for %%J in (java.exe) do if not "%%~$PATH:J"=="" set "JAVA_EXE=%%~$PATH:J"
)
if not defined JAVA_EXE (
  echo [LOI] Khong tim thay java.exe.
  echo       Da tim: C:\Users\PC\.jdks\*  va  PATH he thong.
  echo       Cai JDK 21+ roi chay lai, hoac sua bien JAVA_EXE trong file nay.
  echo.
  pause
  exit /b 1
)
echo [0/4] Java: %JAVA_EXE%

REM --- 1) MySQL ---------------------------------------------------------------
echo [1/4] Kiem tra MySQL...
sc query MySQL80 | findstr /C:"RUNNING" >nul
if not errorlevel 1 goto mysql_ok
echo       MySQL chua chay - dang khoi dong...
net start MySQL80 >nul 2>&1
call :sleepsec 3
sc query MySQL80 | findstr /C:"RUNNING" >nul
if not errorlevel 1 goto mysql_ok
echo       [LOI] Khong khoi dong duoc MySQL80. Mo Services.msc va kiem tra.
pause
exit /b 1
:mysql_ok
echo       OK

REM --- 2) Java API (:18081) ---------------------------------------------------
echo [2/4] Khoi dong Java API (:18081)...
call :isup 18081
if "%_UP%"=="1" goto java_running
start "VNTECH Java API" /D "%ROOT%\java-backend" cmd /k ""%JAVA_EXE%" -jar web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar --server.port=18081"
echo       Dang cho Java san sang (toi da 60s)...
call :waitport 18081 30
if "%_UP%"=="1" (echo       OK) else (echo       [CANH BAO] Java chua phan hoi - xem cua so "VNTECH Java API")
goto java_done
:java_running
echo       Da chay - bo qua.
:java_done

REM --- 3) Node UI (:8787) -----------------------------------------------------
echo [3/4] Khoi dong giao dien Node SSR (:8787)...
call :isup 8787
if "%_UP%"=="1" goto node_running
start "VNTECH Node UI" /D "%ROOT%" cmd /k "node scripts\local-server.mjs"
echo       Dang cho giao dien (toi da 30s)...
call :waitport 8787 15
if "%_UP%"=="1" (echo       OK) else (echo       [CANH BAO] Giao dien chua phan hoi - xem cua so "VNTECH Node UI")
goto node_done
:node_running
echo       Da chay - bo qua.
:node_done

REM --- 4) Proxy (:9000) -------------------------------------------------------
echo [4/4] Khoi dong Proxy cutover (:9000)...
call :isup 9000
if "%_UP%"=="1" goto proxy_running
start "VNTECH Proxy" /D "%ROOT%" cmd /k "node tools\cutover-proxy.mjs --port 9000 --ui-port 8787 --api-port 18081"
echo       Dang cho proxy (toi da 20s)...
call :waitport 9000 10
if "%_UP%"=="1" (echo       OK) else (echo       [CANH BAO] Proxy chua phan hoi - xem cua so "VNTECH Proxy")
goto proxy_done
:proxy_running
echo       Da chay - bo qua.
:proxy_done

REM --- Kiem tra cuoi ----------------------------------------------------------
echo.
echo ============================================================
echo   KIEM TRA DICH VU
echo ============================================================
call :isup 18081
if "%_UP%"=="1" (echo   [OK]   Java API   :18081) else (echo   [LOI]  Java API   :18081  - CHUA CHAY)
call :isup 8787
if "%_UP%"=="1" (echo   [OK]   Giao dien  :8787 ) else (echo   [LOI]  Giao dien  :8787   - CHUA CHAY)
call :isup 9000
if "%_UP%"=="1" (echo   [OK]   Proxy      :9000 ) else (echo   [LOI]  Proxy      :9000   - CHUA CHAY)
echo.
echo   MO TRINH DUYET:   http://127.0.0.1:9000
echo.
echo   Tai khoan:        admin
echo   Mat khau:         Admin123456@
echo.
echo   - /api/*  -^> Java :18081  (nghiep vu + MySQL)
echo   - con lai -^> Node :8787   (giao dien)
echo   - Duong rollback: http://127.0.0.1:8787 (backend JS cu)
echo ============================================================
start http://127.0.0.1:9000
endlocal
exit /b 0

REM ===========================================================================
REM  Helper: dat _UP=1 neu co tien trinh dang lang nghe tren cong %1
REM ===========================================================================
:isup
set "_UP="
for /f "tokens=*" %%A in ('netstat -an ^| findstr /C:"LISTENING" ^| findstr /C:":%1 "') do set "_UP=1"
exit /b 0

REM ===========================================================================
REM  Helper: cho toi khi cong %1 lang nghe, toi da %2 lan x 2 giay
REM ===========================================================================
:waitport
set /a _n=0
:waitport_loop
call :sleepsec 2
set /a _n+=1
call :isup %1
if "%_UP%"=="1" exit /b 0
if %_n% lss %2 goto waitport_loop
exit /b 1

REM ===========================================================================
REM  Helper: ngu %1 giay.
REM  DUNG "timeout" SE HONG khi stdin bi chuyen huong
REM  ("ERROR: Input redirection is not supported") nen phai dung ping.
REM ===========================================================================
:sleepsec
set /a _s=%1+1
ping -n %_s% 127.0.0.1 >nul 2>&1
exit /b 0
