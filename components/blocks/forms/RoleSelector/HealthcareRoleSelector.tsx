import React from "react";
import { Platform, Pressable, View, StyleSheet } from "react-native";
import { Text, VStack } from "@/components/universal";
import { haptic } from '@/lib/ui/haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { authStyles } from '@/components/blocks/auth/styles/authStyles';
import { useTheme } from '@/lib/theme/provider';
import { HealthcareUserRole } from '@/types/healthcare';

interface RoleOption {
  value: HealthcareUserRole;
  label: string;
  icon: string;
  color: string;
  description?: string;
}

interface HealthcareRoleSelectorProps {
  selectedRole?: HealthcareUserRole;
  onRoleSelect: (role: HealthcareUserRole) => void;
  className?: string;
}

const healthcareRoleOptions: RoleOption[] = [
  {
    value: 'operator',
    label: 'Operator',
    icon: '🚨',
    color: '#ef4444', // red-500
    description: 'Create and dispatch alerts'
  },
  {
    value: 'nurse',
    label: 'Nurse',
    icon: '👩‍⚕️',
    color: '#10b981', // green-500
    description: 'Respond to medical alerts'
  },
  {
    value: 'doctor',
    label: 'Doctor',
    icon: '👨‍⚕️',
    color: '#3b82f6', // blue-500
    description: 'Handle emergencies'
  },
  {
    value: 'head_doctor',
    label: 'Head Doctor',
    icon: '🏥',
    color: '#8b5cf6', // violet-500
    description: 'Oversee operations'
  },
  {
    value: 'admin',
    label: 'Admin',
    icon: '💼',
    color: '#f59e0b', // amber-500
    description: 'System administration'
  }
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HealthcareRoleSelector({ selectedRole, onRoleSelect, className }: HealthcareRoleSelectorProps) {
  const theme = useTheme();
  const [hoveredRole, setHoveredRole] = React.useState<HealthcareUserRole | null>(null);

  const handleSelect = (role: HealthcareUserRole) => {
    haptic('light');
    onRoleSelect(role);
  };

  return (
    <VStack gap={authStyles.spacing[2] as any} className={className}>
      <VStack gap={authStyles.spacing[1] as any}>
        <Text size="sm" weight="medium">
          Select your healthcare role
        </Text>
        <Text size="xs" colorTheme="mutedForeground">
          Choose the role that matches your position in the hospital
        </Text>
      </VStack>
      
      <View style={styles.grid}>
        {healthcareRoleOptions.map((role, index) => {
          const isSelected = selectedRole === role.value;
          const isHovered = hoveredRole === role.value;
          
          return (
            <AnimatedPressable
              key={role.value}
              onPress={() => handleSelect(role.value)}
              onPressIn={() => Platform.OS !== 'web' && setHoveredRole(role.value)}
              onPressOut={() => Platform.OS !== 'web' && setHoveredRole(null)}
              onHoverIn={() => Platform.OS === 'web' && setHoveredRole(role.value)}
              onHoverOut={() => Platform.OS === 'web' && setHoveredRole(null)}
              entering={FadeIn.delay(index * 50).springify()}
              style={[
                styles.roleCard,
                {
                  backgroundColor: theme.card,
                  borderColor: isSelected ? role.color : theme.border,
                  borderWidth: 2,
                  transform: [{ scale: isHovered && Platform.OS === 'web' ? 0.98 : 1 }],
                },
                isSelected && {
                  backgroundColor: theme.accent || `${role.color}10`,
                  borderColor: role.color,
                }
              ]}
            >
              <VStack gap={authStyles.spacing[1] as any} alignItems="center">
                <Text size="3xl">{role.icon}</Text>
                <Text 
                  size="sm" 
                  weight={isSelected ? "semibold" : "medium"}
                  style={{ color: isSelected ? role.color : theme.foreground }}
                >
                  {role.label}
                </Text>
                {role.description && (
                  <Text 
                    size="xs" 
                    colorTheme="mutedForeground"
                    style={{ textAlign: 'center' }}
                  >
                    {role.description}
                  </Text>
                )}
              </VStack>
              
              {isSelected && (
                <View style={[styles.checkmark, { backgroundColor: role.color }]}>
                  <Text size="xs" style={{ color: '#ffffff' }}>✓</Text>
                </View>
              )}
            </AnimatedPressable>
          );
        })}
      </View>
    </VStack>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  roleCard: {
    width: '30%',
    minWidth: 110,
    maxWidth: 150,
    height: 120,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
        },
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export { healthcareRoleOptions };
export type { RoleOption as HealthcareRoleOption };