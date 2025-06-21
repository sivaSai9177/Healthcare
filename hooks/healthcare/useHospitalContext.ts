import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentHospital } from '@/lib/stores/hospital-store';
import { logger } from '@/lib/core/debug/unified-logger';

export interface HospitalContextResult {
  // Hospital data
  hospitalId: string | null;
  hasValidHospital: boolean;
  isLoading: boolean;
  
  // Error states
  error: 'no-user' | 'no-hospital' | 'no-organization' | null;
  errorMessage: string | null;
  
  // Helper flags
  shouldShowProfilePrompt: boolean;
  canAccessHealthcare: boolean;
  
  // Context data
  userId: string | null;
  userRole: string | null;
  organizationId: string | null;
}

/**
 * Hook to validate and provide hospital context for healthcare features
 * This centralizes hospital validation logic to prevent runtime errors
 */
export function useHospitalContext(): HospitalContextResult {
  const { user, isAuthenticated } = useAuth();
  const { hospital, isLoading: hospitalLoading } = useCurrentHospital();
  
  return useMemo(() => {
    // Check if user exists
    if (!user) {
      logger.warn('No user found in hospital context', 'HOSPITAL_CONTEXT');
      return {
        hospitalId: null,
        hasValidHospital: false,
        isLoading: false,
        error: 'no-user',
        errorMessage: 'User not authenticated',
        shouldShowProfilePrompt: false,
        canAccessHealthcare: false,
        userId: null,
        userRole: null,
        organizationId: null,
      };
    }
    
    // Extract hospital ID with proper fallback logic
    const hospitalId = user.defaultHospitalId || hospital?.id || null;
    const organizationId = user.organizationId || null;
    
    // Determine error state
    let error: HospitalContextResult['error'] = null;
    let errorMessage: string | null = null;
    
    if (!organizationId) {
      error = 'no-organization';
      errorMessage = 'No organization assigned. Please contact your administrator.';
    } else if (!hospitalId) {
      error = 'no-hospital';
      errorMessage = 'No hospital assigned. Please complete your profile to access healthcare features.';
    }
    
    // Log context state for debugging
    logger.debug('Hospital context evaluated', 'HOSPITAL_CONTEXT', {
      userId: user.id,
      userRole: user.role,
      organizationId,
      hospitalId,
      hasValidHospital: !!hospitalId,
      error,
    });
    
    // Determine if we should show profile prompt
    const shouldShowProfilePrompt = isAuthenticated && !hospitalId && !!organizationId;
    
    // Can access healthcare if authenticated and has valid hospital
    const canAccessHealthcare = isAuthenticated && !!hospitalId && !!organizationId;
    
    return {
      hospitalId,
      hasValidHospital: !!hospitalId,
      isLoading: hospitalLoading,
      error,
      errorMessage,
      shouldShowProfilePrompt,
      canAccessHealthcare,
      userId: user.id,
      userRole: user.role,
      organizationId,
    };
  }, [user, hospital, hospitalLoading, isAuthenticated]);
}

/**
 * Hook to ensure valid hospital context or throw error
 * Use this in components that absolutely require hospital context
 */
export function useRequiredHospitalContext(): HospitalContextResult & { hospitalId: string } {
  const context = useHospitalContext();
  
  if (!context.hospitalId) {
    const error = new Error(context.errorMessage || 'Hospital context required');
    logger.error('Required hospital context missing', 'HOSPITAL_CONTEXT', {
      error: context.error,
      errorMessage: context.errorMessage,
    });
    throw error;
  }
  
  return context as HospitalContextResult & { hospitalId: string };
}