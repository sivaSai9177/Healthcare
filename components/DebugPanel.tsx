import React from 'react';
import { Platform } from 'react-native';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Button, 
  Switch,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Separator,
} from '@/components/universal';
import { useTheme } from '@/lib/theme/provider';
import { useSpacingStore } from '@/lib/stores/spacing-store';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { useAuthStore } from '@/lib/stores/auth-store';

export const DebugPanel = () => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const spacingStore = useSpacingStore();
  const animationStore = useAnimationStore();

  if (Platform.OS !== 'web') {
    return null; // Only show on web for now
  }

  return (
    <Box
      position="fixed"
      bottom={20}
      right={20}
      zIndex={9999}
      width={320}
      maxHeight={600}
      overflow="scroll"
      shadow="xl"
    >
      <Card>
        <CardHeader>
          <CardTitle>Debug Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <VStack gap={4}>
            {/* User Info */}
            <Box>
              <Text weight="semibold" size="sm">User Info</Text>
              <Text size="xs" colorTheme="mutedForeground">
                Email: {user?.email || 'Not logged in'}
              </Text>
              <Text size="xs" colorTheme="mutedForeground">
                Role: {user?.role || 'N/A'}
              </Text>
            </Box>

            <Separator />

            {/* Theme Info */}
            <Box>
              <Text weight="semibold" size="sm">Theme</Text>
              <Text size="xs" colorTheme="mutedForeground">
                Background: {theme.background}
              </Text>
              <Text size="xs" colorTheme="mutedForeground">
                Foreground: {theme.foreground}
              </Text>
            </Box>

            <Separator />

            {/* Spacing Controls */}
            <Box>
              <Text weight="semibold" size="sm" mb={2}>Spacing</Text>
              <VStack gap={2}>
                <HStack justifyContent="space-between" alignItems="center">
                  <Text size="xs">Theme:</Text>
                  <Text size="xs" weight="medium">{spacingStore.theme}</Text>
                </HStack>
                <HStack justifyContent="space-between" alignItems="center">
                  <Text size="xs">Density:</Text>
                  <Text size="xs" weight="medium">{spacingStore.density}</Text>
                </HStack>
                <HStack gap={2}>
                  <Button
                    size="small"
                    variant={spacingStore.theme === 'default' ? 'default' : 'outline'}
                    onPress={() => spacingStore.setTheme('default')}
                  >
                    Default
                  </Button>
                  <Button
                    size="small"
                    variant={spacingStore.theme === 'golden' ? 'default' : 'outline'}
                    onPress={() => spacingStore.setTheme('golden')}
                  >
                    Golden
                  </Button>
                </HStack>
              </VStack>
            </Box>

            <Separator />

            {/* Animation Controls */}
            <Box>
              <Text weight="semibold" size="sm" mb={2}>Animations</Text>
              <VStack gap={2}>
                <HStack justifyContent="space-between" alignItems="center">
                  <Text size="xs">Enabled:</Text>
                  <Switch
                    value={animationStore.enableAnimations}
                    onValueChange={animationStore.setEnableAnimations}
                  />
                </HStack>
                <HStack justifyContent="space-between" alignItems="center">
                  <Text size="xs">Debug Mode:</Text>
                  <Switch
                    value={animationStore.debugMode}
                    onValueChange={animationStore.setDebugMode}
                  />
                </HStack>
                <HStack justifyContent="space-between" alignItems="center">
                  <Text size="xs">Speed:</Text>
                  <Text size="xs" weight="medium">{animationStore.animationSpeed}x</Text>
                </HStack>
              </VStack>
            </Box>

            <Separator />

            {/* Platform Info */}
            <Box>
              <Text weight="semibold" size="sm">Platform</Text>
              <Text size="xs" colorTheme="mutedForeground">
                OS: {Platform.OS}
              </Text>
              <Text size="xs" colorTheme="mutedForeground">
                Version: {Platform.Version}
              </Text>
            </Box>
          </VStack>
        </CardContent>
      </Card>
    </Box>
  );
};