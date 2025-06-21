/**
 * Main Types Barrel Export
 * Central export point for all TypeScript type definitions
 */

// Core Types
export * from './auth';
export * from './components';
export * from './healthcare';

// API Types (careful with circular dependencies)
export type { AppRouter } from './api';

// Common Types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys];

// Platform Types
export type Platform = 'ios' | 'android' | 'web';

// Theme Types (re-export from design system)
export type { ExtendedTheme, ThemeDefinition } from '@/lib/theme/registry';
export type { SpacingDensity } from '@/lib/design/spacing';
export type { ColorScheme } from '@/contexts/ColorSchemeContext';

// Animation Types
export type { AnimationType, DurationType } from '@/lib/ui/animations/constants';