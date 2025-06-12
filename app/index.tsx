import { router, useSegments } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { View, ActivityIndicator, Text, Platform } from "react-native";
import React from "react";
import { useTheme } from '@/lib/theme/provider';

export default function Index() {
  const theme = useTheme();
  const segments = useSegments();
  console.log('[Index] Component rendering');
  const { user, isAuthenticated, hasHydrated } = useAuth();
  console.log('[Index] Auth state:', { isAuthenticated, hasHydrated, user: !!user });
  
  // Use effect for navigation
  React.useEffect(() => {
    if (!hasHydrated) {
      console.log('[Index] Waiting for auth hydration...');
      // Add a timeout to force navigation if hydration takes too long
      const timeout = setTimeout(() => {
        console.log('[Index] Hydration timeout - forcing navigation to login');
        router.replace("/(auth)/login");
      }, 2000); // 2 second timeout
      return () => clearTimeout(timeout);
    }
    
    console.log('[Index] Checking navigation...', {
      isAuthenticated, 
      hasUser: !!user,
      needsProfileCompletion: user?.needsProfileCompletion,
      role: user?.role,
      platform: Platform.OS 
    });
    
    // Add a small delay for iOS to ensure the navigation stack is ready
    const navigationDelay = Platform.OS === 'ios' ? 100 : 0;
    
    const navigateTimer = setTimeout(() => {
      if (!isAuthenticated || !user) {
        console.log('[Index] Navigating to login');
        router.replace("/(auth)/login");
      } else if (user.needsProfileCompletion || !user.role || user.role === 'guest') {
        console.log('[Index] Navigating to complete profile - role:', user.role);
        router.replace("/(auth)/complete-profile");
      } else {
        console.log('[Index] Navigating to home - role:', user.role);
        router.replace("/(home)");
      }
    }, navigationDelay);
    
    return () => clearTimeout(navigateTimer);
  }, [hasHydrated, isAuthenticated, user]);
  
  // 3-second fallback navigation - force navigate if still on index
  React.useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[Index] Fallback navigation check after 3 seconds', {
        hasHydrated,
        isAuthenticated,
        pathname: segments.join('/')
      });
      
      // Force navigation if still on index page
      // The root path will have no segments or the first segment will be empty/undefined
      if (!segments || !segments[0] || segments.join('/') === '') {
        console.log('[Index] Still on root page, forcing navigation to login');
        router.replace("/(auth)/login");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [segments, hasHydrated, isAuthenticated]);
  
  // Show loading while auth state is being hydrated or during navigation
  console.log('[Index] Rendering loading screen');
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: "center", 
      alignItems: "center", 
      backgroundColor: theme.muted 
    }}>
      <ActivityIndicator size="large" color="#000" />
      <Text style={{ 
        marginTop: 20, 
        fontSize: 16, 
        color: theme.foreground,
        fontWeight: '500'
      }}>
        {!hasHydrated ? 'Loading auth state...' : 'Redirecting...'}
      </Text>
      
      {/* Debug information */}
      <View style={{ 
        marginTop: 20, 
        padding: 20, 
        backgroundColor: theme.card,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.border
      }}>
        <Text style={{ fontSize: 14, color: theme.foreground, fontWeight: 'bold' }}>
          Debug Info:
        </Text>
        <Text style={{ fontSize: 12, color: theme.mutedForeground, marginTop: 5 }}>
          Platform: {Platform.OS}
        </Text>
        <Text style={{ fontSize: 12, color: theme.mutedForeground }}>
          Has Hydrated: {hasHydrated ? '✅ Yes' : '❌ No'}
        </Text>
        <Text style={{ fontSize: 12, color: theme.mutedForeground }}>
          Is Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}
        </Text>
        <Text style={{ fontSize: 12, color: theme.mutedForeground }}>
          Has User: {user ? '✅ Yes' : '❌ No'}
        </Text>
        <Text style={{ fontSize: 12, color: theme.mutedForeground, marginTop: 5 }}>
          Theme: {theme.primary ? '✅ Loaded' : '❌ Not loaded'}
        </Text>
      </View>
      
      <Text style={{ 
        marginTop: 20, 
        fontSize: 10, 
        color: theme.mutedForeground,
        textAlign: 'center',
        paddingHorizontal: 20
      }}>
        If stuck here, navigation will force redirect to login in 3 seconds
      </Text>
    </View>
  );
}