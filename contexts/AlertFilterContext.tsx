import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from '@/lib/core/debug/logger';

interface AlertFilterState {
  searchQuery: string;
  urgencyFilter: string;
  statusFilter: string;
  departmentFilter: string;
  timeRangeFilter: string;
  sortBy: 'newest' | 'oldest' | 'urgency';
}

interface AlertFilterPreset {
  id: string;
  name: string;
  filters: Partial<AlertFilterState>;
  isDefault?: boolean;
}

interface AlertFilterContextType {
  // Current filter state
  filters: AlertFilterState;
  
  // Filter setters
  setSearchQuery: (query: string) => void;
  setUrgencyFilter: (urgency: string) => void;
  setStatusFilter: (status: string) => void;
  setDepartmentFilter: (department: string) => void;
  setTimeRangeFilter: (timeRange: string) => void;
  setSortBy: (sortBy: AlertFilterState['sortBy']) => void;
  
  // Bulk operations
  setFilters: (filters: Partial<AlertFilterState>) => void;
  resetFilters: () => void;
  
  // Preset management
  presets: AlertFilterPreset[];
  savePreset: (name: string, filters?: Partial<AlertFilterState>) => Promise<void>;
  loadPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => Promise<void>;
  setDefaultPreset: (presetId: string) => Promise<void>;
  
  // State
  isLoading: boolean;
  isDirty: boolean;
}

const STORAGE_KEY = '@alert_filters';
const PRESETS_KEY = '@alert_filter_presets';

const defaultFilters: AlertFilterState = {
  searchQuery: '',
  urgencyFilter: 'all',
  statusFilter: 'active',
  departmentFilter: 'all',
  timeRangeFilter: '24h',
  sortBy: 'newest',
};

const AlertFilterContext = createContext<AlertFilterContextType | undefined>(undefined);

