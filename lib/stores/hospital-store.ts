import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from '@/lib/core/debug/unified-logger';

export interface Hospital {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  isDefault: boolean;
  isActive: boolean;
}

interface HospitalStore {
  // Current hospital
  currentHospital: Hospital | null;
  
  // All hospitals for the current organization
  hospitals: Hospital[];
  
  // Loading state
  isLoading: boolean;
  
  // Actions
  setCurrentHospital: (hospital: Hospital | null) => void;
  setHospitals: (hospitals: Hospital[]) => void;
  selectHospital: (hospitalId: string) => void;
  clearHospitalData: () => void;
  setLoading: (loading: boolean) => void;
}

export const useHospitalStore = create<HospitalStore>()(
  persist(
    (set, get) => ({
      currentHospital: null,
      hospitals: [],
      isLoading: false,

      setCurrentHospital: (hospital) => {
        log.info('Setting current hospital', 'HOSPITAL', { 
          hospitalId: hospital?.id,
          hospitalName: hospital?.name 
        });
        set({ currentHospital: hospital });
      },

      setHospitals: (hospitals) => {
        log.info('Setting hospitals list', 'HOSPITAL', { 
          count: hospitals.length 
        });
        set({ hospitals });
        
        // If no current hospital is selected, select the default one
        const currentHospital = get().currentHospital;
        if (!currentHospital && hospitals.length > 0) {
          const defaultHospital = hospitals.find(h => h.isDefault) || hospitals[0];
          get().setCurrentHospital(defaultHospital);
        }
      },

      selectHospital: (hospitalId) => {
        const hospital = get().hospitals.find(h => h.id === hospitalId);
        if (hospital) {
          get().setCurrentHospital(hospital);
        } else {
          log.error('Hospital not found', 'HOSPITAL', { hospitalId });
        }
      },

      clearHospitalData: () => {
        log.info('Clearing hospital data', 'HOSPITAL');
        set({ 
          currentHospital: null, 
          hospitals: [],
          isLoading: false 
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'hospital-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentHospital: state.currentHospital,
      }),
    }
  )
);

// Helper hook to get current hospital with validation
export function useCurrentHospital() {
  const { currentHospital, hospitals, isLoading } = useHospitalStore();
  
  return {
    hospital: currentHospital,
    hospitals,
    isLoading,
    hasHospital: !!currentHospital,
    hospitalId: currentHospital?.id,
  };
}