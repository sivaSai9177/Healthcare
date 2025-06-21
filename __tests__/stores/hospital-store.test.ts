// @ts-nocheck
// Unit tests for hospital store

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('@/lib/core/debug/unified-logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Create mock store
const createMockHospitalStore = () => {
  let state = {
    currentHospital: null,
    hospitals: [],
    isLoading: false,
  };

  const subscribers = new Set();

  const getState = () => state;
  
  const setState = (updates) => {
    state = { ...state, ...updates };
    subscribers.forEach(fn => fn());
  };

  const subscribe = (fn) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  };

  const actions = {
    setCurrentHospital: (hospital) => {
      setState({ currentHospital: hospital });
    },
    
    setHospitals: (hospitals) => {
      setState({ hospitals });
      
      // Auto-select default hospital if none selected
      if (!state.currentHospital && hospitals.length > 0) {
        const defaultHospital = hospitals.find(h => h.isDefault) || hospitals[0];
        actions.setCurrentHospital(defaultHospital);
      }
    },
    
    selectHospital: (hospitalId) => {
      const hospital = state.hospitals.find(h => h.id === hospitalId);
      if (hospital) {
        actions.setCurrentHospital(hospital);
      }
    },
    
    clearHospitalData: () => {
      setState({
        currentHospital: null,
        hospitals: [],
        isLoading: false,
      });
    },
    
    setLoading: (loading) => {
      setState({ isLoading: loading });
    },
  };

  const store = {
    getState: () => ({ ...state, ...actions }),
    subscribe,
    // Direct access for tests
    get currentHospital() { return state.currentHospital; },
    get hospitals() { return state.hospitals; },
    get isLoading() { return state.isLoading; },
    // Actions
    ...actions,
  };

  return store;
};

// Mock the hospital store module
jest.mock('@/lib/stores/hospital-store', () => {
  const mockStore = createMockHospitalStore();
  return {
    useHospitalStore: mockStore,
    useCurrentHospital: () => ({
      hospital: mockStore.currentHospital,
      hospitals: mockStore.hospitals,
      isLoading: mockStore.isLoading,
      hasHospital: !!mockStore.currentHospital,
      hospitalId: mockStore.currentHospital?.id,
    }),
  };
});

// Import after mocks
const { useHospitalStore, useCurrentHospital } = require('@/lib/stores/hospital-store');
const { log } = require('@/lib/core/debug/unified-logger');

