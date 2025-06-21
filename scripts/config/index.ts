/**
 * Script Configuration Module
 * 
 * Central export point for all configuration
 */

export * from './environment';
export * from './database';
export * from './services';
export * from './constants';

// Re-export commonly used items at top level
export { config, validateEnvironment } from './environment';
export { getDatabase, closeDatabase, waitForDatabase } from './database';
export { services, getEnabledServices, buildServiceUrl } from './services';
export { 
  USER_ROLES, 
  HEALTHCARE_ROLES, 
  TEST_USERS, 
  EMOJI, 
  COLORS,
  EXIT_CODES 
} from './constants';