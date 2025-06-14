import React from 'react';
import { View } from 'react-native';
import { Box } from '@/components/universal/layout/Box';
import { VStack, HStack } from '@/components/universal/layout/Stack';
import { Text, Heading3 } from '@/components/universal/typography/Text';
import { Button } from '@/components/universal/interaction/Button';
import { Symbol as IconSymbol } from '@/components/universal/display/Symbols';
import { useTheme } from '@/lib/theme/provider';
import { haptic } from '@/lib/ui/haptics';
import { useFadeAnimation } from '@/lib/ui/animations';
import Animated from 'react-native-reanimated';
import { SpacingScale } from '@/lib/design';

interface ErrorDisplayProps {
  // Error information
  title?: string;
  message?: string;
  error?: Error | string;
  
  // Visual customization
  type?: 'inline' | 'full' | 'toast' | 'banner';
  variant?: 'error' | 'warning' | 'info';
  icon?: string;
  showIcon?: boolean;
  
  // Actions
  onRetry?: () => void;
  onDismiss?: () => void;
  retryText?: string;
  dismissText?: string;
  
  // Additional options
  showDetails?: boolean;
  className?: string;
  style?: any;
}

export function ErrorDisplay({
  title,
  message,
  error,
  type = 'inline',
  variant = 'error',
  icon,
  showIcon = true,
  onRetry,
  onDismiss,
  retryText = 'Try Again',
  dismissText = 'Dismiss',
  showDetails = false,
  className,
  style,
}: ErrorDisplayProps) {
  const theme = useTheme();
  const { animatedStyle, fadeIn } = useFadeAnimation({ 
    duration: 300,
    initialOpacity: 0,
    finalOpacity: 1,
  });
  
  // Trigger haptic feedback on error
  React.useEffect(() => {
    if (variant === 'error') {
      haptic('error');
    } else if (variant === 'warning') {
      haptic('warning');
    }
    fadeIn();
  }, [variant]);
  
  // Determine error message
  const errorMessage = message || (error instanceof Error ? error.message : String(error)) || 'An unexpected error occurred';
  const errorTitle = title || (variant === 'error' ? 'Error' : variant === 'warning' ? 'Warning' : 'Information');
  
  // Icon configuration
  const iconName = icon || (
    variant === 'error' ? 'exclamationmark.triangle.fill' :
    variant === 'warning' ? 'exclamationmark.circle.fill' :
    'info.circle.fill'
  );
  
  const iconColor = 
    variant === 'error' ? theme.destructive :
    variant === 'warning' ? theme.warning :
    theme.primary;
  
  // Background colors
  const bgColor = 
    variant === 'error' ? theme.destructive + '10' :
    variant === 'warning' ? theme.warning + '10' :
    theme.primary + '10';
  
  const borderColor = 
    variant === 'error' ? theme.destructive + '30' :
    variant === 'warning' ? theme.warning + '30' :
    theme.primary + '30';
  
  // Render based on type
  if (type === 'full') {
    return (
      <Animated.View style={[animatedStyle, { flex: 1 }]}>
        <Box 
          flex={1} 
          justifyContent="center" 
          alignItems="center" 
          p={6 as SpacingScale}
          style={style}
        >
          <VStack spacing={4} alignItems="center" maxWidth={400}>
            {showIcon && (
              <Box 
                width={80} 
                height={80} 
                borderRadius={40}
                bgColor={bgColor}
                justifyContent="center"
                alignItems="center"
                mb={2}
              >
                <IconSymbol 
                  name={iconName as any} 
                  size={40} 
                  color={iconColor}
                />
              </Box>
            )}
            
            <Heading3 style={{ textAlign: 'center' }}>
              {errorTitle}
            </Heading3>
            
            <Text 
              colorTheme="mutedForeground" 
              style={{ textAlign: 'center' }}
              size="base"
            >
              {errorMessage}
            </Text>
            
            {showDetails && error instanceof Error && error.stack && (
              <Box 
                bgColor={theme.muted}
                p={3 as SpacingScale}
                borderRadius={8}
                width="100%"
                mt={2}
              >
                <Text 
                  size="xs" 
                  style={{ fontFamily: 'monospace' }}
                  colorTheme="mutedForeground"
                >
                  {error.stack}
                </Text>
              </Box>
            )}
            
            <HStack spacing={3} mt={4}>
              {onRetry && (
                <Button 
                  onPress={onRetry}
                  variant={variant === 'error' ? 'destructive' : 'primary'}
                >
                  {retryText}
                </Button>
              )}
              {onDismiss && (
                <Button 
                  onPress={onDismiss}
                  variant="outline"
                >
                  {dismissText}
                </Button>
              )}
            </HStack>
          </VStack>
        </Box>
      </Animated.View>
    );
  }
  
  if (type === 'banner') {
    return (
      <Animated.View style={animatedStyle}>
        <Box 
          bgColor={bgColor}
          borderWidth={1}
          borderColor={borderColor}
          borderRadius={8}
          p={4 as SpacingScale}
          style={style}
        >
          <HStack spacing={3} alignItems="center">
            {showIcon && (
              <IconSymbol 
                name={iconName as any} 
                size={24} 
                color={iconColor}
              />
            )}
            
            <VStack flex={1} spacing={1}>
              <Text weight="semibold" size="sm">
                {errorTitle}
              </Text>
              <Text size="sm" colorTheme="mutedForeground">
                {errorMessage}
              </Text>
            </VStack>
            
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onPress={onDismiss}
              >
                <IconSymbol 
                  name="xmark" 
                  size={16} 
                  color={theme.mutedForeground}
                />
              </Button>
            )}
          </HStack>
        </Box>
      </Animated.View>
    );
  }
  
  if (type === 'toast') {
    return (
      <Animated.View 
        style={[
          animatedStyle,
          {
            position: 'absolute',
            bottom: 100,
            left: 20,
            right: 20,
            zIndex: 1000,
          },
          style,
        ]}
      >
        <Box 
          bgColor={theme.background}
          borderWidth={1}
          borderColor={borderColor}
          borderRadius={12}
          p={4 as SpacingScale}
          style={{
            boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
            elevation: 5,
          }}
        >
          <HStack spacing={3} alignItems="center">
            {showIcon && (
              <Box 
                width={32} 
                height={32} 
                borderRadius={16}
                bgColor={bgColor}
                justifyContent="center"
                alignItems="center"
              >
                <IconSymbol 
                  name={iconName as any} 
                  size={18} 
                  color={iconColor}
                />
              </Box>
            )}
            
            <VStack flex={1} spacing={1}>
              <Text weight="medium" size="sm">
                {errorTitle}
              </Text>
              <Text size="xs" colorTheme="mutedForeground">
                {errorMessage}
              </Text>
            </VStack>
            
            <HStack spacing={2}>
              {onRetry && (
                <Button
                  size="xs"
                  variant="ghost"
                  onPress={onRetry}
                >
                  {retryText}
                </Button>
              )}
              {onDismiss && (
                <Button
                  size="xs"
                  variant="ghost"
                  onPress={onDismiss}
                >
                  <IconSymbol 
                    name="xmark" 
                    size={14} 
                    color={theme.mutedForeground}
                  />
                </Button>
              )}
            </HStack>
          </HStack>
        </Box>
      </Animated.View>
    );
  }
  
  // Default inline error
  return (
    <Animated.View style={animatedStyle}>
      <Box 
        bgColor={bgColor}
        borderWidth={1}
        borderColor={borderColor}
        borderRadius={6}
        p={3 as SpacingScale}
        style={style}
      >
        <HStack spacing={2} alignItems="flex-start">
          {showIcon && (
            <IconSymbol 
              name={iconName as any} 
              size={20} 
              color={iconColor}
              style={{ marginTop: 2 }}
            />
          )}
          
          <VStack flex={1} spacing={1}>
            <Text size="sm" colorTheme="foreground">
              {errorMessage}
            </Text>
            
            {(onRetry || onDismiss) && (
              <HStack spacing={2} mt={2}>
                {onRetry && (
                  <Button
                    size="xs"
                    variant="link"
                    onPress={onRetry}
                    style={{ padding: 0 }}
                  >
                    {retryText}
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    size="xs"
                    variant="link"
                    onPress={onDismiss}
                    style={{ padding: 0 }}
                  >
                    {dismissText}
                  </Button>
                )}
              </HStack>
            )}
          </VStack>
        </HStack>
      </Box>
    </Animated.View>
  );
}

// Export a simpler error boundary component
export function ErrorBoundaryFallback({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) {
  return (
    <ErrorDisplay
      type="full"
      error={error}
      title="Something went wrong"
      onRetry={resetError}
      showDetails={__DEV__}
    />
  );
}