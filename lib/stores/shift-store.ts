import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/lib/core/debug/unified-logger';

interface ShiftState {
  // Current shift data
  isOnDuty: boolean;
  shiftStartTime: Date | null;
  shiftEndTime: Date | null;
  shiftDuration: number | null; // in minutes
  
  // Handover state
  handoverNotes: string;
  handoverTo: string | null;
  activeAlertsCount: number;
  requiresHandover: boolean;
  
  // UI state
  showHandoverForm: boolean;
  isProcessing: boolean;
  error: string | null;
  
  // Actions
  setShiftStatus: (status: {
    isOnDuty: boolean;
    shiftStartTime?: Date | null;
    shiftEndTime?: Date | null;
  }) => void;
  
  setHandoverData: (data: {
    notes?: string;
    handoverTo?: string | null;
    activeAlertsCount?: number;
  }) => void;
  
  setShowHandoverForm: (show: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  calculateShiftDuration: () => void;
  clearHandoverData: () => void;
  reset: () => void;
}

const initialState = {
  isOnDuty: false,
  shiftStartTime: null,
  shiftEndTime: null,
  shiftDuration: null,
  handoverNotes: '',
  handoverTo: null,
  activeAlertsCount: 0,
  requiresHandover: false,
  showHandoverForm: false,
  isProcessing: false,
  error: null,
};

export const useShiftStore = create<ShiftState>()(
  persist(
    immer((set, get) => ({
      ...initialState,
      
      setShiftStatus: (status) => set((state) => {
        state.isOnDuty = status.isOnDuty;
        if (status.shiftStartTime !== undefined) {
          state.shiftStartTime = status.shiftStartTime;
        }
        if (status.shiftEndTime !== undefined) {
          state.shiftEndTime = status.shiftEndTime;
        }
        
        logger.healthcare.debug('Shift status updated', {
          isOnDuty: state.isOnDuty,
          shiftStartTime: state.shiftStartTime,
          shiftEndTime: state.shiftEndTime,
        });
      }),
      
      setHandoverData: (data) => set((state) => {
        if (data.notes !== undefined) {
          state.handoverNotes = data.notes;
        }
        if (data.handoverTo !== undefined) {
          state.handoverTo = data.handoverTo;
        }
        if (data.activeAlertsCount !== undefined) {
          state.activeAlertsCount = data.activeAlertsCount;
          state.requiresHandover = data.activeAlertsCount > 0;
        }
        
        logger.healthcare.debug('Handover data updated', {
          notesLength: state.handoverNotes.length,
          activeAlerts: state.activeAlertsCount,
          requiresHandover: state.requiresHandover,
        });
      }),
      
      setShowHandoverForm: (show) => set((state) => {
        state.showHandoverForm = show;
      }),
      
      setProcessing: (processing) => set((state) => {
        state.isProcessing = processing;
      }),
      
      setError: (error) => set((state) => {
        state.error = error;
        if (error) {
          logger.healthcare.error('Shift error', { error });
        }
      }),
      
      calculateShiftDuration: () => set((state) => {
        if (state.isOnDuty && state.shiftStartTime) {
          const now = new Date();
          const duration = Math.floor(
            (now.getTime() - new Date(state.shiftStartTime).getTime()) / 1000 / 60
          );
          state.shiftDuration = duration;
        } else {
          state.shiftDuration = null;
        }
      }),
      
      clearHandoverData: () => set((state) => {
        state.handoverNotes = '';
        state.handoverTo = null;
        state.showHandoverForm = false;
        state.error = null;
      }),
      
      reset: () => set(() => ({
        ...initialState,
      })),
    })),
    {
      name: 'shift-store',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
      partialize: (state) => ({
        // Only persist shift status and handover data, not UI state
        isOnDuty: state.isOnDuty,
        shiftStartTime: state.shiftStartTime,
        shiftEndTime: state.shiftEndTime,
        shiftDuration: state.shiftDuration,
        handoverNotes: state.handoverNotes,
        handoverTo: state.handoverTo,
        activeAlertsCount: state.activeAlertsCount,
        requiresHandover: state.requiresHandover,
      }),
    }
  )
);

// Selectors
export const useIsOnDuty = () => useShiftStore((state) => state.isOnDuty);
export const useShiftDuration = () => useShiftStore((state) => state.shiftDuration);
export const useHandoverState = () => useShiftStore((state) => ({
  handoverNotes: state.handoverNotes,
  handoverTo: state.handoverTo,
  activeAlertsCount: state.activeAlertsCount,
  requiresHandover: state.requiresHandover,
  showHandoverForm: state.showHandoverForm,
}));