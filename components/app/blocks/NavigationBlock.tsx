import React from 'react';
import { Platform, View } from 'react-native';
import { usePathname } from 'expo-router';
import { AppSidebarBlock } from './AppSidebarBlock';
import { SidebarProvider, SidebarInset } from '@/components/universal/Sidebar';
import { WebNavBar } from '@/components/WebNavBar';
import { AnimatedScreen } from '@/components/navigation/AnimatedScreen';
import { useNavigationTransition } from '@/hooks/useNavigationTransition';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';

export interface NavigationBlockProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showNavBar?: boolean;
  sidebarProps?: React.ComponentProps<typeof AppSidebarBlock>;
  animateTransitions?: boolean;
}

/**
 * NavigationBlock - Complete navigation solution with sidebar, navbar, and page transitions
 * Handles responsive layout and animation coordination
 */
export function NavigationBlock({ 
  children,
  showSidebar = true,
  showNavBar = Platform.OS === 'web',
  sidebarProps,
  animateTransitions = true,
}: NavigationBlockProps) {
  const pathname = usePathname();
  const { isTransitioning } = useNavigationTransition();
  const { config, isAnimated } = useAnimationVariant({ variant: 'moderate' });

  // Don't show navigation on auth pages
  const isAuthPage = pathname.startsWith('/(auth)');
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Mobile layout - no sidebar, optional bottom navigation
  if (Platform.OS !== 'web') {
    return (
      <AnimatedScreen
        entering={animateTransitions && isAnimated ? 'slideFromRight' : undefined}
        exiting={animateTransitions && isAnimated ? 'slideToLeft' : undefined}
      >
        {children}
      </AnimatedScreen>
    );
  }

  // Web layout with sidebar
  return (
    <SidebarProvider>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {showSidebar && <AppSidebarBlock {...sidebarProps} />}
        <SidebarInset>
          {showNavBar && <WebNavBar />}
          <AnimatedScreen
            entering={animateTransitions && isAnimated ? 'fadeIn' : undefined}
            exiting={animateTransitions && isAnimated ? 'fadeOut' : undefined}
            style={{ flex: 1 }}
          >
            {children}
          </AnimatedScreen>
        </SidebarInset>
      </View>
    </SidebarProvider>
  );
}