import React from 'react';
import { View, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  HStack,
  Button,
  Text,
} from '@/components/universal';
import { 
  PlusIcon,
  Download,
  RefreshCw,
} from '@/components/universal/display/Symbols';
import { SpacingScale } from '@/lib/design';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useResponsive } from '@/hooks/responsive';
import { HealthcareUserRole } from '@/types/healthcare';
import { haptic } from '@/lib/ui/haptics';
import { cn } from '@/lib/core/utils';

export interface AlertActionsProps {
  role: HealthcareUserRole;
  onRefresh?: () => void;
  onExport?: () => void;
  onCreateAlert?: () => void;
  isRefreshing?: boolean;
  showFloatingAction?: boolean;
}

export function AlertActions({
  role,
  onRefresh,
  onExport,
  onCreateAlert,
  isRefreshing = false,
  showFloatingAction = false,
}: AlertActionsProps) {
  const router = useRouter();
  const { spacing } = useSpacing();
  const { isMobile } = useResponsive();
  
  const canCreateAlerts = ['operator', 'admin'].includes(role);
  const canExport = ['admin', 'head_doctor'].includes(role);
  
  const handleCreateAlert = () => {
    haptic('light');
    if (onCreateAlert) {
      onCreateAlert();
    } else {
      router.push('/(modals)/create-alert');
    }
  };
  
  const handleExport = () => {
    haptic('light');
    onExport?.();
  };
  
  const handleRefresh = () => {
    haptic('light');
    onRefresh?.();
  };
  
  // Floating Action Button for mobile
  if (showFloatingAction && canCreateAlerts && isMobile) {
    return (
      <View
        style={{
          position: 'absolute',
          bottom: spacing[6],
          right: spacing[4],
          zIndex: 50,
        }}
      >
        <Button
          size="lg"
          onPress={handleCreateAlert}
          className={cn(
            "rounded-full shadow-lg",
            Platform.OS === 'ios' && "shadow-xl"
          )}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
          }}
        >
          <PlusIcon size={24} />
        </Button>
      </View>
    );
  }
  
  // Regular action buttons
  return (
    <HStack 
      gap={spacing[2] as SpacingScale} 
      align="center"
      style={{ flexWrap: 'wrap' }}
    >
      {/* Create Alert Button */}
      {canCreateAlerts && (
        <Button
          variant="default"
          size={isMobile ? "sm" : "default"}
          onPress={handleCreateAlert}
        >
          <PlusIcon size={isMobile ? 16 : 20} />
          <Text>Create Alert</Text>
        </Button>
      )}
      
      {/* Refresh Button */}
      {onRefresh && (
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw size={isMobile ? 16 : 20} className={cn(isRefreshing && "animate-spin")} />
          <Text>{isRefreshing ? 'Refreshing...' : 'Refresh'}</Text>
        </Button>
      )}
      
      {/* Export Button */}
      {canExport && onExport && !isMobile && (
        <Button
          variant="ghost"
          size="default"
          onPress={handleExport}
        >
          <Download size={20} />
          <Text>Export</Text>
        </Button>
      )}
    </HStack>
  );
}