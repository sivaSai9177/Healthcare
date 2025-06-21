// Auth API types - specific to API layer
import type { UserRole, ExtendedUser } from '../auth';

export type CustomUser = ExtendedUser;

export type { UserRole };

// API-specific auth types
export interface AuthResponse {
  user: CustomUser | null;
  session: any;
  success: boolean;
  error?: string;
}