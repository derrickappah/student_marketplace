@echo off
echo Fixing admin_logs issue (you must run this first)...
node apply_admin_logs_fix.js
echo.
echo After this completes successfully, you can run the other fix scripts:
echo - run_stats_cached_fix.bat
echo - run_fixes.bat
echo.
echo Press any key to exit...
pause > nul 