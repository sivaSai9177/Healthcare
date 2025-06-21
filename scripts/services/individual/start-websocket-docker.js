#!/usr/bin/env node
/**
 * WebSocket Server Docker Entry Point
 * Starts the compiled WebSocket server in Docker container
 */

// Check if running in production
if (process.env.NODE_ENV === 'production') {
  // Use compiled JavaScript
  require('../dist/server/websocket/start.js');
} else {
  // In development, use the existing WebSocket server
  require('./start-websocket-trpc.js');
}