#!/usr/bin/env bun
/**
 * Script Logger Utility
 * 
 * Provides consistent logging across all scripts with:
 * - Color-coded output
 * - Log levels
 * - Timestamps
 * - File logging option
 */

import { COLORS, EMOJI, LOG_LEVELS } from '../config/constants';
import { config } from '../config/environment';
import fs from 'fs/promises';
import path from 'path';

export type LogLevel = keyof typeof LOG_LEVELS;

interface LoggerOptions {
  name?: string;
  level?: LogLevel;
  logToFile?: boolean;
  logDir?: string;
}

class Logger {
  private name: string;
  private level: LogLevel;
  private logToFile: boolean;
  private logDir: string;
  
  constructor(options: LoggerOptions = {}) {
    this.name = options.name || 'Script';
    this.level = options.level || (config.isDevelopment ? 'DEBUG' : 'INFO');
    this.logToFile = options.logToFile || false;
    this.logDir = options.logDir || path.join(process.cwd(), 'logs');
  }
  
  private shouldLog(level: LogLevel): boolean {
    const levels = Object.keys(LOG_LEVELS) as LogLevel[];
    const currentIndex = levels.indexOf(this.level);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }
  
  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.name}] [${level}]`;
    
    let formatted = `${prefix} ${message}`;
    if (data !== undefined) {
      formatted += '\n' + JSON.stringify(data, null, 2);
    }
    
    return formatted;
  }
  
  private getColor(level: LogLevel): string {
    switch (level) {
      case 'DEBUG': return COLORS.dim;
      case 'INFO': return COLORS.blue;
      case 'WARN': return COLORS.yellow;
      case 'ERROR': return COLORS.red;
      case 'FATAL': return COLORS.bgRed + COLORS.white;
      default: return COLORS.reset;
    }
  }
  
  private getEmoji(level: LogLevel): string {
    switch (level) {
      case 'DEBUG': return EMOJI.debug;
      case 'INFO': return EMOJI.info;
      case 'WARN': return EMOJI.warning;
      case 'ERROR': return EMOJI.error;
      case 'FATAL': return EMOJI.error;
      default: return '';
    }
  }
  
  private async writeToFile(message: string) {
    if (!this.logToFile) return;
    
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      const logFile = path.join(this.logDir, `${this.name.toLowerCase()}-${new Date().toISOString().split('T')[0]}.log`);
      await fs.appendFile(logFile, message + '\n');
    } catch (error) {
      // Fail silently - don't want logging to break the script
    }
  }
  
  private log(level: LogLevel, message: string, data?: any) {
    if (!this.shouldLog(level)) return;
    
    const formatted = this.formatMessage(level, message, data);
    const color = this.getColor(level);
    const emoji = this.getEmoji(level);
    
    // Console output with color
    const consoleMessage = `${color}${emoji} ${formatted}${COLORS.reset}`;
    
    if (level === 'ERROR' || level === 'FATAL') {
      console.error(consoleMessage);
    } else {

    }
    
    // File output without color
    this.writeToFile(formatted);
  }
  
  debug(message: string, data?: any) {
    this.log('DEBUG', message, data);
  }
  
  info(message: string, data?: any) {
    this.log('INFO', message, data);
  }
  
  warn(message: string, data?: any) {
    this.log('WARN', message, data);
  }
  
  error(message: string, data?: any) {
    this.log('ERROR', message, data);
  }
  
  fatal(message: string, data?: any) {
    this.log('FATAL', message, data);
  }
  
  // Convenience methods
  success(message: string, data?: any) {
    const formatted = `${EMOJI.success} ${message}`;

    this.writeToFile(this.formatMessage('INFO', formatted, data));
  }
  
  loading(message: string) {
    const formatted = `${EMOJI.loading} ${message}`;

    this.writeToFile(this.formatMessage('INFO', formatted));
  }
  
  // Progress indicator
  progress(current: number, total: number, message?: string) {
    const percentage = Math.round((current / total) * 100);
    const bar = this.createProgressBar(percentage);
    const status = message || `Progress: ${current}/${total}`;
    
    // Clear line and print progress
    process.stdout.write(`\r${COLORS.cyan}${bar} ${percentage}% - ${status}${COLORS.reset}`);
    
    if (current >= total) {
      process.stdout.write('\n');
    }
  }
  
  private createProgressBar(percentage: number, width = 30): string {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    return `[${EMOJI.check.repeat(filled)}${'-'.repeat(empty)}]`;
  }
  
  // Separator line
  separator(char = '-', width = 50) {

  }
  
  // Box message
  box(message: string, color = COLORS.cyan) {
    const lines = message.split('\n');
    const maxLength = Math.max(...lines.map(l => l.length));
    const top = `┌${'─'.repeat(maxLength + 2)}┐`;
    const bottom = `└${'─'.repeat(maxLength + 2)}┘`;

    lines.forEach(line => {
      const padding = ' '.repeat(maxLength - line.length);

    });

  }
  
  // Table output
  table(headers: string[], rows: string[][]) {
    // Calculate column widths
    const widths = headers.map((h, i) => {
      const columnData = [h, ...rows.map(r => r[i] || '')];
      return Math.max(...columnData.map(d => d.length));
    });
    
    // Print header
    this.separator();

    this.separator();
    
    // Print rows
    rows.forEach(row => {

    });
    this.separator();
  }
}

// Create default logger instance
export const logger = new Logger();

// Export factory function for custom loggers
export function createLogger(options: LoggerOptions): Logger {
  return new Logger(options);
}

// Export Logger class for type usage
export { Logger };