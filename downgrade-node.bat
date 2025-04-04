@echo off
echo This script will help downgrade Node.js.
echo Please follow these steps manually:

echo 1. Visit https://nodejs.org/download/release/v16.20.2/
echo 2. Download node-v16.20.2-x64.msi (for 64-bit Windows)
echo 3. Install it by running the downloaded file
echo 4. After installation, open a new command prompt
echo 5. Run "node --version" to verify it shows v16.20.2
echo 6. Navigate back to your project folder and run:
echo    npm install
echo    npm start

echo LTS versions like Node.js 16 typically have better memory management
echo and stability than the latest versions in some environments. 