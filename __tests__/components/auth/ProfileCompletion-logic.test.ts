import { describe, it, expect } from '@jest/globals';

describe('ProfileCompletion Component Logic', () => {
  describe('Profile Completion Tracking', () => {
    interface ProfileSection {
      id: string;
      label: string;
      required: boolean;
      fields: string[];
      weight: number; // Percentage weight for completion
    }

    interface ProfileData {
      // Basic Info
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      dateOfBirth?: string;
      // Professional Info
      jobTitle?: string;
      department?: string;
      employeeId?: string;
      specialization?: string;
      // Preferences
      language?: string;
      timezone?: string;
      notifications?: {
        email: boolean;
        push: boolean;
        sms: boolean;
      };
      // Avatar
      avatarUrl?: string;
    }

    const profileSections: ProfileSection[] = [
      {
        id: 'basic',
        label: 'Basic Information',
        required: true,
        fields: ['firstName', 'lastName', 'phoneNumber', 'dateOfBirth'],
        weight: 40,
      },
      {
        id: 'professional',
        label: 'Professional Details',
        required: true,
        fields: ['jobTitle', 'department', 'employeeId'],
        weight: 30,
      },
      {
        id: 'preferences',
        label: 'Preferences',
        required: false,
        fields: ['language', 'timezone', 'notifications'],
        weight: 20,
      },
      {
        id: 'avatar',
        label: 'Profile Picture',
        required: false,
        fields: ['avatarUrl'],
        weight: 10,
      },
    ];

    const calculateProfileCompletion = (profile: ProfileData) => {
      let totalCompletion = 0;
      const sectionProgress: Record<string, number> = {};
      const incompleteSections: string[] = [];

      profileSections.forEach(section => {
        const filledFields = section.fields.filter(field => {
          const value = profile[field as keyof ProfileData];
          if (field === 'notifications') {
            return value !== undefined;
          }
          return value && String(value).trim().length > 0;
        });

        const sectionCompletion = (filledFields.length / section.fields.length) * 100;
        sectionProgress[section.id] = sectionCompletion;
        
        const weightedCompletion = (sectionCompletion / 100) * section.weight;
        totalCompletion += weightedCompletion;

        if (section.required && sectionCompletion < 100) {
          incompleteSections.push(section.label);
        }
      });

      return {
        totalPercentage: Math.round(totalCompletion),
        sectionProgress,
        isComplete: incompleteSections.length === 0,
        incompleteSections,
        nextRequiredSection: incompleteSections[0],
      };
    };

    it('calculates completion percentage correctly', () => {
      const profile: ProfileData = {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-01',
        jobTitle: 'Nurse',
        department: 'Emergency',
      };

      const completion = calculateProfileCompletion(profile);
      expect(completion.sectionProgress.basic).toBe(100);
      expect(completion.sectionProgress.professional).toBeCloseTo(66.67, 1);
      expect(completion.totalPercentage).toBeGreaterThan(50);
    });

    it('identifies incomplete required sections', () => {
      const profile: ProfileData = {
        firstName: 'John',
        lastName: 'Doe',
        // Missing phone and DOB
      };

      const completion = calculateProfileCompletion(profile);
      expect(completion.isComplete).toBe(false);
      expect(completion.incompleteSections).toContain('Basic Information');
      expect(completion.incompleteSections).toContain('Professional Details');
    });

    it('marks profile complete when required sections filled', () => {
      const profile: ProfileData = {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-01',
        jobTitle: 'Doctor',
        department: 'ICU',
        employeeId: 'EMP001',
      };

      const completion = calculateProfileCompletion(profile);
      expect(completion.isComplete).toBe(true);
      expect(completion.incompleteSections).toHaveLength(0);
    });
  });

  describe('Field Validation', () => {
    interface ValidationRule {
      field: string;
      validate: (value: any) => { isValid: boolean; error?: string };
    }

    const validationRules: ValidationRule[] = [
      {
        field: 'phoneNumber',
        validate: (value) => {
          if (!value) return { isValid: false, error: 'Phone number is required' };
          const phoneRegex = /^\+?[\d\s()-]+$/;
          if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
            return { isValid: false, error: 'Invalid phone number format' };
          }
          return { isValid: true };
        },
      },
      {
        field: 'dateOfBirth',
        validate: (value) => {
          if (!value) return { isValid: false, error: 'Date of birth is required' };
          const date = new Date(value);
          const now = new Date();
          const age = now.getFullYear() - date.getFullYear();
          if (age < 18) {
            return { isValid: false, error: 'Must be at least 18 years old' };
          }
          if (age > 120) {
            return { isValid: false, error: 'Invalid date of birth' };
          }
          return { isValid: true };
        },
      },
      {
        field: 'employeeId',
        validate: (value) => {
          if (!value) return { isValid: false, error: 'Employee ID is required' };
          if (!/^[A-Z0-9-]+$/i.test(value)) {
            return { isValid: false, error: 'Employee ID can only contain letters, numbers, and hyphens' };
          }
          return { isValid: true };
        },
      },
    ];

    const validateField = (field: string, value: any) => {
      const rule = validationRules.find(r => r.field === field);
      if (!rule) return { isValid: true };
      return rule.validate(value);
    };

    it('validates phone numbers', () => {
      expect(validateField('phoneNumber', '+1 (555) 123-4567').isValid).toBe(true);
      expect(validateField('phoneNumber', '123').isValid).toBe(false);
      expect(validateField('phoneNumber', '').error).toBe('Phone number is required');
    });

    it('validates date of birth', () => {
      const validDate = new Date();
      validDate.setFullYear(validDate.getFullYear() - 25);
      expect(validateField('dateOfBirth', validDate.toISOString()).isValid).toBe(true);

      const tooYoung = new Date();
      tooYoung.setFullYear(tooYoung.getFullYear() - 15);
      const result = validateField('dateOfBirth', tooYoung.toISOString());
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Must be at least 18 years old');
    });

    it('validates employee ID format', () => {
      expect(validateField('employeeId', 'EMP-001').isValid).toBe(true);
      expect(validateField('employeeId', 'EMP_001').isValid).toBe(false);
      expect(validateField('employeeId', 'EMP@001').isValid).toBe(false);
    });
  });

  describe('Progress Indicators', () => {
    const getProgressIndicator = (percentage: number) => {
      let status: 'incomplete' | 'partial' | 'almost' | 'complete';
      let color: string;
      let icon: string;
      let message: string;

      if (percentage === 100) {
        status = 'complete';
        color = 'text-green-600';
        icon = 'check-circle';
        message = 'Profile complete!';
      } else if (percentage >= 80) {
        status = 'almost';
        color = 'text-blue-600';
        icon = 'trending-up';
        message = 'Almost there!';
      } else if (percentage >= 50) {
        status = 'partial';
        color = 'text-yellow-600';
        icon = 'clock';
        message = 'Keep going!';
      } else {
        status = 'incomplete';
        color = 'text-gray-600';
        icon = 'alert-circle';
        message = 'Get started';
      }

      return {
        percentage,
        status,
        color,
        icon,
        message,
        showConfetti: percentage === 100,
      };
    };

    it('shows correct status for different completion levels', () => {
      expect(getProgressIndicator(100).status).toBe('complete');
      expect(getProgressIndicator(85).status).toBe('almost');
      expect(getProgressIndicator(60).status).toBe('partial');
      expect(getProgressIndicator(30).status).toBe('incomplete');
    });

    it('assigns appropriate colors and icons', () => {
      const complete = getProgressIndicator(100);
      expect(complete.color).toBe('text-green-600');
      expect(complete.icon).toBe('check-circle');
      expect(complete.showConfetti).toBe(true);

      const partial = getProgressIndicator(60);
      expect(partial.color).toBe('text-yellow-600');
      expect(partial.message).toBe('Keep going!');
    });
  });

  describe('Section Navigation', () => {
    interface NavigationState {
      currentSection: number;
      completedSections: Set<number>;
      totalSections: number;
      canNavigateNext: boolean;
      canNavigatePrev: boolean;
    }

    const getNavigationState = (
      currentSection: number,
      completedSections: Set<number>,
      totalSections: number,
      requireSequential: boolean = false
    ): NavigationState => {
      const canNavigatePrev = currentSection > 0;
      let canNavigateNext = currentSection < totalSections - 1;

      if (requireSequential) {
        canNavigateNext = canNavigateNext && completedSections.has(currentSection);
      }

      return {
        currentSection,
        completedSections,
        totalSections,
        canNavigateNext,
        canNavigatePrev,
      };
    };

    const getSectionStatus = (
      sectionIndex: number,
      currentSection: number,
      completedSections: Set<number>
    ) => {
      if (completedSections.has(sectionIndex)) {
        return {
          status: 'completed',
          icon: 'check',
          clickable: true,
        };
      } else if (sectionIndex === currentSection) {
        return {
          status: 'current',
          icon: 'edit',
          clickable: true,
        };
      } else if (sectionIndex < currentSection) {
        return {
          status: 'visited',
          icon: 'circle',
          clickable: true,
        };
      } else {
        return {
          status: 'upcoming',
          icon: 'lock',
          clickable: false,
        };
      }
    };

    it('allows navigation based on completion', () => {
      const state = getNavigationState(1, new Set([0, 1]), 4, true);
      expect(state.canNavigatePrev).toBe(true);
      expect(state.canNavigateNext).toBe(true);

      const incompleteState = getNavigationState(1, new Set([0]), 4, true);
      expect(incompleteState.canNavigateNext).toBe(false);
    });

    it('determines section status correctly', () => {
      const completedSections = new Set([0, 1]);
      
      expect(getSectionStatus(0, 2, completedSections).status).toBe('completed');
      expect(getSectionStatus(2, 2, completedSections).status).toBe('current');
      expect(getSectionStatus(3, 2, completedSections).status).toBe('upcoming');
    });
  });

  describe('Auto-Save Functionality', () => {
    interface AutoSaveState {
      isDirty: boolean;
      lastSaved?: Date;
      saveInProgress: boolean;
      error?: string;
    }

    const getAutoSaveStatus = (state: AutoSaveState) => {
      if (state.saveInProgress) {
        return {
          text: 'Saving...',
          icon: 'spinner',
          color: 'text-gray-500',
        };
      }

      if (state.error) {
        return {
          text: 'Save failed',
          icon: 'x-circle',
          color: 'text-red-500',
        };
      }

      if (!state.isDirty && state.lastSaved) {
        const secondsAgo = Math.floor((Date.now() - state.lastSaved.getTime()) / 1000);
        const text = secondsAgo < 60 ? 'Saved just now' : `Saved ${Math.floor(secondsAgo / 60)}m ago`;
        return {
          text,
          icon: 'check',
          color: 'text-green-500',
        };
      }

      if (state.isDirty) {
        return {
          text: 'Unsaved changes',
          icon: 'alert-circle',
          color: 'text-yellow-500',
        };
      }

      return {
        text: 'All changes saved',
        icon: 'check',
        color: 'text-gray-500',
      };
    };

    it('shows saving status', () => {
      const status = getAutoSaveStatus({
        isDirty: true,
        saveInProgress: true,
      });
      expect(status.text).toBe('Saving...');
      expect(status.icon).toBe('spinner');
    });

    it('shows saved status with time', () => {
      const status = getAutoSaveStatus({
        isDirty: false,
        lastSaved: new Date(Date.now() - 30000), // 30 seconds ago
        saveInProgress: false,
      });
      expect(status.text).toBe('Saved just now');
      expect(status.color).toBe('text-green-500');
    });

    it('shows error status', () => {
      const status = getAutoSaveStatus({
        isDirty: true,
        saveInProgress: false,
        error: 'Network error',
      });
      expect(status.text).toBe('Save failed');
      expect(status.color).toBe('text-red-500');
    });
  });

  describe('Completion Rewards', () => {
    interface CompletionReward {
      type: 'badge' | 'feature' | 'bonus';
      title: string;
      description: string;
      icon: string;
      unlocked: boolean;
    }

    const getAvailableRewards = (completionPercentage: number): CompletionReward[] => {
      const rewards: CompletionReward[] = [
        {
          type: 'badge',
          title: 'Getting Started',
          description: 'Complete basic information',
          icon: 'star',
          unlocked: completionPercentage >= 40,
        },
        {
          type: 'feature',
          title: 'Custom Dashboard',
          description: 'Unlock personalized dashboard',
          icon: 'layout',
          unlocked: completionPercentage >= 70,
        },
        {
          type: 'badge',
          title: 'Profile Pro',
          description: 'Complete your entire profile',
          icon: 'award',
          unlocked: completionPercentage === 100,
        },
        {
          type: 'bonus',
          title: 'Early Bird',
          description: 'Complete profile within 24 hours',
          icon: 'clock',
          unlocked: false, // Would check registration time
        },
      ];

      return rewards;
    };

    it('unlocks rewards based on completion', () => {
      const rewards50 = getAvailableRewards(50);
      expect(rewards50.filter(r => r.unlocked)).toHaveLength(1);
      expect(rewards50.find(r => r.title === 'Getting Started')?.unlocked).toBe(true);

      const rewards100 = getAvailableRewards(100);
      expect(rewards100.filter(r => r.unlocked)).toHaveLength(3);
      expect(rewards100.find(r => r.title === 'Profile Pro')?.unlocked).toBe(true);
    });
  });
});