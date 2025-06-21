/**
 * Type definitions for better-auth with extended user properties
 */

declare module 'better-auth' {
  interface User {
    id: string;
    name: string;
    email: string;
    emailVerified?: boolean;
    createdAt: Date;
    updatedAt: Date;
    image?: string;
    // Extended properties for our app
    organizationId?: string;
    role?: 'admin' | 'manager' | 'user' | 'doctor' | 'nurse' | 'head_doctor' | 'operator';
    defaultHospitalId?: string;
    permissions?: string[];
  }
  
  interface Session {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    token: string;
    ipAddress?: string;
    userAgent?: string;
    userId: string;
    expiresAt: Date;
    // Extended properties
    organizationId?: string;
    hospitalId?: string;
  }
}