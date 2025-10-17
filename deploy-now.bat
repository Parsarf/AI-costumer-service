@echo off
echo ========================================
echo   Railway Deployment - Automated
echo ========================================
echo.

REM Your credentials
set SHOPIFY_API_KEY=236a8ec4bab4aadc625ef47717361888
set SHOPIFY_API_SECRET=0c8b288648f4aaf6bf87c52e86a935a9
set OPENAI_API_KEY=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
set RAILWAY_TOKEN=f630810a-7e80-4738-9000-f2c1d7212772

echo Step 1: Installing Railway CLI...
call npm install -g @railway/cli
echo.

echo Step 2: Logging into Railway...
set RAILWAY_TOKEN=%RAILWAY_TOKEN%
echo.

echo Step 3: Initializing project...
cd backend
call railway init
echo.

echo Step 4: Adding PostgreSQL database...
call railway add postgresql
echo.

echo Step 5: Setting environment variables...
call railway variables set OPENAI_API_KEY=%OPENAI_API_KEY%
call railway variables set SHOPIFY_API_KEY=%SHOPIFY_API_KEY%
call railway variables set SHOPIFY_API_SECRET=%SHOPIFY_API_SECRET%
call railway variables set NODE_ENV=production
call railway variables set PORT=3001
call railway variables set SCOPES=read_products,read_orders,read_customers,write_themes
call railway variables set BILLING_PRICE=9.99
call railway variables set BILLING_TRIAL_DAYS=7
call railway variables set SHOPIFY_BILLING_TEST=false
call railway variables set FREE_PLAN=false
call railway variables set LOG_LEVEL=info
echo.

echo Step 6: Generating security keys...
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"') do set JWT_SECRET=%%i
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set ENCRYPTION_KEY=%%i
call railway variables set JWT_SECRET=%JWT_SECRET%
call railway variables set ENCRYPTION_KEY=%ENCRYPTION_KEY%
echo.

echo Step 7: Deploying application...
call railway up
echo.

echo Step 8: Running database migrations...
call railway run npx prisma migrate deploy
echo.

echo Step 9: Getting your app URL...
call railway domain
echo.

echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Copy the URL shown above
echo 2. Go to https://partners.shopify.com
echo 3. Update your app URLs with the Railway domain
echo.
pause


