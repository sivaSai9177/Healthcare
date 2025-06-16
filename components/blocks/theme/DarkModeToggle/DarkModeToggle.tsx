import React from 'react';
import { Box } from '@/components/universal/layout';
import { Text } from '@/components/universal/typography';
import { Switch } from '@/components/universal/form';
import { useThemeStore } from '@/lib/stores/theme-store';
import { SpacingScale } from '@/lib/design';

export function DarkModeToggle() {
  const colorScheme = useThemeStore((state) => state.getEffectiveColorScheme());
  const toggleColorScheme = useThemeStore((state) => state.toggleColorScheme);
  const useSystemTheme = useThemeStore((state) => state.useSystemTheme);
  const setUseSystemTheme = useThemeStore((state) => state.setUseSystemTheme);

  return (
    <Box 
      flexDirection="row"
      alignItems="center" 
      justifyContent="space-between"
    >
      <Box flexDirection="row" alignItems="center" gap={2 as SpacingScale}>
        <Text size="2xl">
          {colorScheme === 'dark' ? '🌙' : '☀️'}
        </Text>
        <Text 
          size="base" 
          weight="medium"
          colorTheme="foreground"
        >
          Dark Mode
        </Text>
      </Box>
      <Switch
        checked={colorScheme === 'dark'}
        onCheckedChange={toggleColorScheme}
      />
    </Box>
  );
}