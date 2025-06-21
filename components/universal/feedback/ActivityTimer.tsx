import React from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { Text } from '../typography';
import { Symbol } from '../display/Symbols';
import { useTheme } from '@/lib/theme/provider';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/trpc';

interface ActivityTimerProps {
  timeoutMinutes?: number;
  showCountdown?: boolean;
}

export function ActivityTimer({ 
  timeoutMinutes = 5, 
  showCountdown = true 
}: ActivityTimerProps) {
  const { lastActivity, setRefreshing } = useAuth();
  const theme = useTheme();
  const utils = api.useUtils();
  const [timeRemaining, setTimeRemaining] = React.useState<number>(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const lastActivityTime = new Date(lastActivity).getTime();
      const timeSinceActivity = now - lastActivityTime;
      const timeoutMs = timeoutMinutes * 60 * 1000;
      const remaining = Math.max(0, timeoutMs - timeSinceActivity);
      
      setTimeRemaining(Math.floor(remaining / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [lastActivity, timeoutMinutes]);

  const handleManualRefresh = async () => {
    try {
      setRefreshing(true);
      await utils.auth.getSession.fetch();
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't show on mobile by default
  if (Platform.OS !== 'web' && !showCountdown) {
    return null;
  }

  // Only show when time is running low (under 1 minute)
  if (timeRemaining > 60) {
    return null;
  }

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 100,
        right: 20,
        backgroundColor: theme.background,
        borderRadius: 8 as any,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 1,
        borderColor: theme.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View>
          <Text size="xs" weight="medium">
            Session refresh in
          </Text>
          <Text size="sm" weight="bold" colorTheme={timeRemaining < 30 ? 'destructive' : 'primary'}>
            {formatTime(timeRemaining)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleManualRefresh}
          style={{
            padding: 8,
            borderRadius: 6 as any,
            backgroundColor: theme.primary,
          }}
        >
          <Symbol name="arrow.clockwise" size="xs" color={theme.background} />
        </TouchableOpacity>
      </View>
    </View>
  );
}