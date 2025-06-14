import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigationContainerRef } from '@react-navigation/native';

interface NavigationReadyContextType {
  isNavigationReady: boolean;
}

const NavigationReadyContext = createContext<NavigationReadyContextType>({
  isNavigationReady: false,
});

export function NavigationReadyProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    // Check if navigation is already ready
    if (navigationRef.isReady()) {
      setIsReady(true);
    } else {
      // Wait for navigation to be ready
      const unsubscribe = navigationRef.addListener('state', () => {
        setIsReady(navigationRef.isReady());
      });

      return unsubscribe;
    }
  }, [navigationRef]);

  return (
    <NavigationReadyContext.Provider value={{ isNavigationReady: isReady }}>
      {children}
    </NavigationReadyContext.Provider>
  );
}

export function useNavigationReady() {
  const context = useContext(NavigationReadyContext);
  if (context === undefined) {
    throw new Error('useNavigationReady must be used within a NavigationReadyProvider');
  }
  return context.isNavigationReady;
}