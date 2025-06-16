import React from 'react';
import { useRouter } from 'expo-router';
import { ProfileCompletionFlow } from '@/components/blocks/auth';
import { logger } from '@/lib/core/debug/unified-logger';

export default function CompleteProfileScreen() {
  const router = useRouter();
  
  React.useEffect(() => {
    logger.auth.debug('CompleteProfileScreen mounted');
    return () => {
      logger.auth.debug('CompleteProfileScreen unmounted');
    };
  }, []);

  const handleComplete = () => {
    logger.auth.info('Profile completion successful, navigating to home');
    // Navigate to home after successful profile completion
    router.replace('/(app)/(tabs)/home');
  };

  return (
    <ProfileCompletionFlow
      onComplete={handleComplete}
      showSkip={true}
    />
  );
}