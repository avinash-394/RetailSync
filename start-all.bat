@echo off
echo ================================================================
echo Starting Retail Inventory Management System (RetailSync)
echo ================================================================
echo.
echo Launching Backend Server on port 5000...
start "RetailSync Backend" cmd /k "cd backend && npm start"
echo Launching Frontend Client on port 3000...
start "RetailSync Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo ================================================================
echo Both services are starting!
echo Backend API:  http://localhost:5000/api
echo Frontend App: http://localhost:3000
echo Demo Admin:   admin@retail.com / admin123
echo Demo Staff:   staff@retail.com / staff123
echo ================================================================
pause
