import React from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { Card, CardContent, CardHeader, CardTitle , Badge } from '@/components/universal/display';
import { Text } from '@/components/universal/typography';
import { Button } from '@/components/universal/interaction';
import { VStack, HStack } from '@/components/universal/layout';
import { Symbol } from '@/components/universal/display/Symbols';
import { useConcurrentSessions } from '@/hooks/useAuthSecurity';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '@/lib/theme/provider';
import { Spinner } from '@/components/universal/feedback';
import { showConfirmationAlert } from '@/lib/core/alert';

interface SessionItemProps {
  session: {
    id: string;
    deviceName?: string;
    deviceType?: string;
    ipAddress: string;
    userAgent: string;
    lastActivity: Date;
    createdAt: Date;
    location?: {
      country?: string;
      city?: string;
    };
    isActive: boolean;
    isCurrent?: boolean;
  };
  onTerminate: (sessionId: string) => void;
}

function SessionItem({ session, onTerminate }: SessionItemProps) {
  const theme = useTheme();
  
  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
      case 'ios':
      case 'android':
        return 'smartphone';
      case 'tablet':
        return 'tablet';
      case 'desktop':
      case 'web':
      default:
        return 'desktop-computer';
    }
  };
  
  const getDeviceInfo = () => {
    if (session.deviceName) return session.deviceName;
    
    // Parse user agent for device info
    const ua = session.userAgent.toLowerCase();
    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('ipad')) return 'iPad';
    if (ua.includes('android')) return 'Android Device';
    if (ua.includes('windows')) return 'Windows PC';
    if (ua.includes('mac')) return 'Mac';
    if (ua.includes('linux')) return 'Linux Computer';
    return 'Unknown Device';
  };
  
  const handleTerminate = async () => {
    const confirmed = await showConfirmationAlert(
      'End Session?',
      'This will sign out the device from your account.',
      'End Session',
      'Cancel'
    );
    
    if (confirmed) {
      onTerminate(session.id);
    }
  };
  
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <HStack justify="between" align="start">
          <HStack gap={12} align="start" className="flex-1">
            <View className="mt-1">
              <Symbol
                name={getDeviceIcon(session.deviceType)}
                size={24}
                color={session.isCurrent ? theme.primary : theme.mutedForeground}
              />
            </View>
            
            <VStack gap={4} className="flex-1">
              <HStack gap={8} align="center">
                <Text weight="medium">{getDeviceInfo()}</Text>
                {session.isCurrent && (
                  <Badge variant="default" size="sm">
                    Current
                  </Badge>
                )}
                {!session.isActive && (
                  <Badge variant="secondary" size="sm">
                    Inactive
                  </Badge>
                )}
              </HStack>
              
              <VStack gap={2}>
                {session.location && (
                  <HStack gap={4} align="center">
                    <Symbol name="location" size={14} color={theme.mutedForeground} />
                    <Text size="sm" colorTheme="mutedForeground">
                      {session.location.city && `${session.location.city}, `}
                      {session.location.country || 'Unknown Location'}
                    </Text>
                  </HStack>
                )}
                
                <HStack gap={4} align="center">
                  <Symbol name="network" size={14} color={theme.mutedForeground} />
                  <Text size="sm" colorTheme="mutedForeground">
                    {session.ipAddress}
                  </Text>
                </HStack>
                
                <HStack gap={4} align="center">
                  <Symbol name="clock" size={14} color={theme.mutedForeground} />
                  <Text size="sm" colorTheme="mutedForeground">
                    Last active {formatDistanceToNow(new Date(session.lastActivity))} ago
                  </Text>
                </HStack>
                
                <Text size="xs" colorTheme="mutedForeground">
                  Started {formatDistanceToNow(new Date(session.createdAt))} ago
                </Text>
              </VStack>
            </VStack>
          </HStack>
          
          {!session.isCurrent && (
            <Button
              variant="ghost"
              size="sm"
              onPress={handleTerminate}
            >
              End
            </Button>
          )}
        </HStack>
      </CardContent>
    </Card>
  );
}

export function ActiveSessions() {
  const { sessions, isLoading, terminateSession, sessionCount } = useConcurrentSessions();
  const theme = useTheme();
  
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <Spinner size="lg" />
      </View>
    );
  }
  
  return (
    <VStack gap={16}>
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <VStack gap={12}>
            <HStack justify="between" align="center">
              <Text size="sm" colorTheme="mutedForeground">
                You have {sessionCount} active {sessionCount === 1 ? 'session' : 'sessions'}
              </Text>
              {sessionCount > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onPress={async () => {
                    const confirmed = await showConfirmationAlert(
                      'End All Other Sessions?',
                      'This will sign out all other devices except this one.',
                      'End All',
                      'Cancel'
                    );
                    
                    if (confirmed) {
                      // Terminate all non-current sessions
                      const otherSessions = sessions.filter(s => !s.isCurrent);
                      for (const session of otherSessions) {
                        await terminateSession(session.id);
                      }
                    }
                  }}
                >
                  End All Others
                </Button>
              )}
            </HStack>
            
            <Text size="sm" colorTheme="mutedForeground">
              Review and manage devices that are signed in to your account.
              If you see any unfamiliar devices, end those sessions immediately and change your password.
            </Text>
          </VStack>
        </CardContent>
      </Card>
      
      <ScrollView 
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        className="flex-1"
      >
        {sessions.map((session) => (
          <SessionItem
            key={session.id}
            session={session}
            onTerminate={terminateSession}
          />
        ))}
      </ScrollView>
    </VStack>
  );
}