@echo off
echo Clearing temporary files...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo Setting lower memory limits...
set NODE_OPTIONS=--max-old-space-size=512
echo Starting app...
npm start 