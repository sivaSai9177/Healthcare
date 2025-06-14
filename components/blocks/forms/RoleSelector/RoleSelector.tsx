import React from "react";
import { Platform, TouchableOpacity, View } from "react-native";
import { Text, Card, VStack, HStack } from "@/components/universal";
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useShadow } from '@/hooks/useShadow';
import { haptic } from '@/lib/ui/haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Symbol } from '@/components/universal/display/Symbols';

export type UserRole = 'guest' | 'user' | 'manager' | 'admin';

interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
  organizationFlow: 'none' | 'optional' | 'create';
  icon: string;
}

interface RoleSelectorProps {
  selectedRole?: UserRole;
  onRoleSelect: (role: UserRole) => void;
  className?: string;
}

const roleOptions: RoleOption[] = [
  {
    value: 'guest',
    label: 'Guest',
    description: 'Browse and explore features',
    organizationFlow: 'none',
    icon: '👋'
  },
  {
    value: 'user',
    label: 'Individual User',
    description: 'Personal workspace and features',
    organizationFlow: 'optional',
    icon: '👤'
  },
  {
    value: 'manager',
    label: 'Team Manager',
    description: 'Manage team members and projects',
    organizationFlow: 'create',
    icon: '👥'
  },
  {
    value: 'admin',
    label: 'Organization Admin',
    description: 'Full organization management',
    organizationFlow: 'create',
    icon: '⚙️'
  }
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function RoleSelector({ selectedRole, onRoleSelect, className }: RoleSelectorProps) {
  const { spacing } = useSpacing();
  const shadowMd = useShadow({ size: 'md' });
  
  // Use DOM component on web for better accessibility and performance
  if (Platform.OS === 'web') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DOMRoleSelector = require('./RoleSelector.dom').default;
    return <DOMRoleSelector selectedRole={selectedRole} onRoleSelect={onRoleSelect} className={className} />;
  }

  const handleSelect = (role: UserRole) => {
    haptic('light');
    onRoleSelect(role);
  };

  // Native implementation for mobile
  return (
    <VStack gap={spacing[3] as any} className={className}>
      <Text size="sm" weight="medium" className="animate-fade-in">
        What best describes your role?
      </Text>
      
      {roleOptions.map((role, index) => {
        const isSelected = selectedRole === role.value;
        
        return (
          <AnimatedTouchable
            key={role.value}
            onPress={() => handleSelect(role.value)}
            activeOpacity={0.7}
            entering={FadeIn.delay(index * 100).springify()}
            style={shadowMd}
          >
            <Card 
              className={cn(
                "border-2 transition-all duration-200",
                isSelected ? "border-primary bg-primary/10" : "border-border bg-card",
                "animate-fade-in"
              )}
            >
              <VStack gap={spacing[3] as any} className="p-4">
                <HStack gap={spacing[3] as any} align="start">
                  <Text size="2xl">{role.icon}</Text>
                  
                  <View className="flex-1">
                    <HStack justify="between" align="center">
                      <Text weight="semibold">
                        {role.label}
                      </Text>
                      
                      {isSelected && (
                        <Animated.View
                          entering={FadeIn.springify()}
                          className="w-5 h-5 bg-primary rounded-full items-center justify-center"
                        >
                          <Symbol name="checkmark" size={12} className="text-primary-foreground" />
                        </Animated.View>
                      )}
                    </HStack>
                    
                    <Text size="sm" colorTheme="mutedForeground" className="mt-1">
                      {role.description}
                    </Text>
                    
                    {role.organizationFlow !== 'none' && (
                      <Text size="xs" className="text-primary mt-2">
                        {role.organizationFlow === 'create' 
                          ? '• Will create organization workspace'
                          : '• Can join existing organization'
                        }
                      </Text>
                    )}
                  </View>
                </HStack>
              </VStack>
            </Card>
          </AnimatedTouchable>
        );
      })}
    </VStack>
  );
}

export { roleOptions };
export type { RoleOption };