@echo off
echo ========================================
echo   Running Database Migrations
echo ========================================
echo.

cd backend

echo Step 1: Running Prisma migrations...
railway run npx prisma migrate deploy

echo.
echo Step 2: Generating Prisma client...
railway run npx prisma generate

echo.
echo Step 3: Checking migration status...
railway run npx prisma migrate status

echo.
echo ========================================
echo   Migrations Complete!
echo ========================================
echo.
echo The app will automatically restart.
echo Wait 1-2 minutes, then check:
echo   railway logs
echo.
pause


