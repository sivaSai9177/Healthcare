import React, { useEffect, useState } from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '@/components/universal/typography';
import { VStack, HStack } from '@/components/universal/layout';
import { Card } from '@/components/universal/display';
import { Symbol } from '@/components/universal/display/Symbols';
import { api } from '@/lib/api/trpc';
import { useSpacing } from '@/lib/stores/spacing-store';
import { haptic } from '@/lib/ui/haptics';
import { log } from '@/lib/core/debug/unified-logger';
import Animated, { FadeIn } from 'react-native-reanimated';

interface HospitalSelectorProps {
  organizationId: string;
  value?: string;
  onChange: (hospitalId: string) => void;
  error?: string;
  disabled?: boolean;
}

const AnimatedView = Animated.View;

export function HospitalSelector({ 
  organizationId, 
  value, 
  onChange, 
  error,
  disabled = false 
}: HospitalSelectorProps) {
  const { spacing } = useSpacing();
  const [selectedHospitalId, setSelectedHospitalId] = useState(value);

  // Fetch hospitals for the organization
  const { data: hospitalsData, isLoading, error: fetchError } = api.healthcare.getOrganizationHospitals.useQuery(
    { organizationId },
    { 
      enabled: !!organizationId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const hospitals = hospitalsData?.hospitals || [];
  const defaultHospitalId = hospitalsData?.defaultHospitalId;

  // Set default hospital if no selection
  useEffect(() => {
    if (!selectedHospitalId && defaultHospitalId) {
      setSelectedHospitalId(defaultHospitalId);
      onChange(defaultHospitalId);
    }
  }, [defaultHospitalId, selectedHospitalId, onChange]);

  // Update local state when value prop changes
  useEffect(() => {
    if (value !== selectedHospitalId) {
      setSelectedHospitalId(value);
    }
  }, [value, selectedHospitalId]);

  const handleSelect = (hospitalId: string) => {
    if (disabled) return;
    
    haptic('selection');
    setSelectedHospitalId(hospitalId);
    onChange(hospitalId);
    
    log.info('Hospital selected', 'HEALTHCARE', {
      hospitalId,
      organizationId,
    });
  };

  if (isLoading) {
    return (
      <VStack gap={spacing[2] as any}>
        <HStack gap={spacing[2] as any} alignItems="center">
          <Symbol name="building" size={20} className="text-primary" />
          <Text size="sm" weight="medium">Select Hospital</Text>
        </HStack>
        <Card className="p-4">
          <HStack justifyContent="center" alignItems="center">
            <ActivityIndicator size="small" />
            <Text size="sm" colorTheme="mutedForeground" className="ml-2">
              Loading hospitals...
            </Text>
          </HStack>
        </Card>
      </VStack>
    );
  }

  if (fetchError) {
    return (
      <VStack gap={spacing[2] as any}>
        <HStack gap={spacing[2] as any} alignItems="center">
          <Symbol name="building" size={20} className="text-destructive" />
          <Text size="sm" weight="medium">Select Hospital</Text>
        </HStack>
        <Card className="p-4 border-destructive">
          <Text size="sm" className="text-destructive">
            Failed to load hospitals. Please try again.
          </Text>
        </Card>
      </VStack>
    );
  }

  if (hospitals.length === 0) {
    return (
      <VStack gap={spacing[2] as any}>
        <HStack gap={spacing[2] as any} alignItems="center">
          <Symbol name="building" size={20} className="text-warning" />
          <Text size="sm" weight="medium">Select Hospital</Text>
        </HStack>
        <Card className="p-4 border-warning">
          <VStack gap={spacing[2] as any} alignItems="center">
            <Text size="sm" className="text-warning text-center">
              No hospitals found for this organization.
            </Text>
            <Text size="xs" colorTheme="mutedForeground" className="text-center">
              Please contact your administrator to set up hospitals.
            </Text>
          </VStack>
        </Card>
      </VStack>
    );
  }

  return (
    <VStack gap={spacing[2] as any}>
      <HStack gap={spacing[2] as any} alignItems="center">
        <Symbol name="building" size={20} className="text-primary" />
        <Text size="sm" weight="medium">Select Hospital</Text>
        {hospitals.length === 1 && (
          <Text size="xs" colorTheme="mutedForeground">(Required)</Text>
        )}
      </HStack>
      
      <VStack gap={spacing[2] as any}>
        {hospitals.map((hospital, index) => (
          <AnimatedView 
            key={hospital.id} 
            entering={FadeIn.delay(index * 50)}
          >
            <TouchableOpacity
              onPress={() => handleSelect(hospital.id)}
              disabled={disabled}
              activeOpacity={0.7}
            >
              <Card 
                className={`p-4 ${
                  selectedHospitalId === hospital.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border'
                } ${disabled ? 'opacity-50' : ''}`}
              >
                <HStack alignItems="center" justifyContent="space-between">
                  <HStack alignItems="center" gap={spacing[3] as any} className="flex-1">
                    <TouchableOpacity
                      onPress={() => handleSelect(hospital.id)}
                      disabled={disabled}
                    >
                      <Symbol 
                        name={selectedHospitalId === hospital.id ? "checkmark.circle.fill" : "circle"} 
                        size={20} 
                        className={selectedHospitalId === hospital.id ? "text-primary" : "text-muted-foreground"}
                      />
                    </TouchableOpacity>
                    <VStack gap={spacing[1] as any} className="flex-1">
                      <HStack alignItems="center" gap={spacing[2] as any}>
                        <Text size="base" weight={selectedHospitalId === hospital.id ? 'semibold' : 'medium'}>
                          {hospital.name}
                        </Text>
                        {hospital.isDefault && (
                          <Text size="xs" className="text-primary bg-primary/10 px-2 py-0.5 rounded">
                            Default
                          </Text>
                        )}
                      </HStack>
                      <Text size="xs" colorTheme="mutedForeground">
                        Code: {hospital.code}
                      </Text>
                    </VStack>
                  </HStack>
                  <Symbol name="chevron.right" size={16} className="text-muted-foreground" />
                </HStack>
              </Card>
            </TouchableOpacity>
          </AnimatedView>
        ))}
      </VStack>
      
      {error && (
        <Text size="sm" className="text-destructive mt-1">
          {error}
        </Text>
      )}
      
      {hospitals.length > 1 && (
        <Text size="xs" colorTheme="mutedForeground" className="text-center mt-2">
          You can change your hospital later in settings
        </Text>
      )}
    </VStack>
  );
}