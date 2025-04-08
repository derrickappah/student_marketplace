@echo off
echo This script will help you run the app without react-scripts

echo 1. First, attempting to update package.json with minimal dependencies...
copy package.json package.json.bak

echo 2. Creating a minimal server to run without react-scripts...
set NODE_OPTIONS=--max-old-space-size=256
echo Starting minimal server...
node minimal-start.js

echo If the above command worked, your app is now running at http://localhost:3000
echo You will need to downgrade Node.js to run the full app with its dependencies
echo Download Node.js 16.20.2 from: https://nodejs.org/download/release/v16.20.2/ 