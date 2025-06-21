/**
 * Global error store for tracking application errors
 */

import { create } from 'zustand';

interface ErrorInfo {
  message: string;
  code?: string;
  stack?: string;
  timestamp: Date;
  context?: Record<string, any>;
}

interface ErrorStore {
  error: ErrorInfo | null;
  errorHistory: ErrorInfo[];
  setError: (error: Error | ErrorInfo | string, context?: Record<string, any>) => void;
  clearError: () => void;
  clearHistory: () => void;
}

export const useErrorStore = create<ErrorStore>((set) => ({
  error: null,
  errorHistory: [],

  setError: (error, context) => {
    const errorInfo: ErrorInfo = {
      message: typeof error === 'string' ? error : error.message,
      code: typeof error === 'object' && 'code' in error ? error.code : undefined,
      stack: typeof error === 'object' && 'stack' in error ? error.stack : undefined,
      timestamp: new Date(),
      context,
    };

    set((state) => ({
      error: errorInfo,
      errorHistory: [...state.errorHistory, errorInfo].slice(-50), // Keep last 50 errors
    }));
  },

  clearError: () => set({ error: null }),
  
  clearHistory: () => set({ errorHistory: [] }),
}));