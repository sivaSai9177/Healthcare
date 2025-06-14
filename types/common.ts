/**
 * Common types shared between server and client components
 */

import { z } from 'zod';
import { AlertType, AlertStatus, UrgencyLevel, HealthcareUserRole } from './healthcare';

// Alert Schema - shared between server and client
export const AlertSchema = z.object({
  id: z.string(),
  hospitalId: z.string(),
  roomNumber: z.string(),
  alertType: AlertType,
  urgencyLevel: UrgencyLevel,
  status: AlertStatus,
  description: z.string().optional(),
  currentEscalationTier: z.number().default(1),
  nextEscalationAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  acknowledgedAt: z.string().datetime().nullable(),
  resolvedAt: z.string().datetime().nullable(),
  createdBy: z.string(),
  acknowledgedBy: z.string().nullable(),
  resolvedBy: z.string().nullable(),
});

export type Alert = z.infer<typeof AlertSchema>;

// Alert with relations
export interface AlertWithRelations extends Alert {
  creator?: {
    id: string;
    name: string;
    role: HealthcareUserRole;
  };
  acknowledgedByUser?: {
    id: string;
    name: string;
    role: HealthcareUserRole;
  };
  resolvedByUser?: {
    id: string;
    name: string;
    role: HealthcareUserRole;
  };
}

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