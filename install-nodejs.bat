@echo off
echo ========================================
echo   StudyPlanner - Node.js Installation
echo ========================================
echo.
echo This will help you install Node.js to run your StudyPlanner app.
echo.
echo Step 1: Download Node.js
echo Please follow these steps:
echo.
echo 1. Open your web browser
echo 2. Go to: https://nodejs.org/
echo 3. Click "Download Node.js (LTS)" - the green button
echo 4. Run the downloaded installer (.msi file)
echo 5. Follow the installation wizard (keep all defaults)
echo 6. Restart this terminal when done
echo.
echo Step 2: After installation, run this script again
echo.
pause
echo.
echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Node.js is installed!
    node --version
    echo.
    echo ✓ npm is available!
    npm --version
    echo.
    echo Now installing project dependencies...
    echo This may take a few minutes...
    npm install
    echo.
    echo ========================================
    echo   Installation Complete! 🎉
    echo ========================================
    echo.
    echo To start your StudyPlanner app, run:
    echo   npm run dev
    echo.
    echo Then open: http://localhost:3000
    echo.
    echo Demo login:
    echo   Email: demo@studyplanner.com
    echo   Password: demo123
    echo.
    pause
) else (
    echo ❌ Node.js is not installed yet.
    echo Please install Node.js first, then run this script again.
    echo.
    echo Download from: https://nodejs.org/
    echo.
    pause
)
