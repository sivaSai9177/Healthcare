/**
 * Server Startup Services
 * Initialize background services when the server starts
 */

import { escalationTimerService } from './escalation-timer';
import { log } from '@/lib/core/debug/logger';
import { isWebSocketEnabled } from '@/lib/core/config/unified-env';
import { notificationService } from './notifications';

export function initializeBackgroundServices() {
  log.info('Initializing background services', 'SERVER');

  // Skip WebSocket initialization here - it's handled by the separate process
  // The WebSocket server runs as a standalone process via start-websocket-node.js
  log.info('WebSocket server runs as separate process', 'SERVER', {
    port: process.env.EXPO_PUBLIC_WS_PORT || 3002,
    enabled: isWebSocketEnabled(),
  });

  // Initialize notification service
  try {
    notificationService.initialize();
    log.info('Notification service initialized', 'SERVER');
  } catch (error) {
    log.error('Failed to initialize notification service', 'SERVER', error);
  }

  // Start escalation timer service
  try {
    escalationTimerService.start();
    log.info('Escalation timer service started', 'SERVER');
  } catch (error) {
    log.error('Failed to start escalation timer service', 'SERVER', error);
    // Don't fail server startup if escalation service fails
    // This might happen if healthcare tables aren't ready yet
  }

  // Add other background services here as needed
}

export function shutdownBackgroundServices() {
  log.info('Shutting down background services', 'SERVER');

  // WebSocket server runs as a separate Docker container and is managed externally
  log.info('WebSocket server shutdown handled by Docker', 'SERVER');

  // Stop notification service
  try {
    notificationService.shutdown();
    log.info('Notification service stopped', 'SERVER');
  } catch (error) {
    log.error('Failed to stop notification service', 'SERVER', error);
  }

  // Stop escalation timer service
  try {
    escalationTimerService.stop();
    log.info('Escalation timer service stopped', 'SERVER');
  } catch (error) {
    log.error('Failed to stop escalation timer service', 'SERVER', error);
  }

  // Stop other background services here
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  log.info('SIGTERM received, shutting down gracefully', 'SERVER');
  shutdownBackgroundServices();
  process.exit(0);
});

process.on('SIGINT', () => {
  log.info('SIGINT received, shutting down gracefully', 'SERVER');
  shutdownBackgroundServices();
  process.exit(0);
});