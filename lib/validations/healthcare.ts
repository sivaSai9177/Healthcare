import { z } from 'zod';

// Define ALERT_TYPES and URGENCY_LEVELS as arrays for validation
export const ALERT_TYPES = ['cardiac_arrest', 'code_blue', 'fire', 'security', 'medical_emergency'] as const;
export const URGENCY_LEVELS = [1, 2, 3, 4, 5] as const;
export const HEALTHCARE_ROLES = ['operator', 'doctor', 'nurse', 'head_doctor', 'admin'] as const;

// Validation message constants for consistency
export const VALIDATION_MESSAGES = {
  required: (field: string) => `${field} is required`,
  invalid: (field: string) => `Invalid ${field}`,
  minLength: (field: string, min: number) => `${field} must be at least ${min} characters`,
  maxLength: (field: string, max: number) => `${field} must be at most ${max} characters`,
  invalidFormat: (field: string, format: string) => `${field} must be in ${format} format`,
  notAllowed: (field: string, allowed: string[]) => `${field} must be one of: ${allowed.join(', ')}`,
  permissions: 'You do not have permission to perform this action',
} as const;

// Room number validation patterns
export const ROOM_NUMBER_PATTERNS = {
  standard: /^[A-Z0-9]{1,4}[A-Z]?$/i, // e.g., "101", "205A", "ICU1"
  withFloor: /^[0-9]{1,2}-[A-Z0-9]{1,4}[A-Z]?$/i, // e.g., "2-101", "3-ICU"
  emergency: /^(ER|ED|ICU|CCU|NICU|OR)-?[0-9]{1,3}$/i, // e.g., "ER-1", "ICU2"
};

// License number patterns by type
export const LICENSE_PATTERNS = {
  medical: /^[A-Z]{2}-[0-9]{6,8}$/, // e.g., "CA-123456"
  nursing: /^RN-[0-9]{6,8}$/, // e.g., "RN-123456"
  general: /^[A-Z0-9]{6,12}$/, // General format
};

// Validation utility functions
export const validators = {
  isValidRoomNumber: (roomNumber: string): boolean => {
    return (
      ROOM_NUMBER_PATTERNS.standard.test(roomNumber) ||
      ROOM_NUMBER_PATTERNS.withFloor.test(roomNumber) ||
      ROOM_NUMBER_PATTERNS.emergency.test(roomNumber)
    );
  },
  
  isValidLicenseNumber: (license: string, type: 'medical' | 'nursing' | 'general' = 'general'): boolean => {
    return LICENSE_PATTERNS[type].test(license);
  },
  
  isValidDepartment: (department: string): boolean => {
    const validDepartments = [
      'emergency',
      'cardiology',
      'orthopedics',
      'pediatrics',
      'obstetrics',
      'neurology',
      'oncology',
      'radiology',
      'pathology',
      'psychiatry',
      'general',
    ];
    return validDepartments.includes(department.toLowerCase());
  },
  
  isValidShiftTime: (hours: number, minutes: number): boolean => {
    // Validate shift time (0-23 hours, 0-59 minutes)
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  },
  
  isValidResponseTime: (minutes: number, urgencyLevel: number): boolean => {
    // Response time limits based on urgency level
    const limits: Record<number, number> = {
      1: 5, // Critical: max 5 minutes
      2: 10, // High: max 10 minutes
      3: 20, // Medium: max 20 minutes
      4: 30, // Low: max 30 minutes
      5: 60, // Minimal: max 60 minutes
    };
    
    return minutes > 0 && minutes <= (limits[urgencyLevel] || 60);
  },
};

// Custom Zod refinements
export const zodRefinements = {
  roomNumber: z
    .string()
    .min(1, VALIDATION_MESSAGES.required('Room number'))
    .max(10, VALIDATION_MESSAGES.maxLength('Room number', 10))
    .refine(validators.isValidRoomNumber, {
      message: VALIDATION_MESSAGES.invalidFormat('Room number', 'e.g., 101, 205A, ER-1'),
    }),
    
  licenseNumber: z
    .string()
    .min(6, VALIDATION_MESSAGES.minLength('License number', 6))
    .max(20, VALIDATION_MESSAGES.maxLength('License number', 20))
    .refine((val) => validators.isValidLicenseNumber(val, 'medical') || 
                     validators.isValidLicenseNumber(val, 'nursing') || 
                     validators.isValidLicenseNumber(val, 'general'), {
      message: VALIDATION_MESSAGES.invalidFormat('License number', 'e.g., CA-123456, RN-123456'),
    }),
    
  department: z
    .string()
    .min(1, VALIDATION_MESSAGES.required('Department'))
    .refine(validators.isValidDepartment, {
      message: VALIDATION_MESSAGES.invalid('department'),
    }),
    
  shiftTime: z.object({
    hours: z.number().int().min(0).max(23),
    minutes: z.number().int().min(0).max(59),
  }).refine(({ hours, minutes }) => validators.isValidShiftTime(hours, minutes), {
    message: VALIDATION_MESSAGES.invalid('shift time'),
  }),
};

