@echo off
echo ========================================
echo   Running Migration on Railway
echo ========================================
echo.

echo Step 1: Setting Railway environment...
railway variables --set NODE_ENV=production

echo.
echo Step 2: Running migration on Railway servers...
railway run npx prisma migrate deploy

echo.
echo Step 3: Generating Prisma client...
railway run npx prisma generate

echo.
echo ========================================
echo   Migration Complete!
echo ========================================
echo.
echo The app will restart automatically.
echo Wait 2-3 minutes, then check:
echo   railway logs
echo.
pause

