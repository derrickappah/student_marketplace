@echo off
echo Updating package.json to use compatible dependencies...

rem Create a backup of package.json
copy package.json package.json.bak

echo Attempting to install with force flag to resolve peer dependencies...
npm install --force

echo If the above command fails due to memory issues, please:
echo 1. Downgrade Node.js to version 16.x as recommended earlier
echo 2. Then run: npm install --force

echo Alternative fix: Remove react-swipeable-views from package.json and use a different solution 