import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { api } from '@/lib/api/trpc';

interface ValidatedOrganization {
  id: string;
  name: string;
  type: string;
  hospitals: { id: string; name: string; code: string; isDefault: boolean }[];
}

interface UseOrganizationCodeValidationResult {
  isValidating: boolean;
  validatedOrganization: ValidatedOrganization | null;
  validationMessage: string | null;
  isValid: boolean;
}

/**
 * Hook for validating organization codes with debouncing and caching
 * @param code The organization code to validate
 * @param delay Debounce delay in milliseconds (default: 800ms)
 * @returns Validation state and results
 */
export function useOrganizationCodeValidation(
  code: string | undefined,
  delay: number = 800
): UseOrganizationCodeValidationResult {
  const [validatedOrganization, setValidatedOrganization] = useState<ValidatedOrganization | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  
  // Debounce the code to avoid too many API calls
  const debouncedCode = useDebounce(code || '', delay);
  
  // Only validate if we have a proper code (at least 4 characters)
  const shouldValidate = debouncedCode.length >= 4;
  
  // Use the TRPC query with proper configuration
  const { data, isLoading, error } = api.auth.validateOrganizationCode.useQuery(
    { code: debouncedCode },
    {
      enabled: shouldValidate,
      retry: false,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // Don't refetch on mount if we have cached data
    }
  );
  
  // Update state based on query results
  useEffect(() => {
    // Clear state if code is too short
    if (!shouldValidate) {
      setValidatedOrganization(null);
      setValidationMessage(null);
      return;
    }
    
    // Handle loading state
    if (isLoading) {
      setValidationMessage(null);
      return;
    }
    
    // Handle error state
    if (error) {
      setValidatedOrganization(null);
      setValidationMessage('Error validating code');
      return;
    }
    
    // Handle successful validation
    if (data) {
      if (data.valid && data.organization) {
        setValidatedOrganization({
          id: data.organization.id,
          name: data.organization.name,
          type: data.organization.type,
          hospitals: data.hospitals || [],
        });
        setValidationMessage(`✓ ${data.organization.name}`);
      } else {
        setValidatedOrganization(null);
        setValidationMessage('Invalid organization code');
      }
    }
  }, [data, isLoading, error, shouldValidate]);
  
  return {
    isValidating: isLoading && shouldValidate,
    validatedOrganization,
    validationMessage,
    isValid: !!validatedOrganization,
  };
}