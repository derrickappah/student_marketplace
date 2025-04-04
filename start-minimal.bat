@echo off
echo Starting minimal server without needing node_modules...
set NODE_OPTIONS=--max-old-space-size=256
node minimal-start.js 