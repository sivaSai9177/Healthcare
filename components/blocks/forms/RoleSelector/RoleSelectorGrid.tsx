import React from "react";
import { Platform, Pressable, View, StyleSheet } from "react-native";
import { Text, VStack, HStack } from "@/components/universal";
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { haptic } from '@/lib/ui/haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { authStyles } from '@/components/blocks/auth/styles/authStyles';
import { useTheme } from '@/lib/theme/provider';

export type UserRole = 'doctor' | 'nurse' | 'admin' | 'patient';

interface RoleOption {
  value: UserRole;
  label: string;
  icon: string;
  color: string;
}

interface RoleSelectorGridProps {
  selectedRole?: UserRole;
  onRoleSelect: (role: UserRole) => void;
  className?: string;
}

const roleOptions: RoleOption[] = [
  {
    value: 'doctor',
    label: 'Doctor',
    icon: '👨‍⚕️',
    color: '#3b82f6', // blue-500
  },
  {
    value: 'nurse',
    label: 'Nurse',
    icon: '👩‍⚕️',
    color: '#10b981', // green-500
  },
  {
    value: 'admin',
    label: 'Admin',
    icon: '💼',
    color: '#f59e0b', // amber-500
  },
  {
    value: 'patient',
    label: 'Patient',
    icon: '🏥',
    color: '#8b5cf6', // violet-500
  }
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RoleSelectorGrid({ selectedRole, onRoleSelect, className }: RoleSelectorGridProps) {
  const { spacing } = useSpacing();
  const theme = useTheme();
  const [hoveredRole, setHoveredRole] = React.useState<UserRole | null>(null);

  const handleSelect = (role: UserRole) => {
    haptic('light');
    onRoleSelect(role);
  };

  return (
    <VStack gap={authStyles.spacing[2]} className={className}>
      <Text size="sm" weight="medium" style={{ marginBottom: authStyles.spacing[2] }}>
        Select your role
      </Text>
      
      <View style={styles.grid}>
        {roleOptions.map((role, index) => {
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
                  backgroundColor: theme.accent || `${role.color}10`, // Use accent theme or 10% opacity
                  borderColor: role.color,
                }
              ]}
            >
              <VStack gap={authStyles.spacing[1]} align="center">
                <Text size="2xl">{role.icon}</Text>
                <Text 
                  size="sm" 
                  weight={isSelected ? "semibold" : "medium"}
                  style={{ color: isSelected ? role.color : theme.foreground }}
                >
                  {role.label}
                </Text>
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
  },
  roleCard: {
    width: '48%',
    height: 100,
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

export { roleOptions };
export type { RoleOption };