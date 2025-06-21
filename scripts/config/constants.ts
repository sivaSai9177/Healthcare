#!/usr/bin/env bun
/**
 * Shared Constants
 * 
 * Common constants used across scripts:
 * - User roles and permissions
 * - Test data
 * - Timeouts and limits
 * - File paths
 */

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  OPERATOR: 'operator',
  USER: 'user',
} as const;

// Healthcare-specific roles
export const HEALTHCARE_ROLES = {
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  ADMIN: 'healthcare_admin',
  STAFF: 'healthcare_staff',
} as const;

// Alert priorities
export const ALERT_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// Alert statuses
export const ALERT_STATUSES = {
  PENDING: 'pending',
  ACKNOWLEDGED: 'acknowledged',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  ESCALATED: 'escalated',
} as const;

// Common timeouts
export const TIMEOUTS = {
  DEFAULT: 30000, // 30 seconds
  LONG: 60000, // 1 minute
  DB_OPERATION: 10000, // 10 seconds
  API_REQUEST: 5000, // 5 seconds
  HEALTH_CHECK: 3000, // 3 seconds
} as const;

// Retry configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  BACKOFF_MULTIPLIER: 2,
} as const;

// Test user templates
export const TEST_USERS = {
  admin: {
    email: 'admin@hospital.test',
    password: 'Admin123!',
    name: 'Test Admin',
    role: USER_ROLES.ADMIN,
  },
  doctor: {
    email: 'doctor@hospital.test',
    password: 'Doctor123!',
    name: 'Dr. Test',
    role: HEALTHCARE_ROLES.DOCTOR,
  },
  nurse: {
    email: 'nurse@hospital.test',
    password: 'Nurse123!',
    name: 'Nurse Test',
    role: HEALTHCARE_ROLES.NURSE,
  },
  operator: {
    email: 'operator@hospital.test',
    password: 'Operator123!',
    name: 'Test Operator',
    role: USER_ROLES.OPERATOR,
  },
} as const;

// Organization/Hospital defaults
export const DEFAULT_ORGANIZATION = {
  name: 'Test Hospital',
  code: 'TEST-HOSP',
  type: 'healthcare',
  settings: {
    alertEscalationTime: 30, // minutes
    shiftDuration: 8, // hours
    timezone: 'America/New_York',
  },
} as const;

// File paths
export const PATHS = {
  ROOT: process.cwd(),
  SCRIPTS: 'scripts',
  MIGRATIONS: 'scripts/migrations',
  LOGS: 'logs',
  TEMP: '.tmp',
} as const;

// Log levels
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
} as const;

// Exit codes
export const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  VALIDATION_ERROR: 2,
  CONNECTION_ERROR: 3,
  PERMISSION_ERROR: 4,
  NOT_FOUND: 5,
} as const;

// ANSI color codes for console output
export const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
} as const;

// Emoji indicators
export const EMOJI = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  debug: '🐛',
  loading: '⏳',
  rocket: '🚀',
  database: '🗄️',
  mail: '📧',
  user: '👤',
  lock: '🔒',
  key: '🔑',
  check: '✓',
  cross: '✗',
  arrow: '→',
} as const;

// Regular expressions
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
} as const;

// Date formats
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  US: 'MM/DD/YYYY',
  EU: 'DD/MM/YYYY',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIME: 'HH:mm:ss',
} as const;

// Export type helpers
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type HealthcareRole = typeof HEALTHCARE_ROLES[keyof typeof HEALTHCARE_ROLES];
export type AlertPriority = typeof ALERT_PRIORITIES[keyof typeof ALERT_PRIORITIES];
export type AlertStatus = typeof ALERT_STATUSES[keyof typeof ALERT_STATUSES];
export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];