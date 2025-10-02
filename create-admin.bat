@echo off
echo Setting up ComplianceOS Admin Credentials...
echo.

REM Set the DATABASE_URL environment variable
set DATABASE_URL=postgresql://postgres:Admin1234@localhost:5432/cos?schema=public

REM Run the admin creation script
node create-admin-credentials.js

echo.
echo Press any key to exit...
pause > nul
