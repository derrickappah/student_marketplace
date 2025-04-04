// Simple Node.js server to serve the app
const http = require('http');
const fs = require('fs');
const path = require('path');

// Create a very basic HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Minimal Marketplace App</title>
      </head>
      <body>
        <h1>Student Marketplace</h1>
        <p>This is a minimal starter to troubleshoot the application.</p>
        <p>Node.js version: ${process.version}</p>
        <p>Memory usage: ${JSON.stringify(process.memoryUsage())}</p>
      </body>
    </html>
  `);
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
  console.log(`Node.js version: ${process.version}`);
  console.log(`Memory usage: ${JSON.stringify(process.memoryUsage())}`);
}); 