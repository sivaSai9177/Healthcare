import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import {
  CreateAlertSchema,
  AcknowledgeAlertSchema,
  UpdateUserRoleSchema,
  HealthcareProfileSchema,
  type CreateAlertInput,
  type AcknowledgeAlertInput,
  type UpdateUserRoleInput,
  type HealthcareProfile,
} from '@/types/healthcare';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/core/debug/unified-logger';

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationResult<T> {
  isValid: boolean;
  errors: ValidationError[];
  data?: T;
}

// Hook for validating alert creation
export function useCreateAlertValidation() {
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validate = useCallback((data: Partial<CreateAlertInput>): ValidationResult<CreateAlertInput> => {
    logger.healthcare.debug('Validating alert creation', { data, userId: user?.id });
    
    try {
      // Add hospitalId from user context if not provided
      const dataWithHospital = {
        ...data,
        hospitalId: data.hospitalId || user?.organizationId || '',
      };
      
      // Validate with Zod schema
      const validatedData = CreateAlertSchema.parse(dataWithHospital);
      
      setErrors({});
      return {
        isValid: true,
        errors: [],
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        const validationErrors: ValidationError[] = [];
        
        error.errors.forEach((err) => {
          const field = err.path.join('.');
          fieldErrors[field] = err.message;
          validationErrors.push({ field, message: err.message });
        });
        
        setErrors(fieldErrors);
        logger.healthcare.warn('Alert validation failed', { errors: validationErrors });
        
        return {
          isValid: false,
          errors: validationErrors,
        };
      }
      
      throw error;
    }
  }, [user]);
  
  const validateField = useCallback((field: keyof CreateAlertInput, value: any): string | null => {
    try {
      // Create a partial schema for single field validation
      const fieldSchema = CreateAlertSchema.shape[field];
      fieldSchema.parse(value);
      
      // Clear error for this field
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors[0]?.message || 'Invalid value';
        setErrors((prev) => ({ ...prev, [field]: message }));
        return message;
      }
      return 'Validation error';
    }
  }, []);
  
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);
  
  const validateWithContext = useCallback((data: Partial<CreateAlertInput>, userOrgId: string): boolean => {
    const dataWithHospital = {
      ...data,
      hospitalId: data.hospitalId || userOrgId || '',
    };
    
    const result = validate(dataWithHospital);
    return result.isValid;
  }, [validate]);
  
  const getFieldError = useCallback((field: string): string | undefined => {
    return errors[field];
  }, [errors]);
  
  return {
    validate,
    validateField,
    validateWithContext,
    errors,
    isValid: Object.keys(errors).length === 0,
    clearErrors,
    hasErrors: Object.keys(errors).length > 0,
    getFieldError,
  };
}

// Hook for validating alert acknowledgment
export function useAcknowledgeAlertValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validate = useCallback((data: Partial<AcknowledgeAlertInput>): ValidationResult<AcknowledgeAlertInput> => {
    try {
      // Apply conditional validation based on response action
      let schemaToUse = AcknowledgeAlertSchema;
      
      if (data.responseAction === 'delegating' && !data.delegateTo) {
        setErrors({ delegateTo: 'Please select a staff member to delegate to' });
        return {
          isValid: false,
          errors: [{ field: 'delegateTo', message: 'Please select a staff member to delegate to' }],
        };
      }
      
      if ((data.responseAction === 'responding' || data.responseAction === 'delayed') && !data.estimatedResponseTime) {
        setErrors({ estimatedResponseTime: 'Please provide estimated response time' });
        return {
          isValid: false,
          errors: [{ field: 'estimatedResponseTime', message: 'Please provide estimated response time' }],
        };
      }
      
      const validatedData = schemaToUse.parse(data);
      setErrors({});
      
      return {
        isValid: true,
        errors: [],
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        const validationErrors: ValidationError[] = [];
        
        error.errors.forEach((err) => {
          const field = err.path.join('.');
          fieldErrors[field] = err.message;
          validationErrors.push({ field, message: err.message });
        });
        
        setErrors(fieldErrors);
        return {
          isValid: false,
          errors: validationErrors,
        };
      }
      
      throw error;
    }
  }, []);
  
  return {
    validate,
    errors,
    clearErrors: () => setErrors({}),
    hasErrors: Object.keys(errors).length > 0,
  };
}

