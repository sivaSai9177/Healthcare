import { describe, it, expect } from '@jest/globals';

describe('AlertCreationForm Component Logic', () => {
  describe('Form Validation', () => {
    interface AlertFormData {
      priority: string;
      type: string;
      patientId?: string;
      patientName?: string;
      room?: string;
      bed?: string;
      department?: string;
      description: string;
      vitals?: {
        heartRate?: number;
        bloodPressure?: string;
        temperature?: number;
        oxygenSaturation?: number;
      };
      attachments?: File[];
    }

    interface ValidationError {
      field: string;
      message: string;
    }

    const validateAlertForm = (data: AlertFormData): ValidationError[] => {
      const errors: ValidationError[] = [];

      // Required fields
      if (!data.priority) {
        errors.push({ field: 'priority', message: 'Priority is required' });
      }

      if (!data.type) {
        errors.push({ field: 'type', message: 'Alert type is required' });
      }

      if (!data.description || data.description.trim().length === 0) {
        errors.push({ field: 'description', message: 'Description is required' });
      } else if (data.description.length < 10) {
        errors.push({ field: 'description', message: 'Description must be at least 10 characters' });
      } else if (data.description.length > 500) {
        errors.push({ field: 'description', message: 'Description must not exceed 500 characters' });
      }

      // Patient identification
      if (!data.patientId && !data.patientName) {
        errors.push({ field: 'patient', message: 'Patient identification is required' });
      }

      // Location validation
      if (data.room && !/^[A-Z0-9-]+$/i.test(data.room)) {
        errors.push({ field: 'room', message: 'Invalid room format' });
      }

      if (data.bed && !/^[A-Z0-9]+$/i.test(data.bed)) {
        errors.push({ field: 'bed', message: 'Invalid bed format' });
      }

      // Vitals validation
      if (data.vitals) {
        if (data.vitals.heartRate !== undefined) {
          if (data.vitals.heartRate < 30 || data.vitals.heartRate > 250) {
            errors.push({ field: 'vitals.heartRate', message: 'Heart rate must be between 30-250 bpm' });
          }
        }

        if (data.vitals.temperature !== undefined) {
          if (data.vitals.temperature < 35 || data.vitals.temperature > 42) {
            errors.push({ field: 'vitals.temperature', message: 'Temperature must be between 35-42°C' });
          }
        }

        if (data.vitals.oxygenSaturation !== undefined) {
          if (data.vitals.oxygenSaturation < 0 || data.vitals.oxygenSaturation > 100) {
            errors.push({ field: 'vitals.oxygenSaturation', message: 'Oxygen saturation must be between 0-100%' });
          }
        }

        if (data.vitals.bloodPressure) {
          const bpPattern = /^\d{2,3}\/\d{2,3}$/;
          if (!bpPattern.test(data.vitals.bloodPressure)) {
            errors.push({ field: 'vitals.bloodPressure', message: 'Blood pressure must be in format XXX/XX' });
          }
        }
      }

      // Attachment validation
      if (data.attachments && data.attachments.length > 0) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

        data.attachments.forEach((file, index) => {
          if (file.size > maxSize) {
            errors.push({ field: `attachments.${index}`, message: `File ${file.name} exceeds 5MB limit` });
          }
          if (!allowedTypes.includes(file.type)) {
            errors.push({ field: `attachments.${index}`, message: `File ${file.name} has unsupported type` });
          }
        });

        if (data.attachments.length > 5) {
          errors.push({ field: 'attachments', message: 'Maximum 5 attachments allowed' });
        }
      }

      return errors;
    };

    it('validates required fields', () => {
      const errors = validateAlertForm({
        priority: '',
        type: '',
        description: '',
      });

      expect(errors).toHaveLength(4); // priority, type, description, patient
      expect(errors.find(e => e.field === 'priority')).toBeDefined();
      expect(errors.find(e => e.field === 'type')).toBeDefined();
      expect(errors.find(e => e.field === 'description')).toBeDefined();
      expect(errors.find(e => e.field === 'patient')).toBeDefined();
    });

    it('validates description length', () => {
      const tooShort = validateAlertForm({
        priority: 'high',
        type: 'medical',
        patientId: '123',
        description: 'Short',
      });

      expect(tooShort.find(e => e.field === 'description')?.message).toContain('at least 10 characters');

      const tooLong = validateAlertForm({
        priority: 'high',
        type: 'medical',
        patientId: '123',
        description: 'a'.repeat(501),
      });

      expect(tooLong.find(e => e.field === 'description')?.message).toContain('not exceed 500 characters');
    });

    it('validates vital signs ranges', () => {
      const errors = validateAlertForm({
        priority: 'high',
        type: 'medical',
        patientId: '123',
        description: 'Patient showing abnormal vitals',
        vitals: {
          heartRate: 300,
          temperature: 45,
          oxygenSaturation: 150,
          bloodPressure: '120-80',
        },
      });

      expect(errors.find(e => e.field === 'vitals.heartRate')).toBeDefined();
      expect(errors.find(e => e.field === 'vitals.temperature')).toBeDefined();
      expect(errors.find(e => e.field === 'vitals.oxygenSaturation')).toBeDefined();
      expect(errors.find(e => e.field === 'vitals.bloodPressure')).toBeDefined();
    });

    it('validates blood pressure format', () => {
      const valid = validateAlertForm({
        priority: 'high',
        type: 'medical',
        patientId: '123',
        description: 'Blood pressure check',
        vitals: {
          bloodPressure: '120/80',
        },
      });

      expect(valid.find(e => e.field === 'vitals.bloodPressure')).toBeUndefined();
    });

    it('validates room and bed format', () => {
      const errors = validateAlertForm({
        priority: 'high',
        type: 'medical',
        patientId: '123',
        description: 'Patient needs attention',
        room: 'Room 123!',
        bed: 'Bed-A',
      });

      expect(errors.find(e => e.field === 'room')).toBeDefined();
      expect(errors.find(e => e.field === 'bed')).toBeDefined();
    });
  });

  describe('Priority Suggestion', () => {
    interface AlertContext {
      type: string;
      vitals?: {
        heartRate?: number;
        bloodPressure?: string;
        temperature?: number;
        oxygenSaturation?: number;
      };
      keywords: string[];
    }

    const suggestPriority = (context: AlertContext): 'low' | 'medium' | 'high' | 'critical' => {
      // Critical keywords
      const criticalKeywords = ['cardiac arrest', 'unconscious', 'not breathing', 'severe bleeding', 'code blue'];
      if (context.keywords.some(k => criticalKeywords.includes(k.toLowerCase()))) {
        return 'critical';
      }

      // Check vital signs
      if (context.vitals) {
        const criticalVitals = [];

        if (context.vitals.heartRate) {
          if (context.vitals.heartRate < 40 || context.vitals.heartRate > 180) {
            criticalVitals.push('heartRate');
          }
        }

        if (context.vitals.oxygenSaturation) {
          if (context.vitals.oxygenSaturation < 90) {
            criticalVitals.push('oxygenSaturation');
          }
        }

        if (context.vitals.temperature) {
          if (context.vitals.temperature < 35 || context.vitals.temperature > 40) {
            criticalVitals.push('temperature');
          }
        }

        if (criticalVitals.length >= 2) return 'critical';
        if (criticalVitals.length === 1) return 'high';
      }

      // High priority keywords
      const highKeywords = ['pain', 'difficulty breathing', 'chest pain', 'fall', 'bleeding'];
      if (context.keywords.some(k => highKeywords.includes(k.toLowerCase()))) {
        return 'high';
      }

      // Type-based defaults
      const typeDefaults: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
        'code-blue': 'critical',
        'emergency': 'high',
        'urgent': 'high',
        'medical': 'medium',
        'assistance': 'medium',
        'routine': 'low',
      };

      return typeDefaults[context.type] || 'medium';
    };

    it('suggests critical priority for emergency keywords', () => {
      const priority = suggestPriority({
        type: 'emergency',
        keywords: ['cardiac arrest', 'patient'],
      });

      expect(priority).toBe('critical');
    });

    it('suggests critical priority for multiple abnormal vitals', () => {
      const priority = suggestPriority({
        type: 'medical',
        keywords: [],
        vitals: {
          heartRate: 35,
          oxygenSaturation: 85,
        },
      });

      expect(priority).toBe('critical');
    });

    it('suggests high priority for single abnormal vital', () => {
      const priority = suggestPriority({
        type: 'medical',
        keywords: [],
        vitals: {
          heartRate: 120,
          oxygenSaturation: 88,
        },
      });

      expect(priority).toBe('high');
    });

    it('uses type-based defaults', () => {
      expect(suggestPriority({ type: 'routine', keywords: [] })).toBe('low');
      expect(suggestPriority({ type: 'urgent', keywords: [] })).toBe('high');
    });
  });

  describe('Form Auto-Save', () => {
    interface AutoSaveConfig {
      enabled: boolean;
      interval: number;
      debounceDelay: number;
    }

    const getAutoSaveState = (
      isDirty: boolean,
      lastSaved: Date | null,
      lastModified: Date,
      config: AutoSaveConfig
    ) => {
      if (!config.enabled || !isDirty) {
        return { shouldSave: false, status: 'idle' };
      }

      const now = new Date();
      const timeSinceModified = now.getTime() - lastModified.getTime();
      const timeSinceSaved = lastSaved ? now.getTime() - lastSaved.getTime() : Infinity;

      if (timeSinceModified < config.debounceDelay) {
        return { shouldSave: false, status: 'waiting' };
      }

      if (timeSinceSaved >= config.interval) {
        return { shouldSave: true, status: 'saving' };
      }

      return { shouldSave: false, status: 'scheduled' };
    };

    it('saves when interval elapsed', () => {
      const state = getAutoSaveState(
        true,
        new Date(Date.now() - 31000), // 31 seconds ago
        new Date(Date.now() - 5000), // Modified 5 seconds ago
        { enabled: true, interval: 30000, debounceDelay: 3000 }
      );

      expect(state.shouldSave).toBe(true);
      expect(state.status).toBe('saving');
    });

    it('waits for debounce delay', () => {
      const state = getAutoSaveState(
        true,
        null,
        new Date(Date.now() - 1000), // Modified 1 second ago
        { enabled: true, interval: 30000, debounceDelay: 3000 }
      );

      expect(state.shouldSave).toBe(false);
      expect(state.status).toBe('waiting');
    });

    it('does not save when not dirty', () => {
      const state = getAutoSaveState(
        false,
        new Date(),
        new Date(),
        { enabled: true, interval: 30000, debounceDelay: 3000 }
      );

      expect(state.shouldSave).toBe(false);
      expect(state.status).toBe('idle');
    });
  });

  describe('Alert Templates', () => {
    interface AlertTemplate {
      id: string;
      name: string;
      type: string;
      priority: string;
      description: string;
      vitalsRequired: boolean;
      fields: string[];
    }

    const templates: AlertTemplate[] = [
      {
        id: 'fall-risk',
        name: 'Patient Fall',
        type: 'emergency',
        priority: 'high',
        description: 'Patient has fallen in {{location}}. {{injury_status}}',
        vitalsRequired: true,
        fields: ['location', 'injury_status', 'witness'],
      },
      {
        id: 'medication-request',
        name: 'Medication Request',
        type: 'medical',
        priority: 'medium',
        description: 'Patient requires {{medication}} for {{condition}}',
        vitalsRequired: false,
        fields: ['medication', 'condition', 'dosage'],
      },
      {
        id: 'code-blue',
        name: 'Code Blue',
        type: 'code-blue',
        priority: 'critical',
        description: 'Code Blue in {{location}}. Patient is {{status}}',
        vitalsRequired: true,
        fields: ['location', 'status'],
      },
    ];

    const applyTemplate = (templateId: string, values: Record<string, string>) => {
      const template = templates.find(t => t.id === templateId);
      if (!template) return null;

      let description = template.description;
      
      template.fields.forEach(field => {
        const value = values[field] || `[${field}]`;
        description = description.replace(`{{${field}}}`, value);
      });

      return {
        type: template.type,
        priority: template.priority,
        description,
        vitalsRequired: template.vitalsRequired,
      };
    };

    it('applies template with all values', () => {
      const result = applyTemplate('fall-risk', {
        location: 'Room 301',
        injury_status: 'Conscious but complaining of hip pain',
        witness: 'Nurse Johnson',
      });

      expect(result?.description).toBe(
        'Patient has fallen in Room 301. Conscious but complaining of hip pain'
      );
      expect(result?.priority).toBe('high');
      expect(result?.vitalsRequired).toBe(true);
    });

    it('shows placeholders for missing values', () => {
      const result = applyTemplate('medication-request', {
        medication: 'Morphine',
      });

      expect(result?.description).toBe(
        'Patient requires Morphine for [condition]'
      );
    });

    it('returns null for invalid template', () => {
      const result = applyTemplate('invalid-template', {});
      expect(result).toBeNull();
    });
  });

  describe('Submission State', () => {
    interface SubmissionState {
      status: 'idle' | 'validating' | 'submitting' | 'success' | 'error';
      errors: ValidationError[];
      attemptCount: number;
      lastAttempt: Date | null;
    }

    const canSubmit = (state: SubmissionState, formValid: boolean): boolean => {
      if (state.status === 'submitting') return false;
      if (!formValid) return false;
      if (state.attemptCount >= 3 && state.lastAttempt) {
        const cooldownPeriod = 60000; // 1 minute
        const timeSinceLastAttempt = Date.now() - state.lastAttempt.getTime();
        if (timeSinceLastAttempt < cooldownPeriod) return false;
      }
      return true;
    };

    const getSubmitButtonState = (state: SubmissionState, formValid: boolean) => {
      const canSubmitNow = canSubmit(state, formValid);

      return {
        disabled: !canSubmitNow,
        loading: state.status === 'submitting',
        text: state.status === 'submitting' ? 'Creating Alert...' : 'Create Alert',
        variant: state.errors.length > 0 ? 'danger' : 'primary',
      };
    };

    it('disables submit while submitting', () => {
      const state: SubmissionState = {
        status: 'submitting',
        errors: [],
        attemptCount: 0,
        lastAttempt: null,
      };

      expect(canSubmit(state, true)).toBe(false);
      expect(getSubmitButtonState(state, true).disabled).toBe(true);
      expect(getSubmitButtonState(state, true).loading).toBe(true);
    });

    it('enables submit when form is valid', () => {
      const state: SubmissionState = {
        status: 'idle',
        errors: [],
        attemptCount: 0,
        lastAttempt: null,
      };

      expect(canSubmit(state, true)).toBe(true);
      expect(getSubmitButtonState(state, true).disabled).toBe(false);
    });

    it('enforces cooldown after multiple attempts', () => {
      const state: SubmissionState = {
        status: 'error',
        errors: [],
        attemptCount: 3,
        lastAttempt: new Date(),
      };

      expect(canSubmit(state, true)).toBe(false);
    });
  });
});