@echo off
setlocal
chcp 65001 >nul
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\update-activity-albums.ps1"
if errorlevel 1 (
  echo.
  echo 更新失败，请查看上方错误信息。
)
echo.
pause
