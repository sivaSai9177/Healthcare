/**
 * Common types shared between server and client components
 */

import { z } from 'zod';

// Re-export all alert types from the dedicated alert types file
export * from './alert';

// Legacy exports for backward compatibility
// These are now defined in ./alert.ts but re-exported here
// to avoid breaking existing imports
import type { Alert, AlertWithRelations } from './alert';

// Common response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Common error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Re-export common types for convenience
export type { HealthcareUserRole, AlertType, AlertStatus, UrgencyLevel } from './healthcare';