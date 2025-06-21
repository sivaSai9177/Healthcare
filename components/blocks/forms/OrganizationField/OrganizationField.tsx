import React from "react";
import { z } from 'zod';
import { Text, VStack, Card } from "@/components/universal";
import { Input } from '@/components/universal/form';
import { UseFormReturn } from "react-hook-form";
import { UserRole } from "@/types/auth";
import { Building2, Sparkles, Info } from "@/components/universal/display/Symbols";
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useShadow } from '@/hooks/useShadow';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useTheme } from '@/lib/theme/provider';

interface OrganizationFieldProps {
  form: UseFormReturn<any>;
  role: UserRole;
}

const AnimatedView = Animated.View;

export function OrganizationField({ form, role }: OrganizationFieldProps) {
  const { spacing } = useSpacing();
  const theme = useTheme();
  const shadowSm = useShadow({ size: 'sm' });
  
  if (role === 'guest') {
    return null; // No organization field for guests
  }

  // Healthcare roles (doctor, nurse, operator, head_doctor) and regular users
  if (role === 'user' || role === 'doctor' || role === 'nurse' || role === 'operator' || role === 'head_doctor') {
    const organizationCode = form.watch('organizationCode');
    const errorObj = form.formState.errors.organizationCode;
    const error = errorObj && typeof errorObj === 'object' && 'message' in errorObj 
      ? errorObj.message 
      : typeof errorObj === 'string' 
      ? errorObj 
      : undefined;

    return (
      <AnimatedView entering={FadeIn.springify()}>
        <VStack gap={spacing[2] as any}>
          <Input
            label="Organization Code (Optional)"
            placeholder="ACME2024"
            autoCapitalize="characters"
            value={organizationCode || ''}
            onChangeText={(text) => form.setValue('organizationCode', text.toUpperCase(), { shouldValidate: true })}
            onBlur={() => form.trigger('organizationCode')}
            error={error as string | undefined}
            hint="Enter your organization's code to join their workspace"
            leftElement={<Building2 size={20} color={theme.mutedForeground} />}
            floatingLabel={false}
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
                  {role === 'user' 
                    ? "Don't have a code? No problem! You'll get your own personal workspace."
                    : "Healthcare professionals can enter their organization code now or complete this step after registration."}
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
    const errorObj = form.formState.errors.organizationName;
    const error = errorObj && typeof errorObj === 'object' && 'message' in errorObj 
      ? errorObj.message 
      : typeof errorObj === 'string' 
      ? errorObj 
      : undefined;

    return (
      <AnimatedView entering={FadeIn.springify()} style={{ width: '100%' }}>
        <VStack gap={spacing[3] as any}>
          <Input
            label="Organization Name"
            placeholder="Acme Corporation"
            value={organizationName || ''}
            onChangeText={(text) => form.setValue('organizationName', text, { shouldValidate: true })}
            onBlur={() => form.trigger('organizationName')}
            error={error as string | undefined}
            hint="This will create a new organization workspace"
            leftElement={<Building2 size={20} color={theme.mutedForeground} />}
            autoComplete="off"
            autoCorrect={false}
            floatingLabel={false}
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
                <VStack gap={spacing[1] as any} alignItems="flex-start">
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