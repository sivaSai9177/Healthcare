#!/usr/bin/env bun
/**
 * WebSocket Server Entry Point (JavaScript)
 * Starts the WebSocket server for real-time healthcare alerts
 */

const { initializeWebSocketServer } = require('./server');

// Load environment variables
const port = parseInt(process.env.EXPO_PUBLIC_WS_PORT || '3002', 10);
const environment = process.env.NODE_ENV || 'development';

// Start the WebSocket server
try {

  const wsManager = initializeWebSocketServer(port);
  
  // Log stats periodically in development
  if (environment === 'development') {
    setInterval(() => {
      const stats = wsManager.getStats();

    }, 60000); // Every minute
  }
  
} catch (error) {
  console.error('❌ Failed to start WebSocket server:', error);
  process.exit(1);
}