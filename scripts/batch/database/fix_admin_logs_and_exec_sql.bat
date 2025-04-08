@echo off
echo ====================================================
echo Database Fix Script - Admin Logs and Exec_SQL Function
echo ====================================================
echo.

REM Update these variables with your connection details
set DB_NAME=your_database_name
set DB_USER=postgres
set DB_HOST=localhost
set DB_PORT=5432

echo Choose fix method:
echo 1. Step-by-step fixes (minimal_fix.sql then fix_exec_sql.sql)
echo 2. All-in-one transaction fix (all_in_one_fix.sql)
echo 3. Simple fix (recommended - simple_fix.sql)
echo.
set /p CHOICE="Enter your choice (1, 2 or 3): "

if "%CHOICE%"=="1" (
    echo.
    echo Running step-by-step fixes...
    
    echo Running admin_logs constraint fix...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f minimal_fix.sql
    
    echo.
    echo Running exec_sql function fix...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f fix_exec_sql.sql
) else if "%CHOICE%"=="2" (
    echo.
    echo Running all-in-one transaction fix...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f all_in_one_fix.sql
) else (
    echo.
    echo Running simple fix...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f simple_fix.sql
)

echo.
echo All fixes completed.
echo If no errors appeared, the fixes were successful.
pause 