// Hook for validating healthcare profile updates
export function useHealthcareProfileValidation() {
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validate = useCallback((data: Partial<HealthcareProfile>): ValidationResult<HealthcareProfile> => {
    try {
      // Add role-specific validation
      if (data.role && ['doctor', 'head_doctor'].includes(data.role)) {
        if (!data.licenseNumber) {
          setErrors({ licenseNumber: 'License number is required for doctors' });
          return {
            isValid: false,
            errors: [{ field: 'licenseNumber', message: 'License number is required for doctors' }],
          };
        }
      }
      
      const validatedData = HealthcareProfileSchema.parse(data);
      setErrors({});
      
      return {
        isValid: true,
        errors: [],
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        const validationErrors: ValidationError[] = [];
        
        error.errors.forEach((err) => {
          const field = err.path.join('.');
          fieldErrors[field] = err.message;
          validationErrors.push({ field, message: err.message });
        });
        
        setErrors(fieldErrors);
        return {
          isValid: false,
          errors: validationErrors,
        };
      }
      
      throw error;
    }
  }, [user]);
  
  return {
    validate,
    errors,
    clearErrors: () => setErrors({}),
    hasErrors: Object.keys(errors).length > 0,
  };
}

// Hook for validating user role updates
export function useUpdateUserRoleValidation() {
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validate = useCallback((data: Partial<UpdateUserRoleInput>): ValidationResult<UpdateUserRoleInput> => {
    try {
      // Check permissions based on current user role
      const currentUserRole = user?.role || 'user';
      
      // Only admin and head_doctor can update roles
      if (!['admin', 'head_doctor'].includes(currentUserRole)) {
        setErrors({ general: 'You do not have permission to update user roles' });
        return {
          isValid: false,
          errors: [{ field: 'general', message: 'You do not have permission to update user roles' }],
        };
      }
      
      // Head doctors can only assign healthcare roles
      if (currentUserRole === 'head_doctor' && data.role) {
        const allowedRoles = ['nurse', 'doctor', 'operator'];
        if (!allowedRoles.includes(data.role)) {
          setErrors({ role: 'You can only assign healthcare roles (nurse, doctor, operator)' });
          return {
            isValid: false,
            errors: [{ field: 'role', message: 'You can only assign healthcare roles' }],
          };
        }
      }
      
      const validatedData = UpdateUserRoleSchema.parse(data);
      setErrors({});
      
      return {
        isValid: true,
        errors: [],
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        const validationErrors: ValidationError[] = [];
        
        error.errors.forEach((err) => {
          const field = err.path.join('.');
          fieldErrors[field] = err.message;
          validationErrors.push({ field, message: err.message });
        });
        
        setErrors(fieldErrors);
        return {
          isValid: false,
          errors: validationErrors,
        };
      }
      
      throw error;
    }
  }, [user]);
  
  return {
    validate,
    errors,
    clearErrors: () => setErrors({}),
    hasErrors: Object.keys(errors).length > 0,
  };
}

// Generic validation hook factory
export function useValidation<T>(schema: z.ZodSchema<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validate = useCallback((data: unknown): ValidationResult<T> => {
    try {
      const validatedData = schema.parse(data);
      setErrors({});
      
      return {
        isValid: true,
        errors: [],
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        const validationErrors: ValidationError[] = [];
        
        error.errors.forEach((err) => {
          const field = err.path.join('.');
          fieldErrors[field] = err.message;
          validationErrors.push({ field, message: err.message });
        });
        
        setErrors(fieldErrors);
        return {
          isValid: false,
          errors: validationErrors,
        };
      }
      
      throw error;
    }
  }, [schema]);
  
  return {
    validate,
    errors,
    clearErrors: () => setErrors({}),
    hasErrors: Object.keys(errors).length > 0,
  };
}

// Helper function to format validation errors for display
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0].message;
  
  return errors.map(err => `• ${err.message}`).join('\n');
}

// Helper function to get the first error message
export function getFirstError(errors: Record<string, string>): string | null {
  const keys = Object.keys(errors);
  if (keys.length === 0) return null;
  
  return errors[keys[0]];
}