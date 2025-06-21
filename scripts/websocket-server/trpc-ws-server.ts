#!/usr/bin/env node
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from unified .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

const wsPort = process.env.EXPO_PUBLIC_WS_PORT ? parseInt(process.env.EXPO_PUBLIC_WS_PORT) : 3001;

// TODO: Replace with structured logging - /* console.log('🚀 Starting tRPC WebSocket server on port', wsPort) */;

// Create WebSocket server
const wss = new WebSocketServer({
  port: wsPort,
  perMessageDeflate: {
    zlibDeflateOptions: {
      // See zlib defaults.
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    // Other options settable:
    clientNoContextTakeover: true, // Defaults to negotiated value.
    serverNoContextTakeover: true, // Defaults to negotiated value.
    serverMaxWindowBits: 10, // Defaults to negotiated value.
    // Below options specified as default values.
    concurrencyLimit: 10, // Limits zlib concurrency for perf.
    threshold: 1024 // Size (in bytes) below which messages should not be compressed.
  }
});

// Track connected clients
const clients = new Map();

wss.on('connection', (ws) => {
  const clientId = Date.now().toString();
  clients.set(clientId, ws);
// TODO: Replace with structured logging - /* console.log(`✅ Client connected: ${clientId}`) */;
// TODO: Replace with structured logging - /* console.log(`📊 Total clients: ${clients.size}`) */;

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to tRPC WebSocket server',
    clientId
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
// TODO: Replace with structured logging - /* console.log(`📨 Received from ${clientId}:`, message) */;

      // Echo back to sender
      ws.send(JSON.stringify({
        type: 'echo',
        original: message,
        timestamp: new Date().toISOString()
      }));

      // Broadcast to all other clients
      if (message.broadcast) {
        clients.forEach((client, id) => {
          if (id !== clientId && client.readyState === ws.OPEN) {
            client.send(JSON.stringify({
              type: 'broadcast',
              from: clientId,
              message: message.data,
              timestamp: new Date().toISOString()
            }));
          }
        });
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
// TODO: Replace with structured logging - /* console.log(`👋 Client disconnected: ${clientId}`) */;
// TODO: Replace with structured logging - /* console.log(`📊 Total clients: ${clients.size}`) */;
  });

  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for client ${clientId}:`, error);
  });
});

// Health check endpoint
const healthCheck = () => {
  return {
    status: 'healthy',
    clients: clients.size,
    timestamp: new Date().toISOString()
  };
};

// Log server status
// TODO: Replace with structured logging

// Handle graceful shutdown
process.on('SIGINT', () => {
// TODO: Replace with structured logging - /* console.log('\n🛑 Shutting down WebSocket server...') */;
  wss.close(() => {
// TODO: Replace with structured logging - /* console.log('✅ Server closed') */;
    process.exit(0);
  });
});