export function AlertFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<AlertFilterState>(defaultFilters);
  const [presets, setPresets] = useState<AlertFilterPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  // Load filters and presets from storage
  useEffect(() => {
    loadFromStorage();
  }, []);

  // Save filters to storage when they change
  useEffect(() => {
    if (!isLoading && isDirty) {
      saveToStorage();
    }
  }, [filters, isDirty, isLoading]);

  const loadFromStorage = async () => {
    try {
      setIsLoading(true);
      
      // Load filters
      const savedFilters = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedFilters) {
        const parsed = JSON.parse(savedFilters);
        setFiltersState({ ...defaultFilters, ...parsed });
        log.debug('Loaded filters from storage', 'FILTER_CONTEXT', parsed);
      }
      
      // Load presets
      const savedPresets = await AsyncStorage.getItem(PRESETS_KEY);
      if (savedPresets) {
        const parsedPresets = JSON.parse(savedPresets);
        setPresets(parsedPresets);
        
        // Apply default preset if exists
        const defaultPreset = parsedPresets.find((p: AlertFilterPreset) => p.isDefault);
        if (defaultPreset) {
          setFiltersState({ ...defaultFilters, ...defaultPreset.filters });
        }
      }
    } catch (error) {
      log.error('Failed to load filters from storage', 'FILTER_CONTEXT', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToStorage = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
      setIsDirty(false);
      log.debug('Saved filters to storage', 'FILTER_CONTEXT', filters);
    } catch (error) {
      log.error('Failed to save filters to storage', 'FILTER_CONTEXT', error);
    }
  };

  // Filter setters
  const setSearchQuery = useCallback((query: string) => {
    setFiltersState(prev => ({ ...prev, searchQuery: query }));
    setIsDirty(true);
  }, []);

  const setUrgencyFilter = useCallback((urgency: string) => {
    setFiltersState(prev => ({ ...prev, urgencyFilter: urgency }));
    setIsDirty(true);
  }, []);

  const setStatusFilter = useCallback((status: string) => {
    setFiltersState(prev => ({ ...prev, statusFilter: status }));
    setIsDirty(true);
  }, []);

  const setDepartmentFilter = useCallback((department: string) => {
    setFiltersState(prev => ({ ...prev, departmentFilter: department }));
    setIsDirty(true);
  }, []);

  const setTimeRangeFilter = useCallback((timeRange: string) => {
    setFiltersState(prev => ({ ...prev, timeRangeFilter: timeRange }));
    setIsDirty(true);
  }, []);

  const setSortBy = useCallback((sortBy: AlertFilterState['sortBy']) => {
    setFiltersState(prev => ({ ...prev, sortBy }));
    setIsDirty(true);
  }, []);

  // Bulk operations
  const setFilters = useCallback((newFilters: Partial<AlertFilterState>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setIsDirty(true);
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setIsDirty(true);
  }, []);

  // Preset management
  const savePreset = useCallback(async (name: string, customFilters?: Partial<AlertFilterState>) => {
    try {
      const newPreset: AlertFilterPreset = {
        id: Date.now().toString(),
        name,
        filters: customFilters || filters,
      };
      
      const updatedPresets = [...presets, newPreset];
      setPresets(updatedPresets);
      
      await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(updatedPresets));
      log.info('Saved filter preset', 'FILTER_CONTEXT', { name });
    } catch (error) {
      log.error('Failed to save preset', 'FILTER_CONTEXT', error);
      throw error;
    }
  }, [filters, presets]);

  const loadPreset = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setFiltersState({ ...defaultFilters, ...preset.filters });
      setIsDirty(true);
      log.info('Loaded filter preset', 'FILTER_CONTEXT', { name: preset.name });
    }
  }, [presets]);

  const deletePreset = useCallback(async (presetId: string) => {
    try {
      const updatedPresets = presets.filter(p => p.id !== presetId);
      setPresets(updatedPresets);
      await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(updatedPresets));
      log.info('Deleted filter preset', 'FILTER_CONTEXT', { presetId });
    } catch (error) {
      log.error('Failed to delete preset', 'FILTER_CONTEXT', error);
      throw error;
    }
  }, [presets]);

  const setDefaultPreset = useCallback(async (presetId: string) => {
    try {
      const updatedPresets = presets.map(p => ({
        ...p,
        isDefault: p.id === presetId,
      }));
      setPresets(updatedPresets);
      await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(updatedPresets));
      log.info('Set default filter preset', 'FILTER_CONTEXT', { presetId });
    } catch (error) {
      log.error('Failed to set default preset', 'FILTER_CONTEXT', error);
      throw error;
    }
  }, [presets]);

  const value: AlertFilterContextType = {
    filters,
    setSearchQuery,
    setUrgencyFilter,
    setStatusFilter,
    setDepartmentFilter,
    setTimeRangeFilter,
    setSortBy,
    setFilters,
    resetFilters,
    presets,
    savePreset,
    loadPreset,
    deletePreset,
    setDefaultPreset,
    isLoading,
    isDirty,
  };

  return (
    <AlertFilterContext.Provider value={value}>
      {children}
    </AlertFilterContext.Provider>
  );
}

export function useAlertFilters() {
  const context = useContext(AlertFilterContext);
  if (!context) {
    throw new Error('useAlertFilters must be used within AlertFilterProvider');
  }
  return context;
}

// Hook for quick filter presets
export function useFilterPresets() {
  const { presets, savePreset, loadPreset, deletePreset } = useAlertFilters();
  
  // Common preset configurations
  const commonPresets = [
    {
      name: 'Critical Only',
      filters: { urgencyFilter: '1', statusFilter: 'active' },
    },
    {
      name: 'My Department',
      filters: { departmentFilter: 'current', statusFilter: 'active' },
    },
    {
      name: 'Recent Alerts',
      filters: { timeRangeFilter: '1h', sortBy: 'newest' as const },
    },
    {
      name: 'Unacknowledged',
      filters: { statusFilter: 'active', sortBy: 'urgency' as const },
    },
  ];

  const createCommonPresets = async () => {
    for (const preset of commonPresets) {
      await savePreset(preset.name, preset.filters);
    }
  };

  return {
    presets,
    commonPresets,
    createCommonPresets,
    savePreset,
    loadPreset,
    deletePreset,
  };
}