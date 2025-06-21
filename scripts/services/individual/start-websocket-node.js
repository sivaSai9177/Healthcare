#!/usr/bin/env node

/**
 * Start tRPC WebSocket Server (Node.js version)
 * This script runs in pure Node.js environment without React Native imports
 */

const { WebSocketServer } = require('ws');
const { createServer } = require('http');
const { parse } = require('url');

const port = parseInt(process.env.EXPO_PUBLIC_WS_PORT || '3002', 10);

// Create HTTP server
const httpServer = createServer();

// Create WebSocket server
const wss = new WebSocketServer({
  server: httpServer,
  path: '/api/trpc',
});

// Handle connections
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      // Echo back for testing
      ws.send(JSON.stringify({
        type: 'echo',
        data: message,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('[WS] Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {

  });
  
  ws.on('error', (error) => {
    console.error(`[WS] Client error from ${clientIp}:`, error);
  });
});

// Start server
httpServer.listen(port, () => {

});

// Handle graceful shutdown
process.on('SIGINT', () => {

  wss.clients.forEach(client => client.close());
  wss.close(() => {
    httpServer.close(() => {

      process.exit(0);
    });
  });
});

process.on('SIGTERM', () => {
  process.exit(0);
});