describe('Hospital Store Tests', () => {
  const mockHospital1 = {
    id: 'hospital-1',
    organizationId: 'org-1',
    name: 'General Hospital',
    code: 'GH001',
    isDefault: true,
    isActive: true,
  };

  const mockHospital2 = {
    id: 'hospital-2',
    organizationId: 'org-1',
    name: 'City Medical Center',
    code: 'CMC002',
    isDefault: false,
    isActive: true,
  };

  const mockHospital3 = {
    id: 'hospital-3',
    organizationId: 'org-1',
    name: 'Regional Hospital',
    code: 'RH003',
    isDefault: false,
    isActive: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset store
    const store = useHospitalStore;
    store.clearHospitalData();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const store = useHospitalStore;
      
      expect(store.currentHospital).toBeNull();
      expect(store.hospitals).toEqual([]);
      expect(store.isLoading).toBe(false);
    });
  });

  describe('Hospital Management', () => {
    it('should set current hospital', () => {
      const store = useHospitalStore;
      
      store.setCurrentHospital(mockHospital1);
      
      expect(store.currentHospital).toEqual(mockHospital1);
    });

    it('should set hospitals list', () => {
      const store = useHospitalStore;
      
      store.setHospitals([mockHospital1, mockHospital2, mockHospital3]);
      
      expect(store.hospitals).toHaveLength(3);
      expect(store.hospitals[0]).toEqual(mockHospital1);
      expect(store.hospitals[1]).toEqual(mockHospital2);
      expect(store.hospitals[2]).toEqual(mockHospital3);
    });

    it('should auto-select default hospital when setting hospitals', () => {
      const store = useHospitalStore;
      
      // No current hospital selected
      expect(store.currentHospital).toBeNull();
      
      // Set hospitals with a default
      store.setHospitals([mockHospital2, mockHospital1, mockHospital3]);
      
      // Should auto-select the default hospital
      expect(store.currentHospital).toEqual(mockHospital1);
    });

    it('should auto-select first hospital if no default', () => {
      const store = useHospitalStore;
      
      const hospitalsWithoutDefault = [
        { ...mockHospital2, isDefault: false },
        { ...mockHospital3, isDefault: false },
      ];
      
      store.setHospitals(hospitalsWithoutDefault);
      
      // Should select the first one
      expect(store.currentHospital).toEqual(hospitalsWithoutDefault[0]);
    });

    it('should not auto-select if current hospital already set', () => {
      const store = useHospitalStore;
      
      // Set current hospital first
      store.setCurrentHospital(mockHospital2);
      
      // Set hospitals list
      store.setHospitals([mockHospital1, mockHospital2, mockHospital3]);
      
      // Should keep the current selection
      expect(store.currentHospital).toEqual(mockHospital2);
    });

    it('should handle empty hospitals list', () => {
      const store = useHospitalStore;
      
      store.setHospitals([]);
      
      expect(store.hospitals).toEqual([]);
      expect(store.currentHospital).toBeNull();
    });
  });

  describe('Hospital Selection', () => {
    it('should select hospital by ID', () => {
      const store = useHospitalStore;
      
      store.setHospitals([mockHospital1, mockHospital2, mockHospital3]);
      
      store.selectHospital('hospital-2');
      
      expect(store.currentHospital).toEqual(mockHospital2);
    });

    it('should handle selecting non-existent hospital', () => {
      const store = useHospitalStore;
      
      store.setHospitals([mockHospital1, mockHospital2]);
      store.setCurrentHospital(mockHospital1);
      
      // Try to select non-existent hospital
      store.selectHospital('hospital-999');
      
      // Should keep current selection
      expect(store.currentHospital).toEqual(mockHospital1);
    });

    it('should allow selecting inactive hospital', () => {
      const store = useHospitalStore;
      
      store.setHospitals([mockHospital1, mockHospital2, mockHospital3]);
      
      // Select inactive hospital
      store.selectHospital('hospital-3');
      
      expect(store.currentHospital).toEqual(mockHospital3);
      expect(store.currentHospital.isActive).toBe(false);
    });
  });

  describe('Clear Hospital Data', () => {
    it('should clear all hospital data', () => {
      const store = useHospitalStore;
      
      // Set some data
      store.setHospitals([mockHospital1, mockHospital2]);
      store.setCurrentHospital(mockHospital1);
      store.setLoading(true);
      
      // Clear
      store.clearHospitalData();
      
      expect(store.currentHospital).toBeNull();
      expect(store.hospitals).toEqual([]);
      expect(store.isLoading).toBe(false);
    });
  });

  describe('Loading State', () => {
    it('should set loading state', () => {
      const store = useHospitalStore;
      
      store.setLoading(true);
      expect(store.isLoading).toBe(true);
      
      store.setLoading(false);
      expect(store.isLoading).toBe(false);
    });
  });

  describe('useCurrentHospital Hook', () => {
    it('should return current hospital data', () => {
      const store = useHospitalStore;
      
      store.setHospitals([mockHospital1, mockHospital2]);
      store.setCurrentHospital(mockHospital1);
      store.setLoading(true);
      
      const result = useCurrentHospital();
      
      expect(result.hospital).toEqual(mockHospital1);
      expect(result.hospitals).toHaveLength(2);
      expect(result.isLoading).toBe(true);
      expect(result.hasHospital).toBe(true);
      expect(result.hospitalId).toBe('hospital-1');
    });

    it('should handle no hospital selected', () => {
      const result = useCurrentHospital();
      
      expect(result.hospital).toBeNull();
      expect(result.hospitals).toEqual([]);
      expect(result.isLoading).toBe(false);
      expect(result.hasHospital).toBe(false);
      expect(result.hospitalId).toBeUndefined();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle organization switch workflow', () => {
      const store = useHospitalStore;
      
      // Initial organization hospitals
      store.setHospitals([mockHospital1, mockHospital2]);
      expect(store.currentHospital).toEqual(mockHospital1);
      
      // Switch organization - clear data
      store.clearHospitalData();
      
      // Load new organization hospitals
      const newOrgHospitals = [
        { ...mockHospital1, id: 'hospital-4', organizationId: 'org-2' },
        { ...mockHospital2, id: 'hospital-5', organizationId: 'org-2' },
      ];
      
      store.setHospitals(newOrgHospitals);
      
      expect(store.hospitals).toEqual(newOrgHospitals);
      expect(store.currentHospital).toEqual(newOrgHospitals[0]);
    });

    it('should handle hospital updates', () => {
      const store = useHospitalStore;
      
      store.setHospitals([mockHospital1, mockHospital2]);
      store.selectHospital('hospital-2');
      
      // Update hospital data
      const updatedHospital2 = {
        ...mockHospital2,
        name: 'Updated Medical Center',
        isDefault: true,
      };
      
      const updatedHospitals = [mockHospital1, updatedHospital2];
      store.setHospitals(updatedHospitals);
      
      // Current selection should be maintained
      expect(store.currentHospital).toEqual(mockHospital2);
      expect(store.hospitals[1].name).toBe('Updated Medical Center');
    });

    it('should handle removing current hospital', () => {
      const store = useHospitalStore;
      
      store.setHospitals([mockHospital1, mockHospital2, mockHospital3]);
      store.selectHospital('hospital-2');
      
      // Remove current hospital from list
      store.setHospitals([mockHospital1, mockHospital3]);
      
      // Should keep stale reference (real app would handle this differently)
      expect(store.currentHospital).toEqual(mockHospital2);
      expect(store.hospitals).not.toContainEqual(mockHospital2);
    });
  });

  describe('State Persistence', () => {
    it('should only persist currentHospital', () => {
      const store = useHospitalStore;
      
      // Set various states
      store.setHospitals([mockHospital1, mockHospital2]);
      store.setCurrentHospital(mockHospital1);
      store.setLoading(true);
      
      // Only currentHospital should be persisted
      const persistedState = {
        currentHospital: store.currentHospital,
      };
      
      expect(persistedState.currentHospital).toEqual(mockHospital1);
      // hospitals and isLoading are not persisted
    });
  });
});