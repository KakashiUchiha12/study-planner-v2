@echo off
echo Starting StudyPlanner Desktop App...
echo.

REM Check if Node.js is available
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: npm is not available
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if Electron is installed
if not exist "node_modules\electron" (
    echo Installing Electron...
    npm install --save-dev electron electron-builder
    if %errorlevel% neq 0 (
        echo Error: Failed to install Electron
        pause
        exit /b 1
    )
)

echo Starting StudyPlanner Desktop App...
echo.

REM Start the Electron app in development mode
npm run electron:dev

echo.
echo StudyPlanner Desktop App has been closed.
pause