// Permission validators
export const permissionValidators = {
  canAssignRole: (currentRole: string, targetRole: string): boolean => {
    // Admin can assign any role
    if (currentRole === 'admin') return true;
    
    // Head doctor can assign healthcare roles
    if (currentRole === 'head_doctor') {
      return ['nurse', 'doctor', 'operator'].includes(targetRole);
    }
    
    return false;
  },
  
  canCreateAlert: (role: string): boolean => {
    return ['nurse', 'doctor', 'head_doctor', 'operator', 'admin'].includes(role);
  },
  
  canAcknowledgeAlert: (role: string): boolean => {
    return ['doctor', 'head_doctor', 'admin'].includes(role);
  },
  
  canResolveAlert: (role: string): boolean => {
    return ['doctor', 'head_doctor', 'admin'].includes(role);
  },
  
  canEscalateAlert: (role: string): boolean => {
    return ['nurse', 'doctor', 'head_doctor', 'admin'].includes(role);
  },
  
  canViewPatientData: (role: string): boolean => {
    return ['nurse', 'doctor', 'head_doctor', 'admin'].includes(role);
  },
  
  canManageShifts: (role: string): boolean => {
    return ['head_doctor', 'admin'].includes(role);
  },
};

// Form validation helpers
export const formValidation = {
  getFieldError: (errors: z.ZodError, field: string): string | null => {
    const error = errors.errors.find((err) => err.path.includes(field));
    return error?.message || null;
  },
  
  hasFieldError: (errors: z.ZodError, field: string): boolean => {
    return errors.errors.some((err) => err.path.includes(field));
  },
  
  getFirstError: (errors: z.ZodError): string => {
    return errors.errors[0]?.message || 'Validation error';
  },
  
  formatErrors: (errors: z.ZodError): Record<string, string> => {
    const formatted: Record<string, string> = {};
    errors.errors.forEach((err) => {
      const field = err.path.join('.');
      formatted[field] = err.message;
    });
    return formatted;
  },
};

// Alert validation helpers
export const alertValidation = {
  isValidAlertType: (type: string): type is typeof ALERT_TYPES[number] => {
    return ALERT_TYPES.includes(type as any);
  },
  
  isValidUrgencyLevel: (level: number): level is typeof URGENCY_LEVELS[number] => {
    return URGENCY_LEVELS.includes(level as any);
  },
  
  getDefaultUrgencyForType: (alertType: string): number => {
    const defaults: Record<string, number> = {
      code_blue: 1,
      medical_emergency: 1,
      cardiac_arrest: 1,
      rapid_response: 2,
      fall_risk: 3,
      assistance_needed: 4,
      medication_request: 3,
      pain_management: 3,
      equipment_malfunction: 3,
      security_alert: 2,
      general_request: 5,
    };
    return defaults[alertType] || 3;
  },
  
  getResponseTimeLimit: (urgencyLevel: number): number => {
    const limits: Record<number, number> = {
      1: 5,
      2: 10,
      3: 20,
      4: 30,
      5: 60,
    };
    return limits[urgencyLevel] || 30;
  },
};

// Export validation schemas with enhanced messages
export const enhancedSchemas = {
  createAlert: z.object({
    roomNumber: zodRefinements.roomNumber,
    alertType: z.enum(ALERT_TYPES, {
      errorMap: () => ({ message: VALIDATION_MESSAGES.notAllowed('Alert type', [...ALERT_TYPES]) }),
    }),
    urgencyLevel: z.number()
      .int()
      .min(1, 'Urgency level must be at least 1')
      .max(5, 'Urgency level must be at most 5'),
    description: z.string().optional(),
    hospitalId: z.string().uuid('Invalid hospital ID'),
  }),
  
  acknowledgeAlert: z.object({
    alertId: z.string().uuid('Invalid alert ID'),
    urgencyAssessment: z.enum(['maintain', 'increase', 'decrease']),
    responseAction: z.enum(['responding', 'delayed', 'delegating', 'escalating']),
    estimatedResponseTime: z.number().int().positive().optional(),
    delegateTo: z.string().uuid().optional(),
    notes: z.string().optional(),
  }).refine((data) => {
    // Conditional validation
    if (data.responseAction === 'delegating' && !data.delegateTo) {
      return false;
    }
    if ((data.responseAction === 'responding' || data.responseAction === 'delayed') && !data.estimatedResponseTime) {
      return false;
    }
    return true;
  }, {
    message: 'Missing required fields for selected response action',
  }),
  
  // Shift management schemas
  startShift: z.object({
    isOnDuty: z.literal(true),
  }),
  
  endShift: z.object({
    isOnDuty: z.literal(false),
    handoverNotes: z.string()
      .min(10, 'Handover notes must be at least 10 characters')
      .max(500, 'Handover notes must be at most 500 characters')
      .optional(),
  }),
  
  shiftHandover: z.object({
    notes: z.string()
      .min(10, 'Handover notes must be at least 10 characters')
      .max(500, 'Handover notes must be at most 500 characters')
      .refine((val) => val.trim().length >= 10, {
        message: 'Please provide more detailed handover notes',
      }),
    activeAlerts: z.array(z.object({
      alertId: z.string().uuid(),
      status: z.string(),
      notes: z.string().optional(),
    })).optional(),
    handoverTo: z.string().uuid().optional(),
  }),
};

