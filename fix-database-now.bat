@echo off
echo ========================================
echo   Fixing Database Connection
echo ========================================
echo.

cd backend

echo Method 1: Using Railway reference syntax...
railway variables --set DATABASE_URL=${{Postgres.DATABASE_URL}}

echo.
echo Waiting for deployment...
timeout /t 5 /nobreak

echo.
echo Checking status...
railway status

echo.
echo ========================================
echo   Done!
echo ========================================
echo.
echo Wait 2-3 minutes for redeployment, then run:
echo   railway logs
echo.
pause


