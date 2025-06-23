import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/lib/core/debug/unified-logger';

export interface Patient {
  id: string;
  hospitalId: string;
  medicalRecordNumber: string;
  name: string;
  dateOfBirth: Date | string;
  gender: 'male' | 'female' | 'other';
  roomNumber: string;
  department: string;
  admissionDate: Date | string;
  dischargeDate?: Date | string | null;
  status: 'admitted' | 'discharged' | 'transferred' | 'deceased';
  primaryDoctorId?: string | null;
  assignedNurseId?: string | null;
  condition?: string | null;
  diagnosis?: string | null;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  } | null;
  medicalNotes?: string | null;
}

interface PatientFilters {
  department?: string;
  status?: 'admitted' | 'discharged' | 'all';
  searchQuery?: string;
  assignedToMe?: boolean;
}

interface PatientStore {
  // Selected patient for detail view
  selectedPatient: Patient | null;
  
  // Recent patients accessed (for quick access)
  recentPatients: Patient[];
  
  // Active filters
  filters: PatientFilters;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSelectedPatient: (patient: Patient | null) => void;
  addRecentPatient: (patient: Patient) => void;
  updateFilters: (filters: Partial<PatientFilters>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearPatientData: () => void;
}

const MAX_RECENT_PATIENTS = 10;

const initialState = {
  selectedPatient: null,
  recentPatients: [],
  filters: {
    status: 'admitted' as const,
  },
  isLoading: false,
  error: null,
};

export const usePatientStore = create<PatientStore>()(
  persist(
    immer((set, get) => ({
      ...initialState,
      
      setSelectedPatient: (patient) => set((state) => {
        state.selectedPatient = patient;
        if (patient) {
          logger.healthcare.debug('Patient selected', {
            patientId: patient.id,
            mrn: patient.medicalRecordNumber,
            name: patient.name,
          });
        }
      }),
      
      addRecentPatient: (patient) => set((state) => {
        // Remove if already exists
        const filtered = state.recentPatients.filter(p => p.id !== patient.id);
        
        // Add to beginning
        state.recentPatients = [patient, ...filtered].slice(0, MAX_RECENT_PATIENTS);
        
        logger.healthcare.debug('Added to recent patients', {
          patientId: patient.id,
          totalRecent: state.recentPatients.length,
        });
      }),
      
      updateFilters: (filters) => set((state) => {
        state.filters = { ...state.filters, ...filters };
        logger.healthcare.debug('Patient filters updated', state.filters);
      }),
      
      clearFilters: () => set((state) => {
        state.filters = { status: 'admitted' };
        logger.healthcare.debug('Patient filters cleared');
      }),
      
      setLoading: (loading) => set((state) => {
        state.isLoading = loading;
      }),
      
      setError: (error) => set((state) => {
        state.error = error;
        if (error) {
          logger.healthcare.error('Patient store error', { error });
        }
      }),
      
      clearPatientData: () => set(() => {
        logger.healthcare.info('Clearing patient data');
        return {
          ...initialState,
        };
      }),
    })),
    {
      name: 'patient-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist recent patients and filters
        recentPatients: state.recentPatients.slice(0, 5), // Only keep 5 for persistence
        filters: state.filters,
      }),
    }
  )
);

// Selectors
export const useSelectedPatient = () => usePatientStore((state) => state.selectedPatient);
export const useRecentPatients = () => usePatientStore((state) => state.recentPatients);
export const usePatientFilters = () => usePatientStore((state) => state.filters);

// Helper hook for patient search
export function usePatientSearch(patients: Patient[]) {
  const { filters } = usePatientStore();
  const React = require('react');
  
  return React.useMemo(() => {
    let filtered = patients;
    
    // Filter by status
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    
    // Filter by department
    if (filters.department) {
      filtered = filtered.filter(p => p.department === filters.department);
    }
    
    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.roomNumber.toLowerCase().includes(query) ||
        p.medicalRecordNumber.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [patients, filters]);
}