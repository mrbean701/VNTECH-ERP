@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
:MENU
cls
echo ===============================================================
echo VNTECH ERP V5.3.0 FULL W2 - QUAN LY HE THONG
echo ===============================================================
echo 1. Khoi dong
echo 2. Dung
echo 3. Khoi dong lai
echo 4. Xem trang thai
echo 5. Xem log App
echo 6. Sao luu database ngay
echo 7. Phuc hoi database tu file .dump
echo 8. Kiem tra ban dang chay
echo 0. Thoat
echo.
set /p CHOICE=Chon: 
if "%CHOICE%"=="1" node scripts\deployment-control.mjs start
if "%CHOICE%"=="2" node scripts\deployment-control.mjs stop
if "%CHOICE%"=="3" node scripts\deployment-control.mjs restart
if "%CHOICE%"=="4" node scripts\deployment-control.mjs status
if "%CHOICE%"=="5" node scripts\deployment-control.mjs logs
if "%CHOICE%"=="6" node scripts\deployment-control.mjs backup
if "%CHOICE%"=="7" goto RESTORE
if "%CHOICE%"=="8" node scripts\verify-live-deployment.mjs
if "%CHOICE%"=="0" exit /b 0
echo.
pause
goto MENU
:RESTORE
echo CANH BAO: phuc hoi se ghi de database nghiep vu hien tai.
set /p DUMP=Nhap duong dan file .dump: 
if "%DUMP%"=="" goto MENU
node scripts\deployment-control.mjs restore "%DUMP%"
echo.
pause
goto MENU
