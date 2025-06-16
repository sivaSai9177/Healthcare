/**
 * Logger Implementation
 * Re-exports the unified logger for backward compatibility
 */

import { log as unifiedLog, logger } from './unified-logger';
export { logger, type LogCategory, type UnifiedLogEntry } from './unified-logger';

// Re-export for backward compatibility
export const log = unifiedLog;
export default log;