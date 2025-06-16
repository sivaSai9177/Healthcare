import React from 'react';
import { View, Pressable } from 'react-native';
import { HStack, VStack } from '@/components/universal/layout';
import { Text } from '@/components/universal/typography';
import { Checkbox } from '@/components/universal/form';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { haptic } from '@/lib/ui/haptics';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

const AnimatedView = Animated.View;

interface TermsFooterProps {
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  onAcceptTermsChange: (accepted: boolean) => void;
  onAcceptPrivacyChange: (accepted: boolean) => void;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
  termsError?: string;
  privacyError?: string;
  className?: string;
  showLinks?: boolean;
}

export function TermsFooter({
  acceptTerms,
  acceptPrivacy,
  onAcceptTermsChange,
  onAcceptPrivacyChange,
  onTermsPress,
  onPrivacyPress,
  termsError,
  privacyError,
  className,
  showLinks = true,
}: TermsFooterProps) {
  const { spacing } = useSpacing();

  const handleTermsChange = (checked: boolean) => {
    haptic('light');
    onAcceptTermsChange(checked);
  };

  const handlePrivacyChange = (checked: boolean) => {
    haptic('light');
    onAcceptPrivacyChange(checked);
  };

  const handleLinkPress = (type: 'terms' | 'privacy') => {
    haptic('light');
    if (type === 'terms' && onTermsPress) {
      onTermsPress();
    } else if (type === 'privacy' && onPrivacyPress) {
      onPrivacyPress();
    }
  };

  return (
    <AnimatedView 
      entering={SlideInDown.delay(600).springify()}
      className={cn("w-full", className)}
    >
      <VStack gap={spacing[3] as any}>
        {/* Terms of Service */}
        <AnimatedView entering={FadeIn.delay(700)}>
          <HStack gap={3} align="flex-start">
            <Checkbox
              checked={acceptTerms}
              onCheckedChange={handleTermsChange}
              className="mt-1"
            />
            <View className="flex-1">
              <Text size="sm" className="leading-relaxed">
                I accept the{' '}
                {showLinks && onTermsPress ? (
                  <Pressable onPress={() => handleLinkPress('terms')}>
                    <Text size="sm" weight="medium" className="text-primary underline">
                      Terms of Service
                    </Text>
                  </Pressable>
                ) : (
                  <Text size="sm" weight="medium" className="text-primary">
                    Terms of Service
                  </Text>
                )}
              </Text>
              {termsError && (
                <Text size="xs" className="text-destructive mt-1">
                  {termsError}
                </Text>
              )}
            </View>
          </HStack>
        </AnimatedView>

        {/* Privacy Policy */}
        <AnimatedView entering={FadeIn.delay(800)}>
          <HStack gap={3} align="flex-start">
            <Checkbox
              checked={acceptPrivacy}
              onCheckedChange={handlePrivacyChange}
              className="mt-1"
            />
            <View className="flex-1">
              <Text size="sm" className="leading-relaxed">
                I accept the{' '}
                {showLinks && onPrivacyPress ? (
                  <Pressable onPress={() => handleLinkPress('privacy')}>
                    <Text size="sm" weight="medium" className="text-primary underline">
                      Privacy Policy
                    </Text>
                  </Pressable>
                ) : (
                  <Text size="sm" weight="medium" className="text-primary">
                    Privacy Policy
                  </Text>
                )}
              </Text>
              {privacyError && (
                <Text size="xs" className="text-destructive mt-1">
                  {privacyError}
                </Text>
              )}
            </View>
          </HStack>
        </AnimatedView>
      </VStack>
    </AnimatedView>
  );
}

// Simplified version for compact forms
interface CompactTermsProps {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
  error?: string;
  className?: string;
}

export function CompactTerms({
  accepted,
  onAcceptedChange,
  onTermsPress,
  onPrivacyPress,
  error,
  className,
}: CompactTermsProps) {
  const handleChange = (checked: boolean) => {
    haptic('light');
    onAcceptedChange(checked);
  };

  return (
    <AnimatedView 
      entering={FadeIn.delay(600)}
      className={cn("w-full", className)}
    >
      <HStack gap={3} align="flex-start">
        <Checkbox
          checked={accepted}
          onCheckedChange={handleChange}
          className="mt-1"
        />
        <View className="flex-1">
          <Text size="xs" className="leading-relaxed">
            By continuing, you agree to our{' '}
            {onTermsPress ? (
              <Pressable onPress={onTermsPress}>
                <Text size="xs" weight="medium" className="text-primary underline">
                  Terms
                </Text>
              </Pressable>
            ) : (
              <Text size="xs" weight="medium" className="text-primary">
                Terms
              </Text>
            )}
            {' and '}
            {onPrivacyPress ? (
              <Pressable onPress={onPrivacyPress}>
                <Text size="xs" weight="medium" className="text-primary underline">
                  Privacy Policy
                </Text>
              </Pressable>
            ) : (
              <Text size="xs" weight="medium" className="text-primary">
                Privacy Policy
              </Text>
            )}
          </Text>
          {error && (
            <Text size="xs" className="text-destructive mt-1">
              {error}
            </Text>
          )}
        </View>
      </HStack>
    </AnimatedView>
  );
}