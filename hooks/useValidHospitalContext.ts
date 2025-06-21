import { useAuth } from '@/hooks/useAuth';
import { useHospitalStore } from '@/lib/stores/hospital-store';
import { useMemo } from 'react';
import { logger } from '@/lib/core/debug/unified-logger';

interface ValidHospitalContext {
  hospitalId: string | null;
  isValid: boolean;
  error: string | null;
  requiresHospitalSelection: boolean;
}

export function useValidHospitalContext(): ValidHospitalContext {
  const { user } = useAuth();
  const { currentHospital } = useHospitalStore();

  return useMemo(() => {
    // Check if user is a healthcare role
    const healthcareRoles = ['nurse', 'doctor', 'healthcare_admin', 'head_nurse', 'head_doctor'];
    const isHealthcareUser = user?.role && healthcareRoles.includes(user.role);

    // Get hospital ID from either current selection or user default
    const hospitalId = currentHospital?.id || user?.defaultHospitalId || null;

    // Validate the context
    const isValid = !!(hospitalId && hospitalId !== '');
    const requiresHospitalSelection = isHealthcareUser && !isValid;
    
    let error: string | null = null;
    if (requiresHospitalSelection) {
      error = 'Hospital assignment required';
    } else if (!isHealthcareUser) {
      error = 'Healthcare role required';
    }

    // Log validation result
    if (!isValid && isHealthcareUser) {
      logger.warn('Invalid hospital context', 'HEALTHCARE', {
        userId: user?.id,
        role: user?.role,
        hospitalId,
        currentHospital: currentHospital?.id,
        defaultHospitalId: user?.defaultHospitalId,
      });
    }

    return {
      hospitalId,
      isValid,
      error,
      requiresHospitalSelection,
    };
  }, [user, currentHospital]);
}

// Type guard to ensure hospitalId is valid
export function isValidHospitalId(hospitalId: string | null | undefined): hospitalId is string {
  return typeof hospitalId === 'string' && hospitalId.length > 0;
}