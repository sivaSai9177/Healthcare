import { useAuth } from '@/hooks/useAuth';
import { useHospitalContext } from './useHospitalContext';
import { HealthcareUser, isHealthcareUser, ValidHealthcareContext } from '@/types/healthcare-context';
import { HealthcareUserRole } from '@/types/healthcare';
import { logger } from '@/lib/core/debug/unified-logger';

interface UseHealthcareUserResult {
  user: HealthcareUser | null;
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
  context: ValidHealthcareContext | null;
}

/**
 * Hook that provides type-safe healthcare user context
 * Ensures all required fields are present before allowing access
 */
export function useHealthcareUser(): UseHealthcareUserResult {
  const { user, isAuthenticated } = useAuth();
  const hospitalContext = useHospitalContext();
  
  // Validate user has healthcare context
  if (!user || !isAuthenticated) {
    return {
      user: null,
      isValid: false,
      isLoading: false,
      error: 'Not authenticated',
      context: null,
    };
  }
  
  // Check if user has all required healthcare fields
  if (!isHealthcareUser(user)) {
    logger.warn('User missing healthcare fields', 'HEALTHCARE_USER', {
      hasOrganizationId: !!user.organizationId,
      hasDefaultHospitalId: !!user.defaultHospitalId,
      role: user.role,
    });
    
    return {
      user: null,
      isValid: false,
      isLoading: hospitalContext.isLoading,
      error: hospitalContext.errorMessage || 'Incomplete healthcare profile',
      context: null,
    };
  }
  
  // User is valid healthcare user
  const healthcareUser = user as HealthcareUser;
  
  return {
    user: healthcareUser,
    isValid: true,
    isLoading: false,
    error: null,
    context: {
      user: healthcareUser,
      hospitalId: healthcareUser.defaultHospitalId,
      organizationId: healthcareUser.organizationId,
      role: healthcareUser.role,
    },
  };
}

/**
 * Hook that requires valid healthcare user context
 * Throws if context is invalid - use in components that absolutely need it
 */
export function useRequiredHealthcareUser(): ValidHealthcareContext {
  const result = useHealthcareUser();
  
  if (!result.isValid || !result.context) {
    const error = new Error(result.error || 'Healthcare context required');
    logger.error('Required healthcare user context missing', 'HEALTHCARE_USER', {
      error: result.error,
      isValid: result.isValid,
    });
    throw error;
  }
  
  return result.context;
}