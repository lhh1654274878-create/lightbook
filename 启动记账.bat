@echo off
chcp 65001 >nul
title 轻记账 LightBook - 本地服务器
echo ============================================
echo   轻记账 LightBook 服务器启动中...
echo ============================================
echo.
cd /d "%~dp0"
python -m http.server 8668
pause
