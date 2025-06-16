import React, { useEffect } from 'react';
import { useThemeStore } from '@/lib/stores/theme-store';
import { logger } from '@/lib/core/debug/unified-logger';

export function ThemeSync() {
  const themeId = useThemeStore((state) => state.themeId);
  const theme = useThemeStore((state) => state.theme);
  const colorScheme = useThemeStore((state) => state.getEffectiveColorScheme());
  
  useEffect(() => {
    logger.debug('ThemeSync: Current theme state', 'THEME', {
      themeId,
      colorScheme,
      backgroundColor: theme.background,
      primaryColor: theme.primary,
    });
  }, [themeId, theme, colorScheme]);
  
  return null;
}