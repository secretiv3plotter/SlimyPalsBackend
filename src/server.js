const http = require('http');
const WebSocket = require('ws');
const app = require('./app');
const initJobs = require('./jobs');
require('dotenv').config();

const port = process.env.PORT || 3000;

initJobs();

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });
const presenceManager = require('./realtime/presenceManager');

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  presenceManager.handleConnection(ws, token);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  console.log(`WebSocket server is attached to HTTP server`);
});
