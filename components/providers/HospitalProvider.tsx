import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActiveOrganization } from '@/lib/stores/organization-store';
import { useHospitalStore } from '@/lib/stores/hospital-store';
import { api } from '@/lib/api/trpc';
import { log } from '@/lib/core/debug/unified-logger';

export function HospitalProvider({ children }: { children: React.ReactNode }) {
  const { user, isRefreshing } = useAuth();
  const { organization } = useActiveOrganization();
  const { 
    setHospitals, 
    setCurrentHospital, 
    clearHospitalData,
    setLoading 
  } = useHospitalStore();

  // Fetch hospitals when organization changes
  const { data: hospitalsData, isLoading, error } = api.healthcare.getOrganizationHospitals.useQuery(
    { organizationId: organization?.id || '' },
    { 
      enabled: !!organization?.id && !!user?.id,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Update hospital store when data changes
  useEffect(() => {
    if (hospitalsData?.hospitals) {
      setHospitals(hospitalsData.hospitals);
      
      // If user has a default hospital, select it
      if (user?.defaultHospitalId) {
        const defaultHospital = hospitalsData.hospitals.find(
          h => h.id === user.defaultHospitalId
        );
        if (defaultHospital) {
          setCurrentHospital(defaultHospital);
        }
      }
    }
  }, [hospitalsData, user?.defaultHospitalId, setHospitals, setCurrentHospital]);

  // Clear hospital data when user logs out or organization changes
  useEffect(() => {
    if (!user || !organization) {
      clearHospitalData();
    }
  }, [user, organization, clearHospitalData]);

  // Update loading state
  useEffect(() => {
    setLoading(isLoading || isRefreshing);
  }, [isLoading, isRefreshing, setLoading]);

  // Log errors
  useEffect(() => {
    if (error) {
      log.error('Failed to fetch hospitals', 'HOSPITAL', error);
    }
  }, [error]);

  return <>{children}</>;
}