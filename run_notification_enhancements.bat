@echo off
echo ===================================================
echo  Notification System Enhancements Deployment Tool
echo ===================================================
echo.

echo Checking for required environment variables...
if not defined SUPABASE_URL (
  echo ERROR: SUPABASE_URL environment variable is not set
  echo Please set it using: set SUPABASE_URL=your-project-url
  exit /b 1
)

if not defined SUPABASE_SERVICE_ROLE_KEY (
  echo ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is not set
  echo Please set it using: set SUPABASE_SERVICE_ROLE_KEY=your-service-key
  exit /b 1
)

echo Environment variables OK!
echo.
echo Running notification system enhancements script...
echo.

node apply_notification_enhancements.js

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo ERROR: Notification system enhancements failed. Please check the logs.
  exit /b 1
) else (
  echo.
  echo ============================================================
  echo  Notification System Enhancements Successfully Deployed!
  echo ============================================================
  echo.
  echo The notification system has been enhanced with:
  echo  - Real-time notification capabilities
  echo  - Message previews and seen status
  echo  - Badge counting functions
  echo  - Enhanced RLS policies
  echo.
  echo Next steps:
  echo  - Make sure NotificationManager is included in your App.js
  echo  - Test the system by sending notifications
  echo  - Check the notifications page for proper display
  echo.
)

pause 