const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = '127.0.0.1';
const port = 3001;

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  if (req.url === '/' || req.url === '/dashboard.html') {
    fs.readFile(path.join(__dirname, 'dashboard.html'), (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Error loading dashboard.html');
        console.error('Error loading dashboard.html:', err);
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end(data);
      console.log('Served dashboard.html');
    });
  } else {
    // For all other requests, try to serve static files
    const filePath = path.join(__dirname, req.url);
    const extname = path.extname(filePath);
    
    let contentType = 'text/html';
    switch (extname) {
      case '.js':
        contentType = 'application/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
        contentType = 'image/jpg';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
    }
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Not found');
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.end(data);
    });
  }
});

server.listen(port, hostname, () => {
  console.log(`Dashboard server running at http://${hostname}:${port}/`);
  console.log(`Open your browser and go to http://${hostname}:${port}/ to access the dashboard`);
});