import React, { useState } from 'react';
import { Platform, Pressable, Dimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
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
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/universal';
import { ThemeSelector } from '@/components/blocks/theme/ThemeSelector/ThemeSelector';
import { log } from '@/lib/core/debug/logger';
import { Symbol } from '@/components/universal/display/Symbols';
import { SpacingScale } from '@/lib/design';
import { useBreakpoint } from '@/hooks/responsive';

interface NavItem {
  label: string;
  href: string;
  icon?: keyof typeof any;
  badge?: string | number;
  requiresAuth?: boolean;
  requiresRole?: string;
}

interface WebNavBarProps {
  variant?: 'default' | 'minimal' | 'dashboard';
  showSearch?: boolean;
  showThemeSelector?: boolean;
  customLogo?: React.ReactNode;
}

export const WebNavBar: React.FC<WebNavBarProps> = ({
  variant = 'default',
  showSearch = true,
  showThemeSelector = true,
  customLogo,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { spacing } = useSpacing();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [isHovered, setIsHovered] = useState<string | null>(null);

  // Check if we're on small screen
  const dimensions = Dimensions.get('window');
  const isMobile = dimensions.width < 768;

  // Navigation items
  const navItems: NavItem[] = [
    { label: 'Home', href: '/(home)', icon: 'home-outline' },
    { label: 'Explore', href: '/(home)/explore', icon: 'compass-outline' },
    { label: 'Components', href: '/(home)/demo-universal', icon: 'cube-outline' },
  ];

  // Add admin/manager items based on role
  if (user?.role === 'admin') {
    navItems.push({ 
      label: 'Admin', 
      href: '/(home)/admin-dashboard', 
      icon: 'shield-checkmark-outline',
      requiresRole: 'admin',
      badge: 'NEW' 
    });
  }

  const handleNavigation = (href: string) => {
    log.info('Navigation triggered', 'WEB_NAV_BAR', { href, pathname });
    router.push(href as any);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    log.info('Logout triggered', 'WEB_NAV_BAR');
    await logout();
    router.replace('/(auth)/login' as any);
  };

  const handleCommand = (command: string) => {
    setCommandOpen(false);
    switch (command) {
      case 'home':
        handleNavigation('/(home)');
        break;
      case 'explore':
        handleNavigation('/(home)/explore');
        break;
      case 'components':
        handleNavigation('/(home)/demo-universal');
        break;
      case 'admin':
        if (user?.role === 'admin') {
          handleNavigation('/(home)/admin-dashboard');
        }
        break;
      case 'settings':
        handleNavigation('/(home)/settings');
        break;
      case 'logout':
        handleLogout();
        break;
      case 'theme':
        // Open theme selector
        break;
    }
  };

  // Check if current route is active
  const isActive = (href: string) => {
    if (href === '/(home)' && pathname === '/(home)') return true;
    return pathname.startsWith(href);
  };

  // Desktop Navigation
  const desktopNav = (
    <Box
      bgTheme="background"
      borderBottomWidth={1}
      borderTheme="border"
      className="sticky top-0 z-50"
      style={{
        ...(Platform.OS === 'web' && {
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }),
      }}
    >
      <Container>
        <HStack
          py={3 as SpacingScale}
          px={4 as SpacingScale}
          justifyContent="space-between"
          alignItems="center"
        >
          {/* Left Section - Logo & Navigation */}
          <HStack spacing={8} alignItems="center" flex={1}>
            {/* Logo */}
            <Pressable onPress={() => handleNavigation('/(home)')}>
              {customLogo || (
                <HStack spacing={2} alignItems="center">
                  <Symbol name="airplane" size={28} className="text-primary" />
                  <Text size="xl" weight="bold">
                    MyExpo
                  </Text>
                </HStack>
              )}
            </Pressable>

            {/* Navigation Items - Desktop Only */}
            {!isMobile && (
              <HStack spacing={1} alignItems="center">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  const hovered = isHovered === item.label;

                  return (
                    <Pressable
                      key={item.label}
                      onPress={() => handleNavigation(item.href)}
                      onHoverIn={() => setIsHovered(item.label)}
                      onHoverOut={() => setIsHovered(null)}
                      className={cn(
                        "px-3 py-2 rounded-md transition-all",
                        active && "bg-accent",
                        hovered && !active && "bg-muted",
                        Platform.OS === 'web' && "cursor-pointer"
                      )}
                    >
                      <HStack spacing={2} alignItems="center">
                        {item.icon && (
                          <Symbol
                            name={item.icon as any}
                            size={18}
                            className={active ? "text-accent-foreground" : "text-foreground"}
                          />
                        )}
                        <Text
                          size="sm"
                          weight={active ? 'medium' : 'normal'}
                          className={active ? "text-accent-foreground" : "text-foreground"}
                        >
                          {item.label}
                        </Text>
                        {item.badge && (
                          <Badge variant="secondary" size="sm">
                            {item.badge}
                          </Badge>
                        )}
                      </HStack>
                    </Pressable>
                  );
                })}
              </HStack>
            )}
          </HStack>

          {/* Right Section - Actions */}
          <HStack spacing={2} alignItems="center">
            {/* Search - Desktop Only */}
            {showSearch && !isMobile && (
              <Button
                variant="outline"
                size="sm"
                onPress={() => setCommandOpen(true)}
              >
                <HStack spacing={2} alignItems="center">
                  <Symbol name="magnifyingglass" size={16} className="text-muted-foreground" />
                  <Text size="sm" colorTheme="mutedForeground">
                    Search...
                  </Text>
                  <Badge variant="secondary" size="sm">
                    ⌘K
                  </Badge>
                </HStack>
              </Button>
            )}

            {/* Theme Selector */}
            {showThemeSelector && <ThemeSelector />}

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <HStack spacing={2} alignItems="center">
                      <Avatar
                        name={user?.name || user?.email}
                        size="xs"
                      />
                      {!isMobile && (
                        <Text size="sm" weight="medium">
                          {user?.name || 'User'}
                        </Text>
                      )}
                    </HStack>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" minWidth={200}>
                  <DropdownMenuLabel>
                    <VStack spacing={1}>
                      <Text weight="medium">{user?.name || 'User'}</Text>
                      <Text size="xs" colorTheme="mutedForeground">
                        {user?.email}
                      </Text>
                    </VStack>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onPress={() => handleNavigation('/(home)/settings')}>
                    <HStack spacing={2} alignItems="center">
                      <Symbol name="person" size={16} />
                      <Text>Profile</Text>
                    </HStack>
                  </DropdownMenuItem>
                  <DropdownMenuItem onPress={() => handleNavigation('/(home)/settings')}>
                    <HStack spacing={2} alignItems="center">
                      <Symbol name="gearshape" size={16} />
                      <Text>Settings</Text>
                    </HStack>
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onPress={() => handleNavigation('/(home)/admin-dashboard')}>
                        <HStack spacing={2} alignItems="center">
                          <Symbol name="shield.checkmark" size={16} />
                          <Text>Admin Dashboard</Text>
                        </HStack>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onPress={handleLogout}>
                    <HStack spacing={2} alignItems="center">
                      <Symbol name="rectangle.portrait.and.arrow.right" size={16} />
                      <Text>Logout</Text>
                    </HStack>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <HStack spacing={2}>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => router.push('/(auth)/login' as any)}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onPress={() => router.push('/(auth)/register' as any)}
                >
                  Get Started
                </Button>
              </HStack>
            )}

            {/* Mobile Menu Toggle */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setMobileMenuOpen(true)}
              >
                <Symbol name="line.3.horizontal" size={24} className="text-foreground" />
              </Button>
            )}
          </HStack>
        </HStack>
      </Container>
    </Box>
  );

  // Mobile Navigation Drawer
  const mobileNav = (
    <Drawer
      open={mobileMenuOpen}
      onOpenChange={setMobileMenuOpen}
      position="right"
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Menu</DrawerTitle>
          <DrawerClose />
        </DrawerHeader>

        <VStack spacing={4} p={4 as SpacingScale}>
          {/* User Info */}
          {isAuthenticated && (
            <>
              <HStack spacing={3} alignItems="center" p={3 as SpacingScale} bgTheme="muted" rounded="md">
                <Avatar name={user?.name || user?.email} size="md" />
                <VStack spacing={0} flex={1}>
                  <Text weight="medium">{user?.name || 'User'}</Text>
                  <Text size="sm" colorTheme="mutedForeground">
                    {user?.email}
                  </Text>
                </VStack>
              </HStack>
              <Separator />
            </>
          )}

          {/* Navigation Items */}
          <VStack spacing={1}>
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Button
                  key={item.label}
                  variant={active ? 'secondary' : 'ghost'}
                  fullWidth
                  justifyContent="flex-start"
                  onPress={() => handleNavigation(item.href)}
                >
                  <HStack spacing={3} alignItems="center" flex={1}>
                    {item.icon && (
                      <Symbol
                        name={item.icon as any}
                        size={20}
                        className={active ? "text-primary" : "text-foreground"}
                      />
                    )}
                    <Text flex={1} weight={active ? 'medium' : 'normal'}>
                      {item.label}
                    </Text>
                    {item.badge && (
                      <Badge variant="secondary" size="sm">
                        {item.badge}
                      </Badge>
                    )}
                  </HStack>
                </Button>
              );
            })}
          </VStack>

          <Separator />

          {/* Additional Actions */}
          <VStack spacing={1}>
            {showSearch && (
              <Button
                variant="ghost"
                fullWidth
                justifyContent="flex-start"
                onPress={() => {
                  setMobileMenuOpen(false);
                  setCommandOpen(true);
                }}
              >
                <HStack spacing={3} alignItems="center">
                  <Symbol name="magnifyingglass" size={20} className="text-foreground" />
                  <Text>Search</Text>
                </HStack>
              </Button>
            )}

            <Button
              variant="ghost"
              fullWidth
              justifyContent="flex-start"
              onPress={() => handleNavigation('/(home)/settings')}
            >
              <HStack spacing={3} alignItems="center">
                <Symbol name="gearshape" size={20} className="text-foreground" />
                <Text>Settings</Text>
              </HStack>
            </Button>

            {isAuthenticated ? (
              <Button
                variant="ghost"
                fullWidth
                justifyContent="flex-start"
                onPress={handleLogout}
              >
                <HStack spacing={3} alignItems="center">
                  <Symbol name="rectangle.portrait.and.arrow.right" size={20} className="text-foreground" />
                  <Text>Logout</Text>
                </HStack>
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  fullWidth
                  onPress={() => {
                    setMobileMenuOpen(false);
                    router.push('/(auth)/login' as any);
                  }}
                >
                  Sign In
                </Button>
                <Button
                  fullWidth
                  onPress={() => {
                    setMobileMenuOpen(false);
                    router.push('/(auth)/register' as any);
                  }}
                >
                  Get Started
                </Button>
              </>
            )}
          </VStack>
        </VStack>
      </DrawerContent>
    </Drawer>
  );

  // Command Palette  
  const commandPalette = commandOpen && Platform.OS === 'web' && (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      className="bg-background/95 z-50"
      onTouchEnd={() => setCommandOpen(false)}
    >
      <Box
        position="absolute"
        top="20%"
        left="50%"
        style={{
          transform: [{ translateX: -200 }],
          width: 400,
          maxWidth: '90%',
        }}
      >
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            
            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => handleCommand('home')}>
                <Symbol name="house" size={16} />
                <Text ml={2}>Home</Text>
              </CommandItem>
              <CommandItem onSelect={() => handleCommand('explore')}>
                <Symbol name="safari" size={16} />
                <Text ml={2}>Explore</Text>
              </CommandItem>
              <CommandItem onSelect={() => handleCommand('components')}>
                <Symbol name="cube" size={16} />
                <Text ml={2}>Components</Text>
              </CommandItem>
              {user?.role === 'admin' && (
                <CommandItem onSelect={() => handleCommand('admin')}>
                  <Symbol name="shield.checkmark" size={16} />
                  <Text ml={2}>Admin Dashboard</Text>
                  <CommandShortcut>⌘A</CommandShortcut>
                </CommandItem>
              )}
            </CommandGroup>

            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => handleCommand('theme')}>
                <Symbol name="paintpalette" size={16} />
                <Text ml={2}>Change Theme</Text>
                <CommandShortcut>⌘T</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => handleCommand('settings')}>
                <Symbol name="gearshape" size={16} />
                <Text ml={2}>Settings</Text>
                <CommandShortcut>⌘,</CommandShortcut>
              </CommandItem>
              {isAuthenticated && (
                <CommandItem onSelect={() => handleCommand('logout')}>
                  <Symbol name="rectangle.portrait.and.arrow.right" size={16} />
                  <Text ml={2}>Logout</Text>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </Box>
    </Box>
  );

  return (
    <>
      {desktopNav}
      {mobileNav}
      {commandPalette}
    </>
  );
};