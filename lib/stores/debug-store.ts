import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface DebugSettings {
  // Logging
  enableTRPCLogging: boolean;
  enableRouterLogging: boolean;
  enableAuthLogging: boolean;
  enablePerformanceLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  // Display
  showDebugPanel: boolean;
  debugPanelPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  debugPanelOpacity: number;
  
  // Network
  showNetworkRequests: boolean;
  showNetworkErrors: boolean;
  interceptNetworkErrors: boolean;
  
  // Performance
  showRenderCount: boolean;
  showFPSMeter: boolean;
  trackMemoryUsage: boolean;
  
  // Development
  enableHotReload: boolean;
  enableFastRefresh: boolean;
  showElementInspector: boolean;
}

interface DebugStore extends DebugSettings {
  // Actions
  updateSettings: (settings: Partial<DebugSettings>) => void;
  resetSettings: () => void;
  toggleDebugPanel: () => void;
  setLogLevel: (level: DebugSettings['logLevel']) => void;
  
  // Helpers
  shouldLog: (level: DebugSettings['logLevel']) => boolean;
}

const defaultSettings: DebugSettings = {
  // Logging
  enableTRPCLogging: __DEV__,
  enableRouterLogging: __DEV__,
  enableAuthLogging: __DEV__,
  enablePerformanceLogging: false,
  logLevel: 'debug',
  
  // Display
  showDebugPanel: __DEV__,
  debugPanelPosition: 'bottom-right',
  debugPanelOpacity: 1,
  
  // Network
  showNetworkRequests: __DEV__,
  showNetworkErrors: true,
  interceptNetworkErrors: __DEV__,
  
  // Performance
  showRenderCount: false,
  showFPSMeter: false,
  trackMemoryUsage: false,
  
  // Development
  enableHotReload: __DEV__,
  enableFastRefresh: __DEV__,
  showElementInspector: false,
};

const storage = Platform.OS === 'web' 
  ? {
      getItem: (name: string) => {
        const value = localStorage.getItem(name);
        return value ? JSON.parse(value) : null;
      },
      setItem: (name: string, value: any) => {
        localStorage.setItem(name, JSON.stringify(value));
      },
      removeItem: (name: string) => {
        localStorage.removeItem(name);
      },
    }
  : {
      getItem: async (name: string) => {
        const value = await AsyncStorage.getItem(name);
        return value ? JSON.parse(value) : null;
      },
      setItem: async (name: string, value: any) => {
        await AsyncStorage.setItem(name, JSON.stringify(value));
      },
      removeItem: async (name: string) => {
        await AsyncStorage.removeItem(name);
      },
    };

const logLevelPriority = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export const useDebugStore = create<DebugStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...defaultSettings,
        
        updateSettings: (settings) =>
          set((state) => {
            Object.assign(state, settings);
          }),
          
        resetSettings: () =>
          set(() => ({
            ...defaultSettings,
          })),
          
        toggleDebugPanel: () =>
          set((state) => {
            state.showDebugPanel = !state.showDebugPanel;
          }),
          
        setLogLevel: (level) =>
          set((state) => {
            state.logLevel = level;
          }),
          
        shouldLog: (level) => {
          const currentLevel = get().logLevel;
          return logLevelPriority[level] >= logLevelPriority[currentLevel];
        },
      })),
      {
        name: 'debug-settings',
        storage: storage as any,
        partialize: (state) => ({
          enableTRPCLogging: state.enableTRPCLogging,
          enableRouterLogging: state.enableRouterLogging,
          enableAuthLogging: state.enableAuthLogging,
          enablePerformanceLogging: state.enablePerformanceLogging,
          logLevel: state.logLevel,
          debugPanelPosition: state.debugPanelPosition,
          debugPanelOpacity: state.debugPanelOpacity,
          showNetworkRequests: state.showNetworkRequests,
          showNetworkErrors: state.showNetworkErrors,
        }),
      }
    ),
    {
      name: 'debug-store',
    }
  )
);