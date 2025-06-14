import React from "react";
import { z } from 'zod';
import { Text, Input, VStack, Card } from "@/components/universal";
import { UseFormReturn } from "react-hook-form";
import { UserRole } from "@/types/auth";
import { Building2, Sparkles, Info } from "@/components/universal/display/Symbols";
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useShadow } from '@/hooks/useShadow';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

interface OrganizationFieldProps {
  form: UseFormReturn<any>;
  role: UserRole;
}

const AnimatedView = Animated.View;

export function OrganizationField({ form, role }: OrganizationFieldProps) {
  const { spacing } = useSpacing();
  const shadowSm = useShadow({ size: 'sm' });
  
  if (role === 'guest') {
    return null; // No organization field for guests
  }

  if (role === 'user') {
    const organizationCode = form.watch('organizationCode');
    const error = form.formState.errors.organizationCode?.message;

    return (
      <AnimatedView entering={FadeIn.springify()}>
        <VStack gap={spacing[2] as any}>
          <Input
            label="Organization Code (Optional)"
            placeholder="ACME2024"
            autoCapitalize="characters"
            value={organizationCode || ''}
            onChangeText={(text) => form.setValue('organizationCode', text.toUpperCase())}
            error={error as string}
            hint="Enter your organization's code to join their workspace"
            leftIcon={<Building2 size={20} className="text-muted-foreground" />}
            className="animate-fade-in"
          />
          
          <AnimatedView entering={SlideInDown.delay(200).springify()}>
            <Card 
              className={cn(
                "p-3 bg-muted/50 border border-border",
                "animate-fade-in"
              )}
              style={shadowSm}
            >
              <VStack gap={spacing[1] as any}>
                <Info size={16} className="text-muted-foreground" />
                <Text size="sm" colorTheme="mutedForeground">
                  Don&apos;t have a code? No problem! You&apos;ll get your own personal workspace.
                </Text>
              </VStack>
            </Card>
          </AnimatedView>
        </VStack>
      </AnimatedView>
    );
  }

  if (role === 'manager' || role === 'admin') {
    const organizationName = form.watch('organizationName');
    const error = form.formState.errors.organizationName?.message;

    return (
      <AnimatedView entering={FadeIn.springify()}>
        <VStack gap={spacing[3] as any}>
          <Input
            label="Organization Name"
            placeholder="Acme Corporation"
            value={organizationName || ''}
            onChangeText={(text) => form.setValue('organizationName', text)}
            error={error as string}
            hint="This will create a new organization workspace"
            leftIcon={<Building2 size={20} className="text-muted-foreground" />}
            className="animate-fade-in"
          />
          
          <AnimatedView entering={SlideInDown.delay(200).springify()}>
            <Card 
              className={cn(
                "p-4 bg-accent/10 border border-accent/20",
                "animate-fade-in"
              )}
              style={shadowSm}
            >
              <VStack gap={spacing[2] as any}>
                <VStack gap={spacing[1] as any} align="start">
                  <Sparkles size={20} className="text-accent animate-pulse" />
                  <Text size="sm" weight="semibold" className="text-accent-foreground">
                    Creating New Organization
                  </Text>
                </VStack>
                <VStack gap={spacing[1] as any}>
                  <Text size="sm" colorTheme="mutedForeground">
                    • A unique organization code will be generated for your team
                  </Text>
                  <Text size="sm" colorTheme="mutedForeground">
                    • You&apos;ll be able to invite team members after signup
                  </Text>
                  <Text size="sm" colorTheme="mutedForeground">
                    • You&apos;ll have full administrative access
                  </Text>
                </VStack>
              </VStack>
            </Card>
          </AnimatedView>
        </VStack>
      </AnimatedView>
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