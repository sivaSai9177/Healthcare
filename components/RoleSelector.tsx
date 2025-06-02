import React from "react";
import { Platform, View, Text, TouchableOpacity } from "react-native";
import { Card, CardContent } from "@/components/shadcn/ui/card";
import { cn } from "@/lib/core/utils";

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

export function RoleSelector({ selectedRole, onRoleSelect, className }: RoleSelectorProps) {
  // Use DOM component on web for better accessibility and performance
  if (Platform.OS === 'web') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DOMRoleSelector = require('./RoleSelector.dom').default;
    return <DOMRoleSelector selectedRole={selectedRole} onRoleSelect={onRoleSelect} className={className} />;
  }

  // Native implementation for mobile
  return (
    <View className={cn("space-y-3", className)}>
      <Text className="text-sm font-medium text-foreground mb-2">
        What best describes your role?
      </Text>
      
      {roleOptions.map((role) => (
        <TouchableOpacity
          key={role.value}
          onPress={() => onRoleSelect(role.value)}
          className="w-full"
          activeOpacity={0.7}
        >
          <Card 
            className={cn(
              "border-2 transition-colors",
              selectedRole === role.value 
                ? "border-primary bg-primary/5" 
                : "border-border"
            )}
            style={{
              borderColor: selectedRole === role.value ? '#1f2937' : '#e5e7eb',
              backgroundColor: selectedRole === role.value ? 'rgba(31, 41, 55, 0.05)' : 'transparent',
            }}
          >
            <CardContent className="p-4">
              <View className="flex-row items-start space-x-3">
                <Text className="text-2xl">{role.icon}</Text>
                
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-semibold text-foreground" style={{ color: '#1f2937' }}>
                      {role.label}
                    </Text>
                    
                    {selectedRole === role.value && (
                      <View 
                        className="w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                        style={{ backgroundColor: '#1f2937' }}
                      >
                        <Text className="text-primary-foreground text-xs font-bold" style={{ color: 'white' }}>✓</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text className="text-sm text-muted-foreground mt-1" style={{ color: '#6b7280' }}>
                    {role.description}
                  </Text>
                  
                  {role.organizationFlow !== 'none' && (
                    <Text className="text-xs text-primary mt-2" style={{ color: '#1f2937' }}>
                      {role.organizationFlow === 'create' 
                        ? '• Will create organization workspace'
                        : '• Can join existing organization'
                      }
                    </Text>
                  )}
                </View>
              </View>
            </CardContent>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export { roleOptions };
export type { RoleOption };