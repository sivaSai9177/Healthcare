/**
 * Server Startup Services
 * Initialize background services when the server starts
 */

import { escalationTimerService } from './escalation-timer';
import { log } from '@/lib/core/logger';

export function initializeBackgroundServices() {
  log.info('Initializing background services', 'SERVER');

  // Start escalation timer service
  try {
    escalationTimerService.start();
    log.info('Escalation timer service started', 'SERVER');
  } catch (error) {
    log.error('Failed to start escalation timer service', 'SERVER', error);
  }

  // Add other background services here as needed
  // e.g., notification service, cleanup service, etc.
}

export function shutdownBackgroundServices() {
  log.info('Shutting down background services', 'SERVER');

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