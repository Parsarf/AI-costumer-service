@echo off
echo Adding SCOPES environment variable to Railway...

railway variables --set "SCOPES=read_products,read_orders,read_customers,write_themes"

echo ✅ SCOPES variable added!
echo.
echo Now your app should work properly. Check your Railway app URL.
pause

