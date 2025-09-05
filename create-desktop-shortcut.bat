@echo off
echo ========================================
echo   StudyPlanner Desktop Shortcut Creator
echo ========================================
echo.

REM Get the current directory
set "CURRENT_DIR=%~dp0"
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\StudyPlanner.url"

echo Creating desktop shortcut...

REM Create the URL shortcut file
(
echo [InternetShortcut]
echo URL=http://localhost:3000
echo IconFile=%CURRENT_DIR%public\icons\icon-192x192.png
echo IconIndex=0
echo IDList=
echo HotKey=0
echo [{000214A0-0000-0000-C000-000000000046}]
echo Prop3=19,0
) > "%SHORTCUT_PATH%"

if exist "%SHORTCUT_PATH%" (
    echo ✅ Desktop shortcut created successfully!
    echo.
    echo The shortcut is located at:
    echo %SHORTCUT_PATH%
    echo.
    echo To use it:
    echo 1. Start the development server: npm run dev
    echo 2. Double-click the StudyPlanner shortcut on your desktop
    echo 3. Install the PWA when prompted
) else (
    echo ❌ Failed to create desktop shortcut
)

echo.
pause