// Patient validation schemas
export const patientSchemas = {
  createPatient: z.object({
    hospitalId: z.string().uuid('Invalid hospital ID'),
    name: z.string()
      .min(2, VALIDATION_MESSAGES.minLength('Name', 2))
      .max(255, VALIDATION_MESSAGES.maxLength('Name', 255))
      .refine((val) => val.trim().length >= 2, {
        message: 'Name must contain at least 2 characters',
      }),
    dateOfBirth: z.date({
      required_error: VALIDATION_MESSAGES.required('Date of birth'),
    }).refine((date) => {
      const age = new Date().getFullYear() - date.getFullYear();
      return age >= 0 && age <= 150;
    }, {
      message: 'Invalid date of birth',
    }),
    gender: z.enum(['male', 'female', 'other'], {
      errorMap: () => ({ message: 'Gender must be male, female, or other' }),
    }),
    department: zodRefinements.department,
    address: z.string()
      .min(10, VALIDATION_MESSAGES.minLength('Address', 10))
      .max(500, VALIDATION_MESSAGES.maxLength('Address', 500)),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    diagnosis: z.string()
      .max(500, VALIDATION_MESSAGES.maxLength('Diagnosis', 500))
      .optional(),
    condition: z.string()
      .max(100, VALIDATION_MESSAGES.maxLength('Condition', 100))
      .optional(),
    emergencyContact: z.object({
      name: z.string().min(2, VALIDATION_MESSAGES.minLength('Contact name', 2)),
      phoneNumber: z.string().regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number'),
      relationship: z.string().optional(),
    }).optional(),
  }),
  
  updatePatient: z.object({
    roomNumber: zodRefinements.roomNumber.optional(),
    department: zodRefinements.department.optional(),
    condition: z.string()
      .max(100, VALIDATION_MESSAGES.maxLength('Condition', 100))
      .optional(),
    assignedNurseId: z.string().uuid('Invalid nurse ID').optional(),
    medicalNotes: z.string()
      .max(2000, VALIDATION_MESSAGES.maxLength('Medical notes', 2000))
      .optional(),
    diagnosis: z.string()
      .max(500, VALIDATION_MESSAGES.maxLength('Diagnosis', 500))
      .optional(),
  }),
  
  dischargePatient: z.object({
    patientId: z.string().uuid('Invalid patient ID'),
    dischargeDate: z.date({
      required_error: VALIDATION_MESSAGES.required('Discharge date'),
    }),
    dischargeSummary: z.string()
      .min(50, VALIDATION_MESSAGES.minLength('Discharge summary', 50))
      .max(2000, VALIDATION_MESSAGES.maxLength('Discharge summary', 2000)),
    followUpInstructions: z.string()
      .max(1000, VALIDATION_MESSAGES.maxLength('Follow-up instructions', 1000))
      .optional(),
  }),
  
  // Search/filter validation
  patientFilters: z.object({
    hospitalId: z.string().uuid(),
    department: z.string().optional(),
    status: z.enum(['admitted', 'discharged', 'all']).optional(),
    searchQuery: z.string().optional(),
    limit: z.number().int().positive().max(100).optional().default(20),
    offset: z.number().int().min(0).optional().default(0),
  }),
};

// Patient validation helpers
export const patientValidation = {
  isValidMedicalRecordNumber: (mrn: string): boolean => {
    // Format: HOSP-YYYY-NNNNN (e.g., MED-2024-00123)
    return /^[A-Z]{3,4}-\d{4}-\d{5}$/.test(mrn);
  },
  
  generateMedicalRecordNumber: (hospitalCode: string): string => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `${hospitalCode.toUpperCase().slice(0, 3)}-${year}-${random}`;
  },
  
  calculateAge: (dateOfBirth: Date | string): number => {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    return age;
  },
  
  formatPatientName: (name: string): string => {
    return name
      .trim()
      .split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  },
};

// Create form validation factory
export function createFormValidator<T>(schema: z.ZodSchema<T>) {
  return {
    validate: (data: unknown): { success: boolean; data?: T; errors?: Record<string, string> } => {
      try {
        const validatedData = schema.parse(data);
        return { success: true, data: validatedData };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            success: false,
            errors: formValidation.formatErrors(error),
          };
        }
        throw error;
      }
    },
    
    validateField: (field: string, value: unknown): string | null => {
      try {
        const partialSchema = z.object({ [field]: (schema as any).shape[field] });
        partialSchema.parse({ [field]: value });
        return null;
      } catch (error) {
        if (error instanceof z.ZodError) {
          return formValidation.getFirstError(error);
        }
        return 'Validation error';
      }
    },
  };
}