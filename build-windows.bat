@echo off
echo Building StudyPlanner Windows Application...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed or not in PATH
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Building Next.js application...
call npm run build
if %errorlevel% neq 0 (
    echo Error: Failed to build Next.js application
    pause
    exit /b 1
)

echo.
echo Building Electron application for Windows...
call npm run electron:build
if %errorlevel% neq 0 (
    echo Error: Failed to build Electron application
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo.
echo Output files are in the 'dist' folder:
dir /b dist\*.exe
echo.
echo You can now distribute the installer and portable versions.
echo.
pause
