/**
 * Consolidated Type Definitions
 * 
 * This file serves as the single source of truth for all shared types across the application.
 * It consolidates previously duplicate type definitions to ensure consistency and type safety.
 * 
 * Import from this file instead of defining types locally to avoid duplication.
 */

import { z } from 'zod';

// ============================
// User & Role Types
// ============================

/**
 * Base user roles available in the system
 * Used for general access control
 */
export const UserRoleSchema = z.enum([
  'admin',      // System administrator
  'manager',    // Organization manager
  'user',       // Regular user
  'guest',      // Guest user with limited access
]);

export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * Healthcare-specific roles
 * Used for healthcare module access control
 */
export const HealthcareRoleSchema = z.enum([
  'operator',    // Emergency operator
  'nurse',       // Nurse
  'doctor',      // Doctor
  'head_doctor', // Head doctor/Department head
]);

export type HealthcareRole = z.infer<typeof HealthcareRoleSchema>;

/**
 * Combined role schema for users who may have both system and healthcare roles
 */
export const CombinedRoleSchema = z.union([UserRoleSchema, HealthcareRoleSchema]);
export type CombinedRole = z.infer<typeof CombinedRoleSchema>;

/**
 * User status for account management
 */
export const UserStatusSchema = z.enum(['active', 'inactive', 'suspended', 'pending']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

// ============================
// Organization Types
// ============================

/**
 * Organization types - standardized across the application
 */
export const OrganizationTypeSchema = z.enum([
  'healthcare',
  'corporate', 
  'nonprofit',
  'government',
  'education',
  'other'
]);

export type OrganizationType = z.infer<typeof OrganizationTypeSchema>;

/**
 * Organization member roles
 */
export const OrganizationRoleSchema = z.enum([
  'owner',
  'admin',
  'manager',
  'member',
  'guest'
]);

export type OrganizationRole = z.infer<typeof OrganizationRoleSchema>;

/**
 * Organization status
 */
export const OrganizationStatusSchema = z.enum(['active', 'inactive', 'suspended', 'trial']);
export type OrganizationStatus = z.infer<typeof OrganizationStatusSchema>;

// ============================
// Healthcare Specific Types
// ============================

/**
 * Alert urgency levels
 */
export const UrgencyLevelSchema = z.enum([
  'critical',  // Level 5 - Immediate response required
  'high',      // Level 4 - Urgent
  'medium',    // Level 3 - Standard priority
  'low',       // Level 2 - Non-urgent
  'info'       // Level 1 - Informational only
]);

export type UrgencyLevel = z.infer<typeof UrgencyLevelSchema>;

/**
 * Alert types
 */
export const AlertTypeSchema = z.enum([
  'cardiac_arrest',
  'code_blue',
  'fire',
  'security',
  'medical_emergency',
  'equipment_failure',
  'staff_emergency',
  'general'
]);

export type AlertType = z.infer<typeof AlertTypeSchema>;

/**
 * Alert status
 */
export const AlertStatusSchema = z.enum([
  'active',
  'acknowledged', 
  'escalated',
  'resolved',
  'cancelled'
]);

export type AlertStatus = z.infer<typeof AlertStatusSchema>;

/**
 * Response actions for alert acknowledgments
 */
export const ResponseActionSchema = z.enum([
  'responding',     // On the way
  'investigating',  // Assessing situation
  'resolved',       // Issue resolved
  'escalated',      // Escalated to higher level
  'delegated',      // Delegated to another staff
  'false_alarm'     // False alarm
]);

export type ResponseAction = z.infer<typeof ResponseActionSchema>;

// ============================
// Common Types
// ============================

/**
 * Audit severity levels
 */
export const AuditSeveritySchema = z.enum(['info', 'warning', 'error', 'critical']);
export type AuditSeverity = z.infer<typeof AuditSeveritySchema>;

/**
 * Platform types
 */
export const PlatformSchema = z.enum(['ios', 'android', 'web']);
export type Platform = z.infer<typeof PlatformSchema>;

// ============================
// Type Guards
// ============================

export const isHealthcareRole = (role: string): role is HealthcareRole => {
  return HealthcareRoleSchema.safeParse(role).success;
};

export const isUserRole = (role: string): role is UserRole => {
  return UserRoleSchema.safeParse(role).success;
};

export const isCombinedRole = (role: string): role is CombinedRole => {
  return CombinedRoleSchema.safeParse(role).success;
};

// ============================
// Re-exports for backward compatibility
// ============================

// These exports maintain backward compatibility while we migrate the codebase
export { UserRoleSchema as roleSchema };
export { CombinedRoleSchema as UserRole };