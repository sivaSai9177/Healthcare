/**
 * SpacingContext - Backward compatibility wrapper
 * This file now wraps the Zustand store to maintain compatibility
 * with components that still import from SpacingContext
 */
import React from 'react';
import { useSpacingStore } from '@/lib/stores/spacing-store';
import type { SpacingDensity, SpacingScale } from '@/lib/design/spacing';

// Re-export the Zustand hook as useSpacing for backward compatibility
export const useSpacing = useSpacingStore;

// Dummy provider for backward compatibility - not needed with Zustand
export function SpacingProvider({ children }: { children: React.ReactNode }) {
  // Zustand doesn't need a provider, so we just return children
  return <>{children}</>;
}

// Hook for responsive values based on density
export function useResponsive<T>(values: { compact: T; medium: T; large: T }): T {
  const { density } = useSpacingStore();
  return values[density];
}