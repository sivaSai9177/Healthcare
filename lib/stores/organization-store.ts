import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { api } from '@/lib/api/trpc';
import { getModuleLogger } from '@/lib/core/debug/window-logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

const logger = getModuleLogger('organization-store');

interface Organization {
  id: string;
  name: string;
  type: string;
  plan?: string;
  role?: string; // User's role in this organization
}

interface OrganizationState {
  // Current active organization
  activeOrganization: Organization | null;
  
  // All user's organizations
  organizations: Organization[];
  
  // Loading states
  isLoading: boolean;
  isJoining: boolean;
  isSwitching: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  setActiveOrganization: (org: Organization | null) => void;
  setOrganizations: (orgs: Organization[]) => void;
  switchOrganization: (organizationId: string) => Promise<void>;
  joinByCode: (code: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
  clearOrganizations: () => void;
  
  // Internal actions
  _setLoading: (loading: boolean) => void;
  _setJoining: (joining: boolean) => void;
  _setSwitching: (switching: boolean) => void;
  _setError: (error: string | null) => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    immer((set, get) => ({
      // State
      activeOrganization: null,
      organizations: [],
      isLoading: false,
      isJoining: false,
      isSwitching: false,
      error: null,
      
      // Actions
      setActiveOrganization: (org) =>
        set((state) => {
          state.activeOrganization = org;
          logger.info('Active organization set', { organizationId: org?.id });
        }),
      
      setOrganizations: (orgs) =>
        set((state) => {
          state.organizations = orgs;
          logger.info('Organizations updated', { count: orgs.length });
        }),
      
      switchOrganization: async (organizationId) => {
        logger.warn('switchOrganization must be called through useSwitchOrganization hook');
        throw new Error('Use useSwitchOrganization hook instead');
      },
      
      joinByCode: async (code) => {
        logger.warn('joinByCode must be called through useJoinOrganization hook');
        throw new Error('Use useJoinOrganization hook instead');
      },
      
      refreshOrganizations: async () => {
        logger.warn('refreshOrganizations must be called through useRefreshOrganizations hook');
        throw new Error('Use useRefreshOrganizations hook instead');
      },
      
      clearOrganizations: () =>
        set((state) => {
          state.activeOrganization = null;
          state.organizations = [];
          state.error = null;
          logger.info('Organizations cleared');
        }),
      
      // Internal actions
      _setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),
      
      _setJoining: (joining) =>
        set((state) => {
          state.isJoining = joining;
        }),
      
      _setSwitching: (switching) =>
        set((state) => {
          state.isSwitching = switching;
        }),
      
      _setError: (error) =>
        set((state) => {
          state.error = error;
        }),
    })),
    {
      name: 'organization-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeOrganization: state.activeOrganization,
        organizations: state.organizations,
      }),
    }
  )
);

// Helper hooks
export const useActiveOrganization = () => {
  const activeOrganization = useOrganizationStore((state) => state.activeOrganization);
  const isLoading = useOrganizationStore((state) => state.isLoading);
  return { organization: activeOrganization, isLoading };
};

export const useHasOrganization = () => {
  const organizations = useOrganizationStore((state) => state.organizations);
  const isLoading = useOrganizationStore((state) => state.isLoading);
  return {
    hasOrganization: organizations.length > 0,
    isLoading,
  };
};

// Hooks that use tRPC context
export const useSwitchOrganization = () => {
  const utils = api.useUtils();
  const { organizations, setActiveOrganization, _setSwitching, _setError } = useOrganizationStore();
  
  const mutation = api.organization.setActiveOrganization.useMutation({
    onMutate: async ({ organizationId }) => {
      _setSwitching(true);
      _setError(null);
      
      // Optimistically update
      const org = organizations.find((o) => o.id === organizationId);
      if (org) {
        setActiveOrganization(org);
      }
    },
    onSuccess: (data) => {
      logger.info('Organization switched successfully', { organizationId: data.organizationId });
      // Invalidate relevant queries
      utils.organization.listUserOrganizations.invalidate();
    },
    onError: (error, variables, context) => {
      // Revert on error
      const previousOrg = organizations.find((o) => o.id === context);
      if (previousOrg) {
        setActiveOrganization(previousOrg);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch organization';
      _setError(errorMessage);
      logger.error('Failed to switch organization', error);
    },
    onSettled: () => {
      _setSwitching(false);
    },
  });
  
  return mutation;
};

export const useJoinOrganization = () => {
  const utils = api.useUtils();
  const { _setJoining, _setError } = useOrganizationStore();
  
  const mutation = api.organization.joinByCode.useMutation({
    onMutate: () => {
      _setJoining(true);
      _setError(null);
    },
    onSuccess: (data) => {
      logger.info('Joined organization successfully', { organizationId: data.organizationId });
      // Invalidate and refetch organizations
      utils.organization.listUserOrganizations.invalidate();
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join organization';
      _setError(errorMessage);
      logger.error('Failed to join organization', error);
    },
    onSettled: () => {
      _setJoining(false);
    },
  });
  
  return mutation;
};

export const useRefreshOrganizations = () => {
  const { setOrganizations, setActiveOrganization, _setLoading, _setError } = useOrganizationStore();
  
  return api.organization.listUserOrganizations.useQuery({}, {
    onSuccess: (data) => {
      setOrganizations(data.organizations);
      
      // Set active organization
      if (data.activeOrganizationId) {
        const active = data.organizations.find((org: Organization) => org.id === data.activeOrganizationId);
        if (active) {
          setActiveOrganization(active);
        }
      } else if (data.organizations.length > 0) {
        // Default to first organization if no active set
        setActiveOrganization(data.organizations[0]);
      }
      
      logger.info('Organizations refreshed', { count: data.organizations.length });
      _setLoading(false);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch organizations';
      _setError(errorMessage);
      logger.error('Failed to refresh organizations', error);
      _setLoading(false);
    },
    onSettled: () => {
      _setLoading(false);
    },
  });
};

// Sync organizations with TanStack Query
export const useOrganizationSync = (user: any, isAuthenticated: boolean) => {
  // Use TanStack Query to sync organizations
  api.organization.listUserOrganizations.useQuery({}, {
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    
    onSuccess: (data) => {
      // Update store with fetched data
      const store = useOrganizationStore.getState();
      store.setOrganizations(data.organizations);
      
      // Set active organization based on user's organizationId or server response
      if (data.activeOrganizationId) {
        const active = data.organizations.find((org: Organization) => org.id === data.activeOrganizationId);
        if (active) {
          store.setActiveOrganization(active);
        }
      } else if (user?.organizationId) {
        const userOrg = data.organizations.find((org: Organization) => org.id === user.organizationId);
        if (userOrg) {
          store.setActiveOrganization(userOrg);
        }
      } else if (data.organizations.length > 0 && !store.activeOrganization) {
        // Default to first organization if none selected
        store.setActiveOrganization(data.organizations[0]);
      }
      
      store._setLoading(false);
    },
    
    onError: (error) => {
      logger.error('Failed to sync organizations', error);
      const store = useOrganizationStore.getState();
      
      // Clear organizations on auth error
      if (error.data?.code === 'UNAUTHORIZED') {
        store.clearOrganizations();
      }
      
      store._setLoading(false);
    },
    
    onSettled: () => {
      // Always set loading to false when query settles
      const store = useOrganizationStore.getState();
      store._setLoading(false);
    },
  });
  
  // Handle logout - use getState to avoid render-time state updates
  if (!isAuthenticated || !user) {
    const store = useOrganizationStore.getState();
    if (store.organizations.length > 0 || store.activeOrganization) {
      store.clearOrganizations();
    }
  }
};