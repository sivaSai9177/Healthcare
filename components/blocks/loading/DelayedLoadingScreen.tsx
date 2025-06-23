import React, { useEffect, useState } from 'react';
import { AppLoadingScreen } from './AppLoadingScreen';

export const DelayedLoadingScreen = ({ 
  isLoading,
  children,
  minDisplayTime = 1500, // Minimum time to show the loader
  showProgress = true,
  progress = undefined
}: {
  isLoading: boolean;
  children: React.ReactNode;
  minDisplayTime?: number;
  showProgress?: boolean;
  progress?: number;
}) => {
  const [showLoader, setShowLoader] = useState(isLoading);
  const [minimumTimePassed, setMinimumTimePassed] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShowLoader(true);
      setMinimumTimePassed(false);
      
      const timer = setTimeout(() => {
        setMinimumTimePassed(true);
      }, minDisplayTime);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, minDisplayTime]);

  useEffect(() => {
    // Hide loader only when both conditions are met:
    // 1. Loading is complete (!isLoading)
    // 2. Minimum display time has passed
    if (!isLoading && minimumTimePassed) {
      setShowLoader(false);
    }
  }, [isLoading, minimumTimePassed]);

  if (showLoader) {
    return <AppLoadingScreen showProgress={showProgress} progress={progress} />;
  }

  return <>{children}</>;
};