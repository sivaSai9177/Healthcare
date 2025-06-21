#!/usr/bin/env bun
/**
 * Monitor Auth Flow in Real-time
 * Connects to logging service and filters auth-related events
 */

import { WebSocket } from 'ws';

const LOGGING_SERVICE_URL = 'http://localhost:3003';
const POLL_INTERVAL = 1000; // Poll every second

interface LogEvent {
  level?: string;
  message?: string;
  service?: string;
  category?: string;
  type?: string;
  procedure?: string;
  userId?: string;
  timestamp?: string;
  receivedAt?: string;
  metadata?: any;
}

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

class AuthFlowMonitor {
  private lastLogCount = 0;
  private seenLogs = new Set<string>();
  
  constructor() {

  }
  
  async start() {
    // Initial check
    await this.checkLogs();
    
    // Start polling
    setInterval(() => this.checkLogs(), POLL_INTERVAL);

  }
  
  async checkLogs() {
    try {
      // Get all logs
      const response = await fetch(`${LOGGING_SERVICE_URL}/logs?category=all&limit=100`);
      if (!response.ok) return;
      
      const data = await response.json();
      const logs: LogEvent[] = data.logs || [];
      
      // Filter and display new auth-related logs
      logs.forEach(log => {
        if (this.isAuthRelated(log) && !this.hasSeenLog(log)) {
          this.displayLog(log);
          this.markAsSeen(log);
        }
      });
      
    } catch (error) {
      // Silently ignore errors to avoid cluttering output
    }
  }
  
  isAuthRelated(log: LogEvent): boolean {
    // Check various indicators that this is auth-related
    const authIndicators = [
      log.type === 'auth',
      log.type === 'trpc' && log.procedure?.includes('auth'),
      log.service === 'auth',
      log.category === 'auth',
      log.message?.toLowerCase().includes('auth'),
      log.message?.toLowerCase().includes('login'),
      log.message?.toLowerCase().includes('session'),
      log.message?.toLowerCase().includes('sign'),
      log.procedure?.includes('auth'),
      log.procedure?.includes('session'),
      log.procedure?.includes('signIn'),
      log.procedure?.includes('signUp'),
      log.procedure?.includes('getSession'),
    ];
    
    return authIndicators.some(indicator => indicator);
  }
  
  hasSeenLog(log: LogEvent): boolean {
    const id = this.getLogId(log);
    return this.seenLogs.has(id);
  }
  
  markAsSeen(log: LogEvent): void {
    const id = this.getLogId(log);
    this.seenLogs.add(id);
    
    // Keep set size manageable
    if (this.seenLogs.size > 1000) {
      const entries = Array.from(this.seenLogs);
      this.seenLogs = new Set(entries.slice(-500));
    }
  }
  
  getLogId(log: LogEvent): string {
    const timestamp = log.timestamp || log.receivedAt || Date.now();
    const message = log.message || log.procedure || '';
    return `${timestamp}-${message}-${JSON.stringify(log.metadata || {})}`;
  }
  
  displayLog(log: LogEvent): void {
    const timestamp = new Date(log.timestamp || log.receivedAt || Date.now()).toLocaleTimeString();
    
    // Determine log type and color
    let typeColor = colors.blue;
    let typeLabel = 'AUTH';
    
    if (log.type === 'trpc') {
      typeColor = colors.magenta;
      typeLabel = 'TRPC';
    } else if (log.level === 'error') {
      typeColor = colors.red;
      typeLabel = 'ERROR';
    } else if (log.level === 'warn') {
      typeColor = colors.yellow;
      typeLabel = 'WARN';
    }
    
    // Build log line

    // Show metadata if present
    if (log.metadata && Object.keys(log.metadata).length > 0) {

    }
    
    // Show user info if present
    if (log.userId) {

    }
    
    /* console.log('') */; // Empty line for readability
  }
  
  formatMessage(log: LogEvent): string {
    if (log.procedure) {
      const parts = log.procedure.split('.');
      const method = parts[parts.length - 1];
      const router = parts.slice(0, -1).join('.');
      
      let status = '';
      if (log.metadata?.success === true) {
        status = `${colors.green}✓${colors.reset}`;
      } else if (log.metadata?.success === false) {
        status = `${colors.red}✗${colors.reset}`;
      }
      
      return `${colors.yellow}${router}${colors.reset}.${colors.bright}${method}${colors.reset} ${status}`;
    }
    
    return log.message || 'Unknown auth event';
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {

  process.exit(0);
});

// Start monitoring
const monitor = new AuthFlowMonitor();
monitor.start().catch(console.error);