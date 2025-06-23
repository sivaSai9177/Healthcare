import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DepartmentType, Gender } from '@/types/healthcare';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PatientFormData {
  // Basic Information (Step 1)
  name: string;
  dateOfBirth: Date | null;
  gender: Gender | null;
  bloodGroup: string;
  department: DepartmentType | null;
  
  // Contact Information (Step 2)
  phoneNumber: string;
  email: string;
  address: string;
  
  // Emergency Contact (Step 2)
  emergencyContact: {
    name: string;
    phoneNumber: string;
    relationship: string;
  };
  
  // Medical Information (Optional fields for future)
  allergies?: string;
  medicalHistory?: string;
  currentMedications?: string;
}

interface PatientFormStore {
  // Form data
  formData: PatientFormData;
  
  // Stepper state
  currentStep: number;
  completedSteps: Set<number>;
  
  // Validation errors
  errors: Record<string, string>;
  
  // Form actions
  updateField: <K extends keyof PatientFormData>(field: K, value: PatientFormData[K]) => void;
  updateEmergencyContact: <K extends keyof PatientFormData['emergencyContact']>(
    field: K, 
    value: PatientFormData['emergencyContact'][K]
  ) => void;
  
  // Step actions
  setCurrentStep: (step: number) => void;
  markStepCompleted: (step: number) => void;
  markStepIncomplete: (step: number) => void;
  
  // Validation actions
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearAllErrors: () => void;
  
  // Form lifecycle
  resetForm: () => void;
  isFormValid: () => boolean;
}

const initialFormData: PatientFormData = {
  name: '',
  dateOfBirth: null,
  gender: null,
  bloodGroup: '',
  department: null,
  phoneNumber: '',
  email: '',
  address: '',
  emergencyContact: {
    name: '',
    phoneNumber: '',
    relationship: '',
  },
};

export const usePatientFormStore = create<PatientFormStore>()(
  persist(
    (set, get) => ({
      formData: initialFormData,
      currentStep: 0,
      completedSteps: new Set<number>(),
      errors: {},
      
      updateField: (field, value) => {
        set((state) => ({
          formData: {
            ...state.formData,
            [field]: value,
          },
        }));
        
        // Clear error when field is updated
        get().clearError(field as string);
      },
      
      updateEmergencyContact: (field, value) => {
        set((state) => ({
          formData: {
            ...state.formData,
            emergencyContact: {
              ...state.formData.emergencyContact,
              [field]: value,
            },
          },
        }));
        
        // Clear error when field is updated
        get().clearError(`emergencyContact.${field}`);
      },
      
      setCurrentStep: (step) => {
        set({ currentStep: step });
      },
      
      markStepCompleted: (step) => {
        set((state) => ({
          completedSteps: new Set([...state.completedSteps, step]),
        }));
      },
      
      markStepIncomplete: (step) => {
        set((state) => {
          const newCompleted = new Set(state.completedSteps);
          newCompleted.delete(step);
          return { completedSteps: newCompleted };
        });
      },
      
      setError: (field, error) => {
        set((state) => ({
          errors: {
            ...state.errors,
            [field]: error,
          },
        }));
      },
      
      clearError: (field) => {
        set((state) => {
          const newErrors = { ...state.errors };
          delete newErrors[field];
          return { errors: newErrors };
        });
      },
      
      clearAllErrors: () => {
        set({ errors: {} });
      },
      
      resetForm: () => {
        set({
          formData: initialFormData,
          currentStep: 0,
          completedSteps: new Set<number>(),
          errors: {},
        });
      },
      
      isFormValid: () => {
        const { formData } = get();
        
        // Step 1 validation
        const step1Valid = 
          formData.name.trim() !== '' &&
          formData.dateOfBirth !== null &&
          formData.gender !== null &&
          formData.department !== null;
          
        // Step 2 validation
        const step2Valid = 
          formData.phoneNumber.trim() !== '' &&
          formData.address.trim() !== '' &&
          formData.emergencyContact.name.trim() !== '' &&
          formData.emergencyContact.phoneNumber.trim() !== '';
          
        return step1Valid && step2Valid;
      },
    }),
    {
      name: 'patient-form-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          if (!value) return null;
          
          // Parse the stored value and handle Set serialization
          const parsed = JSON.parse(value);
          if (parsed.state?.completedSteps) {
            parsed.state.completedSteps = new Set(parsed.state.completedSteps);
          }
          
          // Convert dateOfBirth string back to Date object
          if (parsed.state?.formData?.dateOfBirth) {
            parsed.state.formData.dateOfBirth = new Date(parsed.state.formData.dateOfBirth);
          }
          
          return parsed;
        },
        setItem: async (name, value) => {
          // Convert Set to Array for serialization
          const state = value.state;
          if (state?.completedSteps instanceof Set) {
            state.completedSteps = Array.from(state.completedSteps);
          }
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
      partialize: (state) => ({
        formData: state.formData,
        currentStep: state.currentStep,
        completedSteps: Array.from(state.completedSteps),
      }),
    }
  )
);

// Selectors for common use cases
export const usePatientFormData = () => usePatientFormStore((state) => state.formData);

// Individual action selectors to prevent re-renders
export const useUpdateField = () => usePatientFormStore((state) => state.updateField);
export const useUpdateEmergencyContact = () => usePatientFormStore((state) => state.updateEmergencyContact);
export const useResetForm = () => usePatientFormStore((state) => state.resetForm);

// Step selectors
export const useCurrentStep = () => usePatientFormStore((state) => state.currentStep);
export const useSetCurrentStep = () => usePatientFormStore((state) => state.setCurrentStep);
export const useCompletedSteps = () => usePatientFormStore((state) => state.completedSteps);
export const useMarkStepCompleted = () => usePatientFormStore((state) => state.markStepCompleted);

// Validation selectors
export const useFormErrors = () => usePatientFormStore((state) => state.errors);
export const useSetError = () => usePatientFormStore((state) => state.setError);
export const useClearError = () => usePatientFormStore((state) => state.clearError);
export const useClearAllErrors = () => usePatientFormStore((state) => state.clearAllErrors);
export const useIsFormValid = () => usePatientFormStore((state) => state.isFormValid);

// Combined selectors using shallow comparison
export const usePatientFormActions = () => {
  const updateField = useUpdateField();
  const updateEmergencyContact = useUpdateEmergencyContact();
  const resetForm = useResetForm();
  
  return React.useMemo(
    () => ({ updateField, updateEmergencyContact, resetForm }),
    [updateField, updateEmergencyContact, resetForm]
  );
};

export const usePatientFormStep = () => {
  const currentStep = useCurrentStep();
  const setCurrentStep = useSetCurrentStep();
  const completedSteps = useCompletedSteps();
  const markStepCompleted = useMarkStepCompleted();
  
  return React.useMemo(
    () => ({ currentStep, setCurrentStep, completedSteps, markStepCompleted }),
    [currentStep, setCurrentStep, completedSteps, markStepCompleted]
  );
};

export const usePatientFormValidation = () => {
  const errors = useFormErrors();
  const setError = useSetError();
  const clearError = useClearError();
  const clearAllErrors = useClearAllErrors();
  const isFormValid = useIsFormValid();
  
  return React.useMemo(
    () => ({ errors, setError, clearError, clearAllErrors, isFormValid }),
    [errors, setError, clearError, clearAllErrors, isFormValid]
  );
};