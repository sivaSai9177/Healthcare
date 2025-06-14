import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { AlertCircle } from '@/components/universal/display/Symbols';
import { Button, Text, VStack, Progress } from '@/components/universal';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/universal/overlay/Dialog';
import { sessionTimeoutManager } from '@/lib/auth/session-timeout-manager';
import { log } from '@/lib/core/debug/logger';
import { signOut } from '@/lib/auth/signout-manager';

interface SessionTimeoutWarningProps {
  open: boolean;
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionTimeoutWarning({ open, onExtend, onLogout }: SessionTimeoutWarningProps) {
  const [remainingTime, setRemainingTime] = useState(0);
  
  useEffect(() => {
    if (!open) return;
    
    // Update remaining time every second
    const interval = setInterval(() => {
      const remaining = sessionTimeoutManager.getRemainingTime();
      setRemainingTime(Math.ceil(remaining / 1000)); // Convert to seconds
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [open]);
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleExtend = () => {
    log.info('User extended session from timeout warning', 'SESSION_TIMEOUT');
    sessionTimeoutManager.extendSession();
    onExtend();
  };
  
  const handleLogout = async () => {
    log.info('User chose to logout from timeout warning', 'SESSION_TIMEOUT');
    
    // Use signout manager for comprehensive cleanup
    await signOut({
      reason: 'user_initiated',
      showAlert: false,
      redirectTo: '/(auth)/login'
    });
    
    onLogout();
  };
  
  const progressPercentage = (remainingTime / 300) * 100; // 5 minutes = 300 seconds
  
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <View className="items-center mb-4">
            <AlertCircle
              size={48}
              color="#f59e0b"
              style={{ marginBottom: 8 }}
            />
          </View>
          <DialogTitle className="text-center">
            Session Expiring Soon
          </DialogTitle>
        </DialogHeader>
        
        <VStack gap={16}>
          <Text size="sm" colorTheme="mutedForeground" className="text-center">
            Your session will expire due to inactivity. Would you like to continue?
          </Text>
          
          <View className="items-center">
            <Text size="2xl" weight="semibold" className="mb-2">
              {formatTime(remainingTime)}
            </Text>
            <Progress value={progressPercentage} className="w-full" />
          </View>
          
          <VStack gap={8}>
            <Button
              onPress={handleExtend}
              variant="default"
              size="lg"
              className="w-full"
            >
              Continue Session
            </Button>
            
            <Button
              onPress={handleLogout}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Logout
            </Button>
          </VStack>
        </VStack>
      </DialogContent>
    </Dialog>
  );
}