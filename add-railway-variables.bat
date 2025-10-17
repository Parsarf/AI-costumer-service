@echo off
echo ========================================
echo   Adding Environment Variables
echo ========================================
echo.

cd backend

echo Adding SCOPES...
railway variables --set SCOPES=read_products,read_orders,read_customers,write_themes

echo Adding OPENAI_API_KEY...
railway variables --set OPENAI_API_KEY=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

echo Adding SHOPIFY_API_KEY...
railway variables --set SHOPIFY_API_KEY=236a8ec4bab4aadc625ef47717361888

echo Adding SHOPIFY_API_SECRET...
railway variables --set SHOPIFY_API_SECRET=0c8b288648f4aaf6bf87c52e86a935a9

echo Adding NODE_ENV...
railway variables --set NODE_ENV=production

echo Adding PORT...
railway variables --set PORT=3001

echo Adding BILLING_PRICE...
railway variables --set BILLING_PRICE=9.99

echo Adding BILLING_TRIAL_DAYS...
railway variables --set BILLING_TRIAL_DAYS=7

echo Adding SHOPIFY_BILLING_TEST...
railway variables --set SHOPIFY_BILLING_TEST=false

echo Adding FREE_PLAN...
railway variables --set FREE_PLAN=false

echo Adding LOG_LEVEL...
railway variables --set LOG_LEVEL=info

echo.
echo Generating JWT_SECRET...
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"') do (
    echo Adding JWT_SECRET...
    railway variables --set JWT_SECRET=%%i
)

echo.
echo Generating ENCRYPTION_KEY...
for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do (
    echo Adding ENCRYPTION_KEY...
    railway variables --set ENCRYPTION_KEY=%%i
)

echo.
echo ========================================
echo   Variables Added!
echo ========================================
echo.
echo The app will automatically redeploy.
echo Wait 2-3 minutes, then run:
echo   railway status
echo.
pause


