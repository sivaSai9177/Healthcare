import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useOrganizationHospitals } from '@/hooks/healthcare/useHealthcareApi';
import { useAuth } from '@/hooks/useAuth';

export default function TestFixScreen() {
  const { user } = useAuth();
  const organizationId = user?.organizationId || '';
  
  // Test the fixed hook
  const { data, isLoading, error } = useOrganizationHospitals(organizationId, {
    enabled: !!organizationId
  });
  
  useEffect(() => {
    console.log('[TestFix] Hook state:', {
      organizationId,
      isLoading,
      hasError: !!error,
      error: error?.message,
      dataReceived: !!data,
      hospitalCount: data?.hospitals?.length || 0
    });
  }, [organizationId, isLoading, error, data]);
  
  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 100 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        TRPC Fix Test
      </Text>
      
      <Text style={{ marginBottom: 10 }}>
        Organization ID: {organizationId || 'Not set'}
      </Text>
      
      <Text style={{ marginBottom: 10 }}>
        Status: {isLoading ? 'Loading...' : error ? 'Error' : 'Success'}
      </Text>
      
      {error && (
        <Text style={{ color: 'red', marginBottom: 10 }}>
          Error: {error.message}
        </Text>
      )}
      
      {data && (
        <View>
          <Text style={{ fontWeight: 'bold', marginTop: 20 }}>
            Hospitals ({data.hospitals?.length || 0}):
          </Text>
          {data.hospitals?.map((hospital) => (
            <Text key={hospital.id} style={{ marginTop: 5 }}>
              • {hospital.name} ({hospital.code})
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}