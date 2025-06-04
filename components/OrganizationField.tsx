import React from "react";
import { View, Text } from "react-native";
import { z } from 'zod';
import { Input } from "@/components/shadcn/ui/input.simple";
import { FormField, FormItem, FormMessage } from "@/components/shadcn/ui/form";
import { Control } from "react-hook-form";
import { UserRole } from "./RoleSelector";

interface OrganizationFieldProps {
  control: Control<any>;
  role: UserRole;
  className?: string;
}

export function OrganizationField({ control, role, className }: OrganizationFieldProps) {
  if (role === 'guest') {
    return null; // No organization field for guests
  }

  if (role === 'user') {
    return (
      <View className={className}>
        <FormField
          control={control}
          name="organizationCode"
          render={({ field }) => (
            <FormItem>
              <Input
                label="Organization Code (Optional)"
                placeholder="ACME2024"
                autoCapitalize="characters"
                error={control._formState.errors.organizationCode?.message as string}
                hint="Enter your organization's code to join their workspace"
                {...field}
                onChangeText={(text) => field.onChange(text.toUpperCase())}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Text className="text-xs text-muted-foreground mt-2">
          💡 Don&apos;t have a code? No problem! You&apos;ll get your own personal workspace.
        </Text>
      </View>
    );
  }

  if (role === 'manager' || role === 'admin') {
    return (
      <View className={className}>
        <FormField
          control={control}
          name="organizationName"
          render={({ field }) => (
            <FormItem>
              <Input
                label="Organization Name"
                placeholder="Acme Corporation"
                error={control._formState.errors.organizationName?.message as string}
                hint="This will create a new organization workspace"
                {...field}
                onChangeText={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        
        <View className="mt-3 p-3 bg-primary/10 rounded-lg">
          <Text className="text-sm font-medium text-primary mb-1">
            🎉 Creating New Organization
          </Text>
          <Text className="text-xs text-muted-foreground">
            • A unique organization code will be generated for your team
            {'\n'}• You&apos;ll be able to invite team members after signup
            {'\n'}• You&apos;ll have full administrative access
          </Text>
        </View>
      </View>
    );
  }

  return null;
}

// Validation schemas
export const organizationCodeSchema = z.string()
  .min(4, 'Organization code must be at least 4 characters')
  .max(12, 'Organization code too long')
  .regex(/^[A-Z0-9]+$/, 'Code must contain only uppercase letters and numbers')
  .optional();

export const organizationNameSchema = z.string()
  .min(2, 'Organization name must be at least 2 characters')
  .max(100, 'Organization name too long')
  .trim()
  .optional();