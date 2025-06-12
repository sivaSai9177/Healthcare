#!/usr/bin/env bun

/**
 * Standalone WebSocket Server
 * Runs independently without React Native dependencies
 */

import { WebSocketServer } from 'ws';

const PORT = process.env.WEBSOCKET_PORT ? parseInt(process.env.WEBSOCKET_PORT) : 3002;

const wss = new WebSocketServer({ port: PORT });

// TODO: Replace with structured logging - console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);

// Track connected clients
const clients = new Set<any>();

wss.on('connection', (ws, req) => {
  const clientId = Date.now();
  clients.add(ws);
  
// TODO: Replace with structured logging - console.log(`👤 Client connected: ${clientId} (Total: ${clients.size})`);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to Hospital Alert WebSocket Server',
    timestamp: new Date().toISOString(),
  }));
  
  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
// TODO: Replace with structured logging - console.log(`📥 Received:`, message);
      
      // Echo back to sender
      ws.send(JSON.stringify({
        type: 'echo',
        original: message,
        timestamp: new Date().toISOString(),
      }));
      
      // Broadcast alerts to all clients
      if (message.type === 'alert') {
        broadcast({
          type: 'alert',
          data: message.data,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    clients.delete(ws);
// TODO: Replace with structured logging - console.log(`👋 Client disconnected: ${clientId} (Total: ${clients.size})`);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for client ${clientId}:`, error);
  });
});

// Broadcast function
function broadcast(data: any) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
// TODO: Replace with structured logging - console.log(`📢 Broadcasted to ${clients.size} clients`);
}

// Simulate periodic alerts for testing
setInterval(() => {
  if (clients.size > 0) {
    broadcast({
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
      activeClients: clients.size,
    });
  }
}, 30000); // Every 30 seconds

// Handle graceful shutdown
process.on('SIGINT', () => {
// TODO: Replace with structured logging - console.log('\n🛑 Shutting down WebSocket server...');
  wss.close(() => {
// TODO: Replace with structured logging - console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});

// TODO: Replace with structured logging - console.log('💡 WebSocket server ready for connections');
// TODO: Replace with structured logging - console.log('   Test with: wscat -c ws://localhost:3002');