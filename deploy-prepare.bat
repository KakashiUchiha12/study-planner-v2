@echo off
echo 🚀 StudyPlanner Deployment Preparation Script
echo =============================================

REM Create deployment directory
if not exist "studyplanner-deploy" mkdir studyplanner-deploy
if not exist "studyplanner-deploy\public" mkdir studyplanner-deploy\public

echo 📁 Copying essential files...

REM Copy built application
xcopy ".next" "studyplanner-deploy\.next" /E /I /Y
echo ✅ Copied .next folder

REM Copy public assets
xcopy "public" "studyplanner-deploy\public" /E /I /Y
echo ✅ Copied public folder

REM Copy configuration files
copy "package.json" "studyplanner-deploy\"
copy "package-lock.json" "studyplanner-deploy\"
copy "next.config.js" "studyplanner-deploy\"
copy "passenger_wsgi.py" "studyplanner-deploy\"
copy "env-production-template.txt" "studyplanner-deploy\"
copy "DEPLOYMENT-CHECKLIST.md" "studyplanner-deploy\"
echo ✅ Copied configuration files

REM Copy source code folders
xcopy "prisma" "studyplanner-deploy\prisma" /E /I /Y
xcopy "lib" "studyplanner-deploy\lib" /E /I /Y
xcopy "components" "studyplanner-deploy\components" /E /I /Y
xcopy "app" "studyplanner-deploy\app" /E /I /Y
echo ✅ Copied source code folders

echo.
echo 🎉 Deployment preparation complete!
echo.
echo 📋 Next steps:
echo 1. Review DEPLOYMENT-CHECKLIST.md
echo 2. Configure your .env.local file
echo 3. Upload studyplanner-deploy folder to cPanel
echo 4. Follow the deployment checklist
echo.
echo 📁 Your deployment files are in: studyplanner-deploy\
pause
