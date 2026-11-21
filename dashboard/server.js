'use strict';


const http = require('http');
const fs = require('fs');
const path = require('path');
const { collectStatus } = require('./status');

const PUBLIC_DIR = path.join(__dirname, 'public');
const argPort = process.argv.indexOf('--port');
const PORT = Number(
  (argPort >= 0 && process.argv[argPort + 1]) || process.env.DASHBOARD_PORT || 4310,
);
const HOST = process.env.DASHBOARD_HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function send(res, code, body, type) {
  res.writeHead(code, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function serveStatic(res, urlPath) {
  const name = urlPath === '/' || urlPath === '' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const file = path.resolve(PUBLIC_DIR, name);
  if (!file.startsWith(`${PUBLIC_DIR}${path.sep}`)) {
    send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      send(res, 404, 'Not found', 'text/plain; charset=utf-8');
      return;
    }
    send(res, 200, data, MIME[path.extname(file)] || 'application/octet-stream');
  });
}

const server = http.createServer((req, res) => {
  const urlPath = new URL(req.url, `http://${HOST}:${PORT}`).pathname;
  if (urlPath === '/api/status') {
    try {
      send(res, 200, JSON.stringify(collectStatus()), 'application/json; charset=utf-8');
    } catch (error) {
      send(res, 500, JSON.stringify({ error: error.message }), 'application/json; charset=utf-8');
    }
    return;
  }
  if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(res, urlPath);
    return;
  }
  send(res, 405, 'Method not allowed', 'text/plain; charset=utf-8');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try: node dashboard/server.js --port ${PORT + 1}`);
    process.exitCode = 1;
  } else {
    console.error(error);
    process.exitCode = 1;
  }
});

server.listen(PORT, HOST, () => {
  console.log(`BusyBee dashboard: http://${HOST}:${PORT}`);
});
