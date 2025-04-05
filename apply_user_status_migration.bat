@echo off
echo Applying user status migration...

rem Set environment variables from .env file
for /f "tokens=*" %%a in (.env) do (
  set %%a
)

rem Check if we have a direct database URL
if defined SUPABASE_DB_URL (
  set DB_CONNECTION=%SUPABASE_DB_URL%
) else (
  echo SUPABASE_DB_URL not found in .env file.
  echo Will try to use the Supabase REST API instead.
  echo.
  echo Please run the JavaScript version instead:
  echo node apply_user_status_migration.js
  exit /b 1
)

rem Connect to database and run migration script
echo Running migration script...
psql "%DB_CONNECTION%" -f supabase/migrations/20230501_add_user_status.sql

if %ERRORLEVEL% NEQ 0 (
  echo Error: Migration failed! 
  echo Please check that psql is installed and your database connection string is correct.
  echo.
  echo Try running the JavaScript version instead:
  echo node apply_user_status_migration.js
) else (
  echo Migration completed successfully!
)

pause 