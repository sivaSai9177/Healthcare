import React from 'react';
import { View, Pressable } from 'react-native';
import { HStack } from '@/components/universal/layout';
import { Button } from '@/components/universal/interaction';
import { Text } from '@/components/universal/typography';
import { Symbol } from '@/components/universal/display/Symbols';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { haptic } from '@/lib/ui/haptics';
import { showErrorAlert } from '@/lib/core/alert';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useGoogleSignIn } from '../GoogleSignIn/useGoogleSignIn';
import { authStyles } from '../styles/authStyles';
import { useTheme } from '@/lib/theme/provider';

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

// Get social provider icons
const getProviderIcon = (provider: SocialProvider, size: number = 20, variant: 'outline' | 'default' = 'outline') => {
  const color = variant === 'outline' ? undefined : '#ffffff';
  
  switch (provider) {
    case 'google':
      // Google icon with brand colors
      return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 1 }}>
            <Text size="sm" weight="bold" style={{ color: '#4285F4' }}>G</Text>
          </View>
        </View>
      );
    case 'apple':
      return <Symbol name="logo-apple" size={size} color={color || '#000000'} />;
    case 'facebook':
      return <Text size="lg" weight="bold" style={{ color: '#1877f2' }}>f</Text>;
    case 'github':
      return <Symbol name="logo-github" size={size} color={color || '#000000'} />;
    case 'twitter':
      return <Text size="lg" weight="bold" style={{ color: '#000000' }}>𝕏</Text>;
  }
};

// Social provider configurations
const providerConfigs: Record<SocialProvider, {
  label: string;
  bgColor?: string;
  textColor?: string;
}> = {
  google: {
    label: 'Google',
  },
  apple: {
    label: 'Apple',
  },
  facebook: {
    label: 'Facebook',
  },
  github: {
    label: 'GitHub',
  },
  twitter: {
    label: 'Twitter',
  },
};

export function SocialLoginButtons({
  providers = ['google'],
  onProviderSelect,
  isLoading = false,
  className,
  buttonSize = 'md',
  variant = 'outline',
  fullWidth = false,
  iconOnly = false,
}: SocialLoginButtonsProps) {
  const { spacing } = useSpacing();
  const theme = useTheme();
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
                fullWidth={fullWidth}
                style={{
                  borderWidth: variant === 'outline' ? 1 : 0,
                  borderColor: authStyles.colors.border,
                }}
              >
                <HStack gap={spacing[2]} align="center">
                  {getProviderIcon(provider, buttonSize === 'sm' ? 16 : buttonSize === 'lg' ? 24 : 20, variant)}
                  {!iconOnly && (
                    <Text 
                      size={buttonSize === 'sm' ? 'xs' : buttonSize === 'lg' ? 'base' : 'sm'}
                      weight="medium"
                      style={{ color: variant === 'outline' ? theme.foreground : '#ffffff' }}
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
      {/* This component should not render divider - parent component handles it */}

      {/* Social buttons */}
      <SocialLoginButtons
        fullWidth
        {...props}
      />
    </View>
  );
}