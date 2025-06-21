/**
 * Standardized Error Handling for Authentication
 * Provides consistent error extraction, formatting, and user-friendly messages
 */

import { TRPCError } from '@trpc/client';
import { Alert } from 'react-native';
import { logger } from '@/lib/core/debug/server-logger';

export interface AuthError {
  code: string;
  message: string;
  details?: any;
  field?: string;
  isRetryable?: boolean;
}

// Common auth error codes
export const AUTH_ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Rate limiting
  RATE_LIMIT: 'RATE_LIMIT',
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  EMAIL_IN_USE: 'EMAIL_IN_USE',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  
  // Account status
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',
  
  // OAuth errors
  OAUTH_ERROR: 'OAUTH_ERROR',
  OAUTH_CANCELLED: 'OAUTH_CANCELLED',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  
  // Generic
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password. Please try again.',
  [AUTH_ERROR_CODES.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
  [AUTH_ERROR_CODES.UNAUTHORIZED]: 'You are not authorized to perform this action.',
  
  [AUTH_ERROR_CODES.RATE_LIMIT]: 'Too many attempts. Please wait a few minutes before trying again.',
  [AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS]: 'Too many failed attempts. Please try again later.',
  
  [AUTH_ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again.',
  [AUTH_ERROR_CODES.EMAIL_IN_USE]: 'This email is already registered. Please sign in or use a different email.',
  [AUTH_ERROR_CODES.WEAK_PASSWORD]: 'Password is too weak. Please use a stronger password.',
  
  [AUTH_ERROR_CODES.ACCOUNT_LOCKED]: 'Your account has been locked. Please contact support.',
  [AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED]: 'Please verify your email address before signing in.',
  [AUTH_ERROR_CODES.PROFILE_INCOMPLETE]: 'Please complete your profile to continue.',
  
  [AUTH_ERROR_CODES.OAUTH_ERROR]: 'Authentication with provider failed. Please try again.',
  [AUTH_ERROR_CODES.OAUTH_CANCELLED]: 'Sign in was cancelled.',
  
  [AUTH_ERROR_CODES.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
  [AUTH_ERROR_CODES.SERVER_ERROR]: 'Server error. Please try again later.',
  
  [AUTH_ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

/**
 * Extract error information from various error types
 */
export function extractAuthError(error: any): AuthError {
  // Log the raw error for debugging
  logger.auth.debug('Extracting auth error', { error });

  // Handle null/undefined
  if (!error) {
    return {
      code: AUTH_ERROR_CODES.UNKNOWN_ERROR,
      message: ERROR_MESSAGES[AUTH_ERROR_CODES.UNKNOWN_ERROR],
    };
  }

  // Handle TRPC errors
  if (error instanceof TRPCError || error.name === 'TRPCClientError') {
    const code = mapTRPCErrorCode(error.code || error.data?.code);
    return {
      code,
      message: error.message || ERROR_MESSAGES[code] || ERROR_MESSAGES[AUTH_ERROR_CODES.UNKNOWN_ERROR],
      details: error.data,
      isRetryable: isRetryableError(code),
    };
  }

  // Handle Better Auth errors
  if (error.error && typeof error.error === 'string') {
    const code = mapBetterAuthError(error.error);
    return {
      code,
      message: error.message || ERROR_MESSAGES[code] || error.error,
      details: error,
      isRetryable: isRetryableError(code),
    };
  }

  // Handle validation errors
  if (error.issues || error.errors) {
    const firstError = error.issues?.[0] || error.errors?.[0];
    return {
      code: AUTH_ERROR_CODES.VALIDATION_ERROR,
      message: firstError?.message || ERROR_MESSAGES[AUTH_ERROR_CODES.VALIDATION_ERROR],
      field: firstError?.path?.[0] || firstError?.field,
      details: error.issues || error.errors,
      isRetryable: false,
    };
  }

  // Handle network errors
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('fetch failed')) {
    return {
      code: AUTH_ERROR_CODES.NETWORK_ERROR,
      message: ERROR_MESSAGES[AUTH_ERROR_CODES.NETWORK_ERROR],
      details: error,
      isRetryable: true,
    };
  }

  // Handle rate limiting
  if (error.status === 429 || error.message?.includes('rate limit')) {
    return {
      code: AUTH_ERROR_CODES.RATE_LIMIT,
      message: ERROR_MESSAGES[AUTH_ERROR_CODES.RATE_LIMIT],
      details: error,
      isRetryable: true,
    };
  }

  // Handle OAuth errors
  if (error.message?.includes('OAuth') || error.message?.includes('provider')) {
    const isCancelled = error.message?.includes('cancelled') || error.message?.includes('dismissed');
    return {
      code: isCancelled ? AUTH_ERROR_CODES.OAUTH_CANCELLED : AUTH_ERROR_CODES.OAUTH_ERROR,
      message: ERROR_MESSAGES[isCancelled ? AUTH_ERROR_CODES.OAUTH_CANCELLED : AUTH_ERROR_CODES.OAUTH_ERROR],
      details: error,
      isRetryable: !isCancelled,
    };
  }

  // Generic error handling
  const message = error.message || error.toString();
  const code = error.code || AUTH_ERROR_CODES.UNKNOWN_ERROR;
  
  return {
    code,
    message: ERROR_MESSAGES[code] || message || ERROR_MESSAGES[AUTH_ERROR_CODES.UNKNOWN_ERROR],
    details: error,
    isRetryable: isRetryableError(code),
  };
}

/**
 * Map TRPC error codes to our auth error codes
 */
function mapTRPCErrorCode(code: string): string {
  const mapping: Record<string, string> = {
    'UNAUTHORIZED': AUTH_ERROR_CODES.UNAUTHORIZED,
    'FORBIDDEN': AUTH_ERROR_CODES.UNAUTHORIZED,
    'NOT_FOUND': AUTH_ERROR_CODES.INVALID_CREDENTIALS,
    'CONFLICT': AUTH_ERROR_CODES.EMAIL_IN_USE,
    'TOO_MANY_REQUESTS': AUTH_ERROR_CODES.RATE_LIMIT,
    'BAD_REQUEST': AUTH_ERROR_CODES.VALIDATION_ERROR,
    'INTERNAL_SERVER_ERROR': AUTH_ERROR_CODES.SERVER_ERROR,
  };
  
  return mapping[code] || AUTH_ERROR_CODES.UNKNOWN_ERROR;
}

/**
 * Map Better Auth error strings to our error codes
 */
function mapBetterAuthError(error: string): string {
  const lowerError = error.toLowerCase();
  
  if (lowerError.includes('invalid') && lowerError.includes('credentials')) {
    return AUTH_ERROR_CODES.INVALID_CREDENTIALS;
  }
  if (lowerError.includes('session') && lowerError.includes('expired')) {
    return AUTH_ERROR_CODES.SESSION_EXPIRED;
  }
  if (lowerError.includes('email') && lowerError.includes('use')) {
    return AUTH_ERROR_CODES.EMAIL_IN_USE;
  }
  if (lowerError.includes('rate') || lowerError.includes('limit')) {
    return AUTH_ERROR_CODES.RATE_LIMIT;
  }
  if (lowerError.includes('locked')) {
    return AUTH_ERROR_CODES.ACCOUNT_LOCKED;
  }
  if (lowerError.includes('verif')) {
    return AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED;
  }
  
  return AUTH_ERROR_CODES.UNKNOWN_ERROR;
}

/**
 * Check if an error is retryable
 */
function isRetryableError(code: string): boolean {
  const retryableCodes = [
    AUTH_ERROR_CODES.NETWORK_ERROR,
    AUTH_ERROR_CODES.SERVER_ERROR,
    AUTH_ERROR_CODES.RATE_LIMIT,
    AUTH_ERROR_CODES.SESSION_EXPIRED,
  ];
  
  return retryableCodes.includes(code);
}

/**
 * Show a standardized error alert
 */
export function showAuthErrorAlert(error: any, title: string = 'Authentication Error'): void {
  const authError = extractAuthError(error);
  
  Alert.alert(
    title,
    authError.message,
    [
      {
        text: 'OK',
        style: 'default',
      },
    ],
    { cancelable: true }
  );
  
  // Log the error for debugging
  logger.auth.error('Auth error alert shown', {
    title,
    code: authError.code,
    message: authError.message,
    details: authError.details,
  });
}

/**
 * Get a user-friendly error message
 */
export function getAuthErrorMessage(error: any): string {
  const authError = extractAuthError(error);
  return authError.message;
}

/**
 * Check if error is due to rate limiting
 */
export function isRateLimitError(error: any): boolean {
  const authError = extractAuthError(error);
  return authError.code === AUTH_ERROR_CODES.RATE_LIMIT || 
         authError.code === AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS;
}

/**
 * Check if error requires user to verify email
 */
export function isEmailVerificationError(error: any): boolean {
  const authError = extractAuthError(error);
  return authError.code === AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED;
}

/**
 * Check if error is due to incomplete profile
 */
export function isProfileIncompleteError(error: any): boolean {
  const authError = extractAuthError(error);
  return authError.code === AUTH_ERROR_CODES.PROFILE_INCOMPLETE;
}

/**
 * Create a retry handler with exponential backoff
 */
export function createRetryHandler<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): () => Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  return async () => {
    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const authError = extractAuthError(error);
        
        // Don't retry if not retryable
        if (!authError.isRetryable) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries - 1) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
        
        // Call retry callback
        onRetry?.(attempt + 1, error);
        
        // Log retry attempt
        logger.auth.debug('Retrying after error', {
          attempt: attempt + 1,
          delay,
          error: authError,
        });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  };
}