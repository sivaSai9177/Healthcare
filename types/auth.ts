import { z } from 'zod';
import type { User, Session } from 'better-auth/types';

// Unified Role Schema that includes all possible roles
export const UserRole = z.enum([
  'admin',
  'manager',
  'user',
  'guest',
  'operator',
  'nurse',
  'doctor',
  'head_doctor'
]);

export type UserRole = z.infer<typeof UserRole>;

// Healthcare-specific roles subset
export const HealthcareRole = z.enum([
  'operator',
  'nurse', 
  'doctor',
  'head_doctor'
]);

export type HealthcareRole = z.infer<typeof HealthcareRole>;

// General roles subset
export const GeneralRole = z.enum([
  'admin',
  'manager',
  'user',
  'guest'
]);

export type GeneralRole = z.infer<typeof GeneralRole>;

// Extended User type that includes our custom fields
export interface AppUser extends User {
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
  organizationRole?: HealthcareRole;
  department?: string;
  jobTitle?: string;
  phoneNumber?: string;
  bio?: string;
  licenseNumber?: string;
  availabilityStatus?: 'available' | 'busy' | 'offline';
  contactPreferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  profilePhotoUrl?: string;
  needsProfileCompletion?: boolean;
  emailVerified?: boolean;
  defaultHospitalId?: string;
}

// Update the module declaration to use our custom user type
declare module "better-auth/types" {
  interface User {
    // Extend with our custom fields
    role?: UserRole;
    organizationId?: string;
    organizationName?: string;
    organizationRole?: HealthcareRole;
    department?: string;
    jobTitle?: string;
    phoneNumber?: string;
    bio?: string;
    licenseNumber?: string;
    availabilityStatus?: 'available' | 'busy' | 'offline';
    contactPreferences?: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    profilePhotoUrl?: string;
    needsProfileCompletion?: boolean;
    emailVerified?: boolean;
    defaultHospitalId?: string;
  }
}

// Helper function to check if a role is healthcare-specific
export function isHealthcareRole(role: UserRole): role is HealthcareRole {
  return ['operator', 'nurse', 'doctor', 'head_doctor'].includes(role);
}

// Helper function to check if a user has admin privileges
export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

// Helper function to check if a user has manager privileges
export function isManager(role: UserRole): boolean {
  return role === 'manager' || role === 'admin';
}

// Helper function to check if a user has healthcare privileges
export function hasHealthcareAccess(role: UserRole): boolean {
  return isHealthcareRole(role) || role === 'admin';
}