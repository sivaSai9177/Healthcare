import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { z } from 'zod';
import { useDebounce } from './useDebounce';
import { logger } from '@/lib/core/debug/logger';

interface UseEmailValidationOptions {
  onCheckEmail?: (email: string) => Promise<{ exists: boolean }>;
  debounceDelay?: number;
  minLength?: number;
}

interface UseEmailValidationReturn {
  emailExists: boolean | null;
  isCheckingEmail: boolean;
  isValidEmail: boolean;
  debouncedEmail: string;
}

/**
 * Hook for centralized email validation with debouncing
 * Prevents duplicate requests and handles validation state
 */
export function useEmailValidation(
  email: string,
  options: UseEmailValidationOptions = {}
): UseEmailValidationReturn {
  const {
    onCheckEmail,
    debounceDelay = 500,
    minLength = 3
  } = options;

  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const checkingEmailRef = useRef<string | null>(null);
  
  // Debounce the email input
  const debouncedEmail = useDebounce(email, debounceDelay);
  
  // Validate email format
  const isValidEmail = useMemo(() => {
    if (!email || email.length < 3) {
      return false;
    }
    try {
      z.string().email().parse(email);
      return true;
    } catch {
      return false;
    }
  }, [email]);
  
  // Check email existence
  useEffect(() => {
    // Reset state when email is cleared or too short
    if (!debouncedEmail || debouncedEmail.length < minLength) {
      setEmailExists(null);
      checkingEmailRef.current = null;
      setIsCheckingEmail(false);
      return;
    }
    
    // Only check if we have a valid email format
    if (onCheckEmail && isValidEmail) {
      // Prevent duplicate requests for the same email
      if (checkingEmailRef.current === debouncedEmail) {
        return;
      }
      
      checkingEmailRef.current = debouncedEmail;
      setIsCheckingEmail(true);
      
      onCheckEmail(debouncedEmail)
        .then(({ exists }) => {
          // Only update if this is still the current email being checked
          if (checkingEmailRef.current === debouncedEmail) {
            setEmailExists(exists);
          }
        })
        .catch((error) => {
          logger.auth.error('Email check failed', error);
          if (checkingEmailRef.current === debouncedEmail) {
            setEmailExists(null);
          }
        })
        .finally(() => {
          if (checkingEmailRef.current === debouncedEmail) {
            setIsCheckingEmail(false);
          }
        });
    }
  }, [debouncedEmail, isValidEmail, onCheckEmail, minLength]);
  
  return {
    emailExists,
    isCheckingEmail,
    isValidEmail,
    debouncedEmail
  };
}