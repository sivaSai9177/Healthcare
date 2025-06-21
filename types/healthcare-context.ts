import { HealthcareUserRole } from './healthcare';

/**
 * Type for a user with validated healthcare context
 * This ensures all required fields are present for healthcare features
 */
export interface HealthcareUser {
  id: string;
  email: string;
  name: string | null;
  role: HealthcareUserRole;
  organizationId: string;
  organizationName: string;
  defaultHospitalId: string;
  image?: string | null;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Type guard to check if user has healthcare context
 */
export function isHealthcareUser(user: any): user is HealthcareUser {
  return (
    user &&
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.role === 'string' &&
    isHealthcareRole(user.role) &&
    typeof user.organizationId === 'string' &&
    typeof user.defaultHospitalId === 'string'
  );
}

/**
 * Type guard to check if role is a healthcare role
 */
export function isHealthcareRole(role: any): role is HealthcareUserRole {
  return ['operator', 'nurse', 'doctor', 'head_doctor', 'admin'].includes(role);
}

/**
 * Healthcare context with all required data
 */
export interface ValidHealthcareContext {
  user: HealthcareUser;
  hospitalId: string;
  organizationId: string;
  role: HealthcareUserRole;
}

/**
 * Result type for healthcare queries with proper error handling
 */
export interface HealthcareQueryResult<T> {
  data?: T;
  isLoading: boolean;
  error?: {
    message: string;
    code?: string;
    httpStatus?: number;
    requiresProfileCompletion?: boolean;
  };
}

/**
 * Props for components that require healthcare context
 */
export interface WithHealthcareContextProps {
  hospitalId: string;
  role: HealthcareUserRole;
  user: HealthcareUser;
}