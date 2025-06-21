import React from 'react';
import { useRouter } from 'expo-router';
import { ProfileCompletionFlow } from '@/components/blocks/auth';
import { useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/lib/theme/provider';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuth();
  const theme = useTheme();

  // Log the current state
  React.useEffect(() => {
    console.log('[COMPLETE PROFILE] Current state:', {
      hasHydrated,
      isAuthenticated,
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        needsProfileCompletion: user.needsProfileCompletion,
        organizationId: user.organizationId,
        defaultHospitalId: user.defaultHospitalId
      } : null,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
    });
  }, [hasHydrated, isAuthenticated, user]);

  const handleComplete = () => {
    console.log('[COMPLETE PROFILE] Profile completion successful, navigating to home');
    router.replace('/home');
  };

  // Show loading while auth state is loading
  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // If profile is already complete, redirect to appropriate dashboard
  if (user && user.needsProfileCompletion === false && user.role !== 'user' && user.role !== 'guest') {
    console.log('[COMPLETE PROFILE] Profile already complete, redirecting to dashboard');
    router.replace('/home');
    return null;
  }

  // Show profile completion form for authenticated users who need it
  // This includes users with session cookies from OAuth
  if (!user) {
    console.log('[COMPLETE PROFILE] No user data yet, showing form anyway for OAuth users');
  }

  return (
    <ProfileCompletionFlow
      onComplete={handleComplete}
      showSkip={false}
    />
  );
}