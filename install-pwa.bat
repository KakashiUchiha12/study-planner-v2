@echo off
echo ========================================
echo    StudyPlanner PWA Installer
echo ========================================
echo.

echo Starting StudyPlanner development server...
echo.

REM Start the development server
npm run dev

echo.
echo ========================================
echo Installation Instructions:
echo ========================================
echo.
echo 1. Wait for the server to start
echo 2. Open your browser and go to: http://localhost:3000
echo 3. Look for the install button in the address bar
echo 4. Or go to: http://localhost:3000/pwa-installer.html
echo.
echo Alternative installation methods:
echo - Chrome/Edge: Three dots menu ^> Install StudyPlanner
echo - Firefox: Three dots menu ^> Install
echo - Developer Tools: F12 ^> Application ^> Manifest ^> Add to homescreen
echo.
pause
