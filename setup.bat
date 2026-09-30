@echo off
echo ================================================================
echo Setting up Retail Inventory Management System (RetailSync)
echo ================================================================
echo.
echo 1. Installing Backend Dependencies...
cd backend
call npm install
echo.
echo 2. Initializing Database and Seeding Sample Data...
call npm run seed
cd ..
echo.
echo 3. Installing Frontend Dependencies...
cd frontend
call npm install
cd ..
echo.
echo ================================================================
echo Setup Complete!
echo Run 'start-all.bat' to launch the project.
echo ================================================================
pause
