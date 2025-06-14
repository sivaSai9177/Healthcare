import React from 'react';
import { View, Platform, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/lib/core/utils';
import { useTheme } from '@/lib/theme/provider';
import { useInteractionAnimation } from '@/lib/ui/animations';
import { Text } from '@/components/universal';

/**
 * AnimatedTabBar Component
 * Custom tab bar with animations
 */
export function AnimatedTabBar({ 
  state, 
  descriptors, 
  navigation 
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { hover, press } = useInteractionAnimation();
  
  return (
    <View 
      className={cn(
        'flex-row bg-background border-t border-border',
        Platform.OS === 'web' ? 'h-16' : 'pb-safe'
      )}
      style={{
        paddingBottom: Platform.OS === 'web' ? 0 : insets.bottom,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const isFocused = state.index === index;
        
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        
        return (
          <View
            key={route.key}
            className={cn(
              'flex-1 items-center justify-center',
              'transition-all duration-200',
              hover,
              press,
              isFocused && 'scale-105'
            )}
          >
            <Pressable
              onPress={onPress}
              className={cn(
                'items-center justify-center px-4 py-2',
                'transition-all duration-200',
                isFocused && 'animate-scale-in'
              )}
            >
              {options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused ? theme.primary : theme.mutedForeground,
                size: 24,
              })}
              <Text
                size="xs"
                className={cn(
                  'mt-1 transition-colors duration-200',
                  isFocused ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {label as string}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

/**
 * AnimatedTabContent Component
 * Animated content for tab screens
 */
export function AnimatedTabContent({ 
  children,
  isActive,
}: {
  children: React.ReactNode;
  isActive: boolean;
}) {
  if (Platform.OS === 'web') {
    return (
      <View 
        className={cn(
          'flex-1',
          isActive ? 'animate-fade-in' : 'opacity-0'
        )}
      >
        {children}
      </View>
    );
  }
  
  // For native, we rely on React Navigation's built-in animations
  return <>{children}</>;
}