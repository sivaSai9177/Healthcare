import React, { useState } from 'react';
import { Platform, Pressable, Dimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/core/utils';
import {
  Box,
  HStack,
  VStack,
  Text,
  Container,
  Button,
  Badge,
  Avatar,
  Separator,
  DropdownMenu,
  Drawer,
  Command,
} from '@/components/universal';
import { ThemeSelector } from '@/components/blocks/theme/ThemeSelector/ThemeSelector';
import { logger } from '@/lib/core/debug/unified-logger';
import { Symbol } from '@/components/universal/display/Symbols';
import { CommandItem } from '@/components/universal/interaction/Command';

interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string | number;
  requiresAuth?: boolean;
  requiresRole?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/(app)/(tabs)/home', icon: 'house' },
  { label: 'Alerts', href: '/(app)/(tabs)/alerts', icon: 'bell', badge: 3 },
  { label: 'Patients', href: '/(app)/(tabs)/patients', icon: 'heart' },
  { label: 'Analytics', href: '/(app)/(tabs)/response-analytics', icon: 'chart.bar' },
  { label: 'Activity', href: '/(app)/(tabs)/activity-logs', icon: 'clock' },
];

export function WebNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { width } = Dimensions.get('window');
  const isMobile = width < 768;

  // Search command items
  const searchItems: CommandItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'house',
      onSelect: () => {
        router.push('/(app)/(tabs)/home');
        setSearchOpen(false);
      },
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: 'bell',
      onSelect: () => {
        router.push('/(app)/(tabs)/alerts');
        setSearchOpen(false);
      },
    },
    {
      id: 'patients',
      label: 'Patients',
      icon: 'heart',
      onSelect: () => {
        router.push('/(app)/(tabs)/patients');
        setSearchOpen(false);
      },
    },
    {
      id: 'create-alert',
      label: 'Create Alert',
      icon: 'plus.circle',
      shortcut: '⌘A',
      onSelect: () => {
        router.push('/(modals)/create-alert');
        setSearchOpen(false);
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'gearshape',
      shortcut: '⌘,',
      onSelect: () => {
        router.push('/(app)/(tabs)/settings');
        setSearchOpen(false);
      },
    },
  ];

  const handleNavClick = (href: string) => {
    logger.debug('Navigation', 'ROUTER', { href, pathname });
    router.push(href as any);
    setMobileMenuOpen(false);
  };

  const isActiveRoute = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleSignOut = async () => {
    try {
      await logout();
      router.replace('/(public)/auth/login');
    } catch (error) {
      logger.error('Sign out failed', 'AUTH', error);
    }
  };

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <>
      <Box
        className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <Container maxWidth="2xl">
          <HStack
            spacing={4}
            align="center"
            justify="between"
            style={{ height: 64 }}
          >
            {/* Logo and Brand */}
            <HStack spacing={6} align="center">
              <Pressable onPress={() => handleNavClick('/(app)/(tabs)/home')}>
                <HStack spacing={3} align="center">
                  <Symbol name="cross" size={32} className="text-primary" />
                  <Text size="xl" weight="bold">
                    HealthCare
                  </Text>
                </HStack>
              </Pressable>

              {/* Desktop Navigation */}
              {!isMobile && (
                <HStack spacing={1} align="center">
                  {navItems.map((item) => (
                    <Pressable
                      key={item.href}
                      onPress={() => handleNavClick(item.href)}
                    >
                      <HStack
                        spacing={2}
                        align="center"
                        className={cn(
                          'px-3 py-2 rounded-md transition-colors',
                          isActiveRoute(item.href)
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent/10 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {item.icon && (
                          <Symbol name={item.icon as any} size={16} />
                        )}
                        <Text size="sm" weight="medium">
                          {item.label}
                        </Text>
                        {item.badge && (
                          <Badge variant="error" size="sm">
                            {item.badge}
                          </Badge>
                        )}
                      </HStack>
                    </Pressable>
                  ))}
                </HStack>
              )}
            </HStack>

            {/* Right Side Actions */}
            <HStack spacing={2} align="center">
              {/* Search Button */}
              <Button
                variant="ghost"
                size="icon"
                onPress={() => setSearchOpen(true)}
                accessibilityLabel="Search"
              >
                <Symbol name="magnifyingglass" size={20} />
              </Button>

              {/* Theme Selector */}
              <ThemeSelector />

              {/* Notifications */}
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={() => router.push('/(modals)/notification-center')}
                  accessibilityLabel="Notifications"
                >
                  <Box position="relative">
                    <Symbol name="bell" size={20} />
                    <Box
                      position="absolute"
                      top={-4}
                      right={-4}
                      className="bg-destructive rounded-full w-2 h-2"
                    />
                  </Box>
                </Button>
              )}

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <Pressable
                    onPress={() => setUserMenuOpen(!userMenuOpen)}
                    style={{ position: 'relative' }}
                  >
                    <Avatar
                      name={user.name || 'User'}
                      size="sm"
                      source={user.image ? { uri: user.image } : undefined}
                    />
                  </Pressable>
                  {userMenuOpen && (
                    <Box
                      position="absolute"
                      top={50}
                      right={0}
                      className="bg-card border border-border rounded-lg shadow-lg"
                      style={{ minWidth: 200, zIndex: 100 }}
                    >
                      <VStack spacing={1} p={2}>
                        <Box px={2} py={1}>
                          <Text size="sm" weight="medium">
                            {user.name}
                          </Text>
                          <Text size="xs" className="text-muted-foreground">
                            {user.email}
                          </Text>
                        </Box>
                        <Separator />
                        <Pressable
                          onPress={() => {
                            handleNavClick('/(app)/profile');
                            setUserMenuOpen(false);
                          }}
                          className="px-2 py-2 rounded hover:bg-accent"
                        >
                          <HStack spacing={2} align="center">
                            <Symbol name="person.circle" size={16} />
                            <Text size="sm">Profile</Text>
                          </HStack>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            handleNavClick('/(app)/(tabs)/settings');
                            setUserMenuOpen(false);
                          }}
                          className="px-2 py-2 rounded hover:bg-accent"
                        >
                          <HStack spacing={2} align="center">
                            <Symbol name="gearshape" size={16} />
                            <Text size="sm">Settings</Text>
                          </HStack>
                        </Pressable>
                        <Separator />
                        <Pressable
                          onPress={() => {
                            handleSignOut();
                            setUserMenuOpen(false);
                          }}
                          className="px-2 py-2 rounded hover:bg-accent"
                        >
                          <HStack spacing={2} align="center">
                            <Symbol name="arrow.right.square" size={16} />
                            <Text size="sm" className="text-destructive">
                              Sign Out
                            </Text>
                          </HStack>
                        </Pressable>
                      </VStack>
                    </Box>
                  )}
                </DropdownMenu>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onPress={() => router.push('/(public)/auth/login')}
                >
                  Sign In
                </Button>
              )}

              {/* Mobile Menu Button */}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onPress={() => setMobileMenuOpen(true)}
                  accessibilityLabel="Menu"
                >
                  <Symbol name="line.3.horizontal" size={20} />
                </Button>
              )}
            </HStack>
          </HStack>
        </Container>
      </Box>

      {/* Search Command Palette */}
      <Command
        open={searchOpen}
        onOpenChange={setSearchOpen}
        items={searchItems}
        placeholder="Search for commands..."
        emptyMessage="No results found."
      />

      {/* Mobile Menu Drawer */}
      <Drawer
        visible={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        position="right"
        size="sm"
      >
        <Box flex={1} className="bg-background">
          <HStack
            spacing={3}
            align="center"
            justify="between"
            p={4}
            className="border-b border-border"
          >
            <Text size="lg" weight="bold">
              Menu
            </Text>
            <Button
              variant="ghost"
              size="icon"
              onPress={() => setMobileMenuOpen(false)}
            >
              <Symbol name="xmark" size={20} />
            </Button>
          </HStack>

          <VStack spacing={1} p={4}>
            {navItems.map((item) => (
              <Pressable
                key={item.href}
                onPress={() => handleNavClick(item.href)}
                className={cn(
                  'px-3 py-3 rounded-lg',
                  isActiveRoute(item.href)
                    ? 'bg-accent'
                    : 'hover:bg-accent/10'
                )}
              >
                <HStack spacing={3} align="center">
                  {item.icon && (
                    <Symbol
                      name={item.icon as any}
                      size={20}
                      className={
                        isActiveRoute(item.href)
                          ? 'text-accent-foreground'
                          : 'text-foreground'
                      }
                    />
                  )}
                  <Text
                    weight={isActiveRoute(item.href) ? 'medium' : 'normal'}
                    className={
                      isActiveRoute(item.href)
                        ? 'text-accent-foreground'
                        : 'text-foreground'
                    }
                  >
                    {item.label}
                  </Text>
                  {item.badge && (
                    <Badge variant="error" size="sm">
                      {item.badge}
                    </Badge>
                  )}
                </HStack>
              </Pressable>
            ))}

            <Separator my={2} />

            {user && (
              <>
                <Pressable
                  onPress={() => handleNavClick('/(app)/profile')}
                  className="px-3 py-3 rounded-lg hover:bg-accent/10"
                >
                  <HStack spacing={3} align="center">
                    <Symbol name="person.circle" size={20} />
                    <Text>Profile</Text>
                  </HStack>
                </Pressable>
                <Pressable
                  onPress={() => handleNavClick('/(app)/(tabs)/settings')}
                  className="px-3 py-3 rounded-lg hover:bg-accent/10"
                >
                  <HStack spacing={3} align="center">
                    <Symbol name="gearshape" size={20} />
                    <Text>Settings</Text>
                  </HStack>
                </Pressable>
              </>
            )}
          </VStack>

          {user && (
            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              p={4}
              className="border-t border-border"
            >
              <VStack spacing={3}>
                <HStack spacing={3} align="center">
                  <Avatar
                    name={user.name || 'User'}
                    size="sm"
                    source={user.image ? { uri: user.image } : undefined}
                  />
                  <VStack spacing={0} flex={1}>
                    <Text size="sm" weight="medium" numberOfLines={1}>
                      {user.name}
                    </Text>
                    <Text
                      size="xs"
                      className="text-muted-foreground"
                      numberOfLines={1}
                    >
                      {user.email}
                    </Text>
                  </VStack>
                </HStack>
                <Button
                  variant="outline"
                  fullWidth
                  onPress={handleSignOut}
                  leftIcon={<Symbol name="arrow.right.square" size={16} />}
                >
                  Sign Out
                </Button>
              </VStack>
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  );
}