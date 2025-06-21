import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Button, Text, VStack, Card, CardContent, CardHeader, CardTitle } from '@/components/universal';
import { useAuth } from '@/hooks/useAuth';
import { authClient } from '@/lib/auth/auth-client';
import { sessionManager } from '@/lib/auth/auth-session-manager';
import { logger } from '@/lib/core/debug/unified-logger';
import { api } from '@/lib/api/trpc';

export default function DebugSignOutScreen() {
  const { user, isAuthenticated } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = async () => {
    setIsLoading(true);
    const info: any = {};
    
    try {
      // Get session via tRPC
      try {
        const session = await api.auth.getSession.query();
        info.session = {
          hasSession: !!session,
          sessionId: session?.session?.id,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          userRole: session?.user?.role,
        };
      } catch (error) {
        info.session = { error: error.message };
      }
      
      // Check auth client methods
      info.authClientMethods = Object.keys(authClient).filter(key => typeof authClient[key] === 'function');
      
      // Get token
      const token = sessionManager.getSessionToken();
      info.token = token ? `${token.substring(0, 30)}...` : 'None';
      
      // Debug storage
      info.storage = await sessionManager.debugTokenStorage();
      
      // Sign out functionality is tested via the buttons below
      
    } catch (error) {
      info.error = error.message;
    }
    
    setDebugInfo(info);
    setIsLoading(false);
  };

  const testDirectSignOut = async () => {
    logger.auth.debug('Testing direct sign out...');
    
    try {
      // Method 1: Direct API call with empty body
      const response = await fetch('/api/auth/sign-out', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Add empty JSON body
      });
      
      logger.auth.debug('Direct API response', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });
      
      if (!response.ok) {
        const text = await response.text();
        logger.auth.error('Error response body', { text });
      } else {
        logger.auth.info('Sign out successful!');
      }
    } catch (error) {
      logger.auth.error('Direct sign out error', error);
    }
  };
  
  const testAuthClientSignOut = async () => {
    logger.auth.debug('Testing authClient.signOut()...');
    
    try {
      const result = await authClient.signOut();
      logger.auth.info('authClient.signOut result', result);
    } catch (error) {
      logger.auth.error('authClient.signOut error', error);
    }
  };

  return (
    <ScrollView className="flex-1 p-4">
      <VStack spacing={4 as any}>
        <Card>
          <CardHeader>
            <CardTitle>Debug Sign Out</CardTitle>
          </CardHeader>
          <CardContent>
            <VStack spacing={3 as any}>
              <Text>User: {user?.email || 'Not logged in'}</Text>
              <Text>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
              
              <Button
                variant="outline"
                onPress={runDebug}
                loading={isLoading}
              >
                Run Debug
              </Button>
              
              <Button
                variant="error"
                onPress={testDirectSignOut}
              >
                Test Direct Sign Out
              </Button>
              
              <Button
                variant="outline"
                onPress={testAuthClientSignOut}
              >
                Test authClient.signOut()
              </Button>
              
              {debugInfo && (
                <View className="mt-4 p-3 bg-muted rounded">
                  <Text className="font-mono text-xs">
                    {JSON.stringify(debugInfo, null, 2)}
                  </Text>
                </View>
              )}
            </VStack>
          </CardContent>
        </Card>
      </VStack>
    </ScrollView>
  );
}