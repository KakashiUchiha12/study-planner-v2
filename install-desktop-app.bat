@echo off
echo Starting StudyPlanner Desktop Installer...
echo.

REM Check if Node.js is running
netstat -an | find "3000" >nul
if %errorlevel% equ 0 (
    echo StudyPlanner is already running on port 3000
    echo Opening desktop installer...
    start "" "desktop-installer.html"
) else (
    echo Starting StudyPlanner server...
    start "" "install-pwa.bat"
    timeout /t 5 /nobreak >nul
    echo Opening desktop installer...
    start "" "desktop-installer.html"
)

echo.
echo Desktop installer opened in your browser.
echo Follow the instructions to install StudyPlanner as a desktop app.
echo.
pause

