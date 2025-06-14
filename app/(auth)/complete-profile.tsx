import React from 'react';
import { useRouter } from 'expo-router';
import { ProfileCompletionFlow } from '@/components/blocks/auth';

export default function CompleteProfileScreen() {
  const router = useRouter();

  const handleComplete = () => {
    // Navigate to home after successful profile completion
    router.replace('/(home)');
  };

  return (
    <ProfileCompletionFlow
      onComplete={handleComplete}
      showSkip={true}
    />
  );
}