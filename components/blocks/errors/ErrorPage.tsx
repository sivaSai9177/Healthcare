import React from 'react';
import { View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme/provider';
import { Text, Heading2 } from '@/components/universal/typography';
import { VStack, HStack } from '@/components/universal/layout';
import { Button } from '@/components/universal/interaction';
import { Card } from '@/components/universal/display';
import { Symbol } from '@/components/universal/display/Symbols';
import { cn } from '@/lib/core/utils';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';

interface ErrorPageProps {
  // Error information
  type: 'session-timeout' | 'connection-lost' | 'unauthorized' | 'not-found' | 'server-error' | 'rate-limit';
  title: string;
  message: string;
  icon: string;
  iconColor?: string;
  
  // Actions
  primaryAction?: {
    label: string;
    onPress: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  };
  
  // Additional content
  children?: React.ReactNode;
  showDebugInfo?: boolean;
  debugInfo?: string;
  
  // Customization
  className?: string;
  style?: any;
}

export function ErrorPage({
  type,
  title,
  message,
  icon,
  iconColor,
  primaryAction,
  secondaryAction,
  children,
  showDebugInfo = __DEV__,
  debugInfo,
  className,
  style,
}: ErrorPageProps) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const getIconColor = () => {
    if (iconColor) return iconColor;
    
    switch (type) {
      case 'session-timeout':
        return theme.warning;
      case 'connection-lost':
        return theme.muted;
      case 'unauthorized':
        return theme.destructive;
      case 'server-error':
        return theme.destructive;
      case 'rate-limit':
        return theme.warning;
      default:
        return theme.primary;
    }
  };
  
  const getBgColor = () => {
    switch (type) {
      case 'session-timeout':
        return theme.warning + '10';
      case 'connection-lost':
        return theme.muted + '10';
      case 'unauthorized':
        return theme.destructive + '10';
      case 'server-error':
        return theme.destructive + '10';
      case 'rate-limit':
        return theme.warning + '10';
      default:
        return theme.primary + '10';
    }
  };
  
  return (
    <View 
      className={cn("flex-1 bg-background", className)}
      style={[{ paddingTop: insets.top }, style]}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          paddingBottom: insets.bottom + 20,
        }}
      >
        <VStack gap={6} align="center" className="max-w-md w-full">
          {/* Icon */}
          <Animated.View entering={FadeIn.delay(100).springify()}>
            <View 
              className="w-24 h-24 rounded-full items-center justify-center"
              style={{ backgroundColor: getBgColor() }}
            >
              <Symbol 
                name={icon as any} 
                size={48} 
                color={getIconColor()}
              />
            </View>
          </Animated.View>
          
          {/* Title */}
          <Animated.View entering={SlideInUp.delay(200).springify()}>
            <Heading2 className="text-center">
              {title}
            </Heading2>
          </Animated.View>
          
          {/* Message */}
          <Animated.View entering={SlideInUp.delay(300).springify()}>
            <Text 
              size="base" 
              colorTheme="mutedForeground" 
              className="text-center"
            >
              {message}
            </Text>
          </Animated.View>
          
          {/* Additional Content */}
          {children && (
            <Animated.View entering={SlideInUp.delay(400).springify()} className="w-full">
              {children}
            </Animated.View>
          )}
          
          {/* Actions */}
          <Animated.View entering={SlideInUp.delay(500).springify()} className="w-full">
            <VStack gap={3}>
              {primaryAction && (
                <Button
                  size="lg"
                  variant={primaryAction.variant || 'default'}
                  onPress={primaryAction.onPress}
                  className="w-full"
                >
                  {primaryAction.label}
                </Button>
              )}
              
              {secondaryAction && (
                <Button
                  size="lg"
                  variant={secondaryAction.variant || 'outline'}
                  onPress={secondaryAction.onPress}
                  className="w-full"
                >
                  {secondaryAction.label}
                </Button>
              )}
            </VStack>
          </Animated.View>
          
          {/* Debug Info */}
          {showDebugInfo && debugInfo && (
            <Animated.View entering={FadeIn.delay(600)} className="w-full">
              <Card className="p-4 bg-muted/50">
                <VStack gap={2}>
                  <HStack gap={2} align="center">
                    <Symbol name="info.circle" size={16} color={theme.mutedForeground} />
                    <Text size="sm" weight="semibold" colorTheme="mutedForeground">
                      Debug Information
                    </Text>
                  </HStack>
                  <Text 
                    size="xs" 
                    colorTheme="mutedForeground"
                    style={{ fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) }}
                  >
                    {debugInfo}
                  </Text>
                </VStack>
              </Card>
            </Animated.View>
          )}
          
          {/* Debug Info */}
          {__DEV__ && (
            <Animated.View entering={FadeIn.delay(700)}>
              <Text size="xs" colorTheme="mutedForeground" className="text-center italic">
                Tap the 🐛 button to open debug panel
              </Text>
            </Animated.View>
          )}
        </VStack>
      </ScrollView>
    </View>
  );
}