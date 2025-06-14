import React from 'react';
import { View, ScrollView } from 'react-native';
import { Card, VStack, HStack, Text, CardContent } from '@/components/universal';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useShadow } from '@/hooks/useShadow';
import { useResponsive } from '@/hooks/responsive';
import { useThemeStore } from '@/lib/stores/theme-store';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';

const AnimatedView = Animated.View;

interface AuthCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showImage?: boolean;
  imageContent?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function AuthCard({
  children,
  title,
  subtitle,
  showImage = true,
  imageContent,
  className,
  contentClassName,
}: AuthCardProps) {
  const { spacing } = useSpacing();
  const { colorScheme } = useThemeStore();
  const shadowXl = useShadow({ size: 'xl' });
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  const showSplitLayout = showImage && (isTablet || isDesktop);
  const isDark = colorScheme === 'dark';

  // Gradient colors based on theme
  const gradientColors: readonly [string, string, ...string[]] = isDark
    ? ['#1e3a8a', '#3b82f6', '#60a5fa'] // Blue gradient for dark
    : ['#dbeafe', '#93c5fd', '#3b82f6']; // Light blue gradient

  return (
    <ScrollView 
      className="flex-1 bg-background"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <View className={cn(
        "flex-1 items-center justify-center",
        isMobile ? "p-4" : "p-8",
        className
      )}>
        <AnimatedView
          entering={FadeIn.duration(600).springify()}
          className={cn(
            "w-full",
            isMobile ? "max-w-md" : "max-w-4xl"
          )}
        >
          {showSplitLayout ? (
            // Desktop/Tablet split layout
            <HStack className="w-full h-full rounded-2xl overflow-hidden" style={shadowXl}>
              {/* Left side - Form */}
              <View className="flex-1 bg-card">
                <ScrollView 
                  contentContainerStyle={{ flexGrow: 1 }}
                  showsVerticalScrollIndicator={false}
                >
                  <VStack 
                    gap={spacing[6] as any} 
                    className={cn(
                      "flex-1 justify-center",
                      isTablet ? "p-8" : "p-12",
                      contentClassName
                    )}
                  >
                    {(title || subtitle) && (
                      <AnimatedView entering={SlideInRight.delay(200).springify()}>
                        <VStack gap={spacing[2] as any} align="center">
                          {title && (
                            <Text size="3xl" weight="bold" className="text-center">
                              {title}
                            </Text>
                          )}
                          {subtitle && (
                            <Text size="base" colorTheme="mutedForeground" className="text-center">
                              {subtitle}
                            </Text>
                          )}
                        </VStack>
                      </AnimatedView>
                    )}
                    
                    <AnimatedView entering={SlideInRight.delay(400).springify()}>
                      {children}
                    </AnimatedView>
                  </VStack>
                </ScrollView>
              </View>

              {/* Right side - Image/Gradient */}
              <View className="flex-1">
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1 }}
                >
                  <View className="flex-1 items-center justify-center p-8">
                    {imageContent || (
                      <VStack gap={spacing[4] as any} align="center">
                        <Text 
                          size="4xl" 
                          weight="bold" 
                          className={isDark ? "text-white" : "text-primary-foreground"}
                        >
                          Welcome
                        </Text>
                        <Text 
                          size="lg" 
                          className={cn(
                            "text-center opacity-90",
                            isDark ? "text-white" : "text-primary-foreground"
                          )}
                        >
                          Secure authentication for your healthcare platform
                        </Text>
                      </VStack>
                    )}
                  </View>
                </LinearGradient>
              </View>
            </HStack>
          ) : (
            // Mobile single column layout
            <Card 
              className={cn(
                "w-full",
                "animate-fade-in"
              )}
              style={shadowXl}
            >
              <CardContent className={cn(
                isMobile ? "p-6" : "p-8",
                contentClassName
              )}>
                <VStack gap={spacing[6] as any}>
                  {(title || subtitle) && (
                    <VStack gap={spacing[2] as any} align="center">
                      {title && (
                        <Text size="2xl" weight="bold" className="text-center">
                          {title}
                        </Text>
                      )}
                      {subtitle && (
                        <Text size="sm" colorTheme="mutedForeground" className="text-center">
                          {subtitle}
                        </Text>
                      )}
                    </VStack>
                  )}
                  
                  {children}
                </VStack>
              </CardContent>
            </Card>
          )}
        </AnimatedView>
      </View>
    </ScrollView>
  );
}