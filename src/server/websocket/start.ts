#!/usr/bin/env tsx
/**
 * WebSocket Server Entry Point
 * Starts the WebSocket server for real-time healthcare alerts
 */

import { initializeWebSocketServer } from './server';

// Simple console logger for Docker environment
const log = {
  info: (message: string, context?: string, data?: any) => {

  },
  error: (message: string, context?: string, error?: any) => {
    console.error(`[ERROR] [${context || 'WS_START'}] ${message}`, error || '');
  },
  debug: (message: string, context?: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {

    }
  }
};

// Load environment variables
const port = parseInt(process.env.EXPO_PUBLIC_WS_PORT || '3002', 10);
const environment = process.env.NODE_ENV || 'development';

// Start the WebSocket server
try {
  log.info('Starting WebSocket server...', 'WS_START', {
    port,
    environment,
  });
  
  const wsManager = initializeWebSocketServer(port);
  
  // Log stats periodically in development
  if (environment === 'development') {
    setInterval(() => {
      const stats = wsManager.getStats();
      log.debug('WebSocket Stats', 'WS_STATS', stats);
    }, 60000); // Every minute
  }
  
} catch (error) {
  log.error('Failed to start WebSocket server', 'WS_START', error);
  process.exit(1);
}