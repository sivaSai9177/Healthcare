import { router } from 'expo-router';
import { log } from '@/lib/core/debug/logger';
import { animatedNavigation } from './animated-navigation';
import { Platform } from 'react-native';

export const navigation = {
  // Navigate to a route
  navigate: (href: string) => {
    log.debug('Navigating to', 'NAVIGATION', { href });
    router.push(href as any);
  },

  // Replace current route
  replace: (href: string) => {
    log.debug('Replacing route with', 'NAVIGATION', { href });
    router.replace(href as any);
  },

  // Go back
  back: () => {
    log.debug('Going back', 'NAVIGATION');
    router.back();
  },

  // Check if can go back
  canGoBack: () => {
    return router.canGoBack();
  },

  // Auth routes with animations
  toLogin: () => animatedNavigation.auth.toLogin(),
  toSignup: () => animatedNavigation.auth.toSignup(),
  toCompleteProfile: () => animatedNavigation.auth.toCompleteProfile(),
  toForgotPassword: () => animatedNavigation.auth.toForgotPassword(),

  // App routes with animations
  toHome: () => animatedNavigation.app.toHome(),
  toExplore: () => animatedNavigation.app.toExplore(),
  toSettings: () => animatedNavigation.app.toSettings(),
  toAdmin: () => animatedNavigation.app.toAdmin(),
  toManager: () => animatedNavigation.app.toManager(),

  // Profile routes
  toProfile: () => navigation.navigate('/profile'),
  
  // Dynamic navigation based on auth state
  navigateAfterAuth: (user: { role: string; needsProfileCompletion?: boolean }) => {
    if (user.needsProfileCompletion || user.role === 'guest') {
      navigation.toCompleteProfile();
    } else {
      navigation.toHome();
    }
  },

  // Navigate after logout
  navigateAfterLogout: () => {
    navigation.toLogin();
  },
};