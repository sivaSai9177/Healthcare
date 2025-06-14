import React from 'react';
import { View, Pressable } from 'react-native';
import { HStack, Button, Text } from '@/components/universal';
import { Mail } from '@/components/universal/display/Symbols';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { haptic } from '@/lib/ui/haptics';
import { showErrorAlert } from '@/lib/core/alert';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useGoogleSignIn } from '../GoogleSignIn/useGoogleSignIn';

const AnimatedView = Animated.View;

type SocialProvider = 'google' | 'apple' | 'facebook' | 'github' | 'twitter';

interface SocialLoginButtonsProps {
  providers?: SocialProvider[];
  onProviderSelect: (provider: SocialProvider) => void;
  isLoading?: boolean;
  className?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  fullWidth?: boolean;
  iconOnly?: boolean;
}

// Social provider configurations
const providerConfigs: Record<SocialProvider, {
  icon: React.ReactNode;
  label: string;
  bgColor?: string;
  textColor?: string;
}> = {
  google: {
    icon: <Text size="lg" weight="bold">G</Text>,
    label: 'Google',
  },
  apple: {
    icon: <Text size="lg" weight="bold"></Text>,
    label: 'Apple',
  },
  facebook: {
    icon: <Text size="lg" weight="bold" className="text-blue-600">f</Text>,
    label: 'Facebook',
  },
  github: {
    icon: <Text size="lg" weight="bold">GH</Text>,
    label: 'GitHub',
  },
  twitter: {
    icon: <Text size="lg" weight="bold">𝕏</Text>,
    label: 'Twitter',
  },
};

export function SocialLoginButtons({
  providers = ['google', 'apple', 'facebook'],
  onProviderSelect,
  isLoading = false,
  className,
  buttonSize = 'md',
  variant = 'outline',
  fullWidth = false,
  iconOnly = false,
}: SocialLoginButtonsProps) {
  const { spacing } = useSpacing();
  const { handleGoogleSignIn, isLoading: isGoogleLoading } = useGoogleSignIn();

  const handleProviderClick = async (provider: SocialProvider) => {
    haptic('light');
    
    if (provider === 'google') {
      await handleGoogleSignIn();
    } else {
      onProviderSelect(provider);
    }
  };

  return (
    <AnimatedView 
      entering={FadeIn.delay(200).springify()}
      className={className}
    >
      <HStack 
        gap={spacing[3] as any} 
        className={cn(
          fullWidth && "w-full",
          providers.length > 3 && "flex-wrap"
        )}
      >
        {providers.map((provider, index) => {
          const config = providerConfigs[provider];
          
          return (
            <AnimatedView
              key={provider}
              entering={FadeIn.delay(300 + index * 100).springify()}
              className={cn(
                fullWidth && "flex-1",
                providers.length > 3 && "min-w-[100px]"
              )}
            >
              <Button
                variant={variant}
                size={buttonSize}
                onPress={() => handleProviderClick(provider)}
                disabled={isLoading || (provider === 'google' && isGoogleLoading)}
                className={cn(
                  "transition-all duration-200",
                  config.bgColor && `bg-${config.bgColor}`,
                  fullWidth && "w-full"
                )}
              >
                <HStack gap={2} align="center">
                  {config.icon}
                  {!iconOnly && (
                    <Text 
                      size={buttonSize === 'sm' ? 'xs' : buttonSize === 'lg' ? 'base' : 'sm'}
                      weight="medium"
                      className={config.textColor}
                    >
                      {config.label}
                    </Text>
                  )}
                </HStack>
              </Button>
            </AnimatedView>
          );
        })}
      </HStack>
    </AnimatedView>
  );
}

// Convenience component for "Continue with" section
interface ContinueWithSocialProps extends Omit<SocialLoginButtonsProps, 'fullWidth'> {
  dividerText?: string;
}

export function ContinueWithSocial({
  dividerText = "Or continue with",
  ...props
}: ContinueWithSocialProps) {
  const { spacing } = useSpacing();

  return (
    <View className="w-full">
      {/* Divider with text */}
      <View className="relative my-6">
        <View className="absolute inset-0 flex-row items-center">
          <View className="w-full h-px bg-border" />
        </View>
        <View className="relative flex-row justify-center">
          <View className="bg-background px-4">
            <Text size="sm" colorTheme="mutedForeground">
              {dividerText}
            </Text>
          </View>
        </View>
      </View>

      {/* Social buttons */}
      <SocialLoginButtons
        fullWidth
        {...props}
      />
    </View>
  );
}