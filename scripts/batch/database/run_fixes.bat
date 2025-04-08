@echo off
echo Setting environment variables...
set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZHNtcmxjYmhhbndhZm50bmN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzQ1NTI1NywiZXhwIjoyMDU5MDMxMjU3fQ.5WtLoj-nxDx_g8UtDjCEYYpKWztwzONAe7AuilXpRt0

echo Running listing delete fix script...
node apply_listing_delete_fix.js

echo.
echo IMPORTANT: Remember to delete this batch file after use as it contains your API key.
echo Press any key to exit...
pause > nul 