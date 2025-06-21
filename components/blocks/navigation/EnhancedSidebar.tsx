import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Pressable,
  TextInput,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  Symbol,
  Button,
} from '@/components/universal';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  TeamSwitcher,
  NavUser,
  useSidebar,
} from '@/components/universal/navigation/Sidebar';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAuth } from '@/hooks/useAuth';
import { useHealthcareAccess } from '@/hooks/usePermissions';
import { useAlertStats, useUnreadNotifications } from '@/hooks/healthcare';
import { haptic } from '@/lib/ui/haptics';
import { useDebounce } from '@/hooks/useDebounce';
import { showAlert } from '@/lib/core/alert';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface NavItem {
  id: string;
  title: string;
  icon: string;
  href?: string;
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'error' | 'outline';
  items?: NavItem[];
  requiredPermission?: string;
  shortcut?: string;
  isNew?: boolean;
  isActive?: boolean;
}

interface EnhancedSidebarProps {
  children?: React.ReactNode;
}

export function EnhancedSidebar({ children }: EnhancedSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { user } = useAuth();
  const { isCollapsed, toggleGroup, openGroups } = useSidebar();
  const [searchQuery] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [recentItems, setRecentItems] = useState<string[]>([]);
  
  // Permission checks
  const {
    canViewAlerts,
    canViewPatients,
    canViewAnalytics,
    canManageShifts,
    canViewAuditLogs,
  } = useHealthcareAccess();
  
  // Real-time data for badges using enhanced hooks
  const { data: alertStats } = useAlertStats({
    refetchInterval: 30000,
  });
  
  const { data: notifications } = useUnreadNotifications({
    refetchInterval: 60000,
  });
  
  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Navigation items with permissions
  const navItems: NavItem[] = useMemo(() => [
    {
      id: 'home',
      title: 'Dashboard',
      icon: 'house.fill',
      href: '/(app)/(tabs)/home',
      shortcut: '⌘D',
    },
    ...(canViewAlerts ? [{
      id: 'alerts',
      title: 'Alerts',
      icon: 'bell.badge',
      href: '/(app)/(tabs)/alerts',
      badge: alertStats?.active || 0,
      badgeVariant: 'error' as const,
      shortcut: '⌘A',
      items: [
        {
          id: 'active-alerts',
          title: 'Active Alerts',
          icon: 'bell.fill',
          href: '/(app)/(tabs)/alerts',
          badge: alertStats?.active,
        },
        {
          id: 'escalation-queue',
          title: 'Escalation Queue',
          icon: 'exclamationmark.triangle',
          href: '/(app)/alerts/escalation-queue',
          badge: alertStats?.escalated,
          isNew: true,
        },
        {
          id: 'alert-history',
          title: 'Alert History',
          icon: 'clock.arrow.circlepath',
          href: '/(app)/alerts/history',
        },
      ],
    }] : []),
    ...(canViewPatients ? [{
      id: 'patients',
      title: 'Patients',
      icon: 'person.2.fill',
      href: '/(app)/(tabs)/patients',
      shortcut: '⌘P',
    }] : []),
    ...(canManageShifts ? [{
      id: 'shifts',
      title: 'Shift Management',
      icon: 'calendar.badge.clock',
      items: [
        {
          id: 'shift-schedule',
          title: 'Schedule',
          icon: 'calendar',
          href: '/(app)/shifts/schedule',
        },
        {
          id: 'shift-handover',
          title: 'Handover',
          icon: 'arrow.triangle.2.circlepath',
          href: '/(app)/shifts/handover',
        },
        {
          id: 'shift-reports',
          title: 'Reports',
          icon: 'doc.text',
          href: '/(app)/shifts/reports',
        },
      ],
    }] : []),
    ...(canViewAnalytics ? [{
      id: 'analytics',
      title: 'Analytics',
      icon: 'chart.line.uptrend.xyaxis',
      items: [
        {
          id: 'response-analytics',
          title: 'Response Times',
          icon: 'speedometer',
          href: '/(app)/analytics/response-analytics',
          isNew: true,
        },
        {
          id: 'performance-metrics',
          title: 'Performance',
          icon: 'chart.bar',
          href: '/(app)/analytics/performance',
        },
        {
          id: 'trend-analysis',
          title: 'Trends',
          icon: 'arrow.up.right',
          href: '/(app)/analytics/trends',
        },
      ],
    }] : []),
    ...(canViewAuditLogs ? [{
      id: 'logs',
      title: 'Activity & Logs',
      icon: 'doc.text.magnifyingglass',
      items: [
        {
          id: 'activity-logs',
          title: 'Activity Logs',
          icon: 'list.bullet.rectangle',
          href: '/(app)/logs/activity-logs',
        },
        {
          id: 'audit-trail',
          title: 'Audit Trail',
          icon: 'shield.checkerboard',
          href: '/(app)/logs/audit',
        },
      ],
    }] : []),
    {
      id: 'settings',
      title: 'Settings',
      icon: 'gearshape.fill',
      href: '/(app)/(tabs)/settings',
      shortcut: '⌘,',
    },
  ], [canViewAlerts, canViewPatients, canManageShifts, canViewAnalytics, canViewAuditLogs, alertStats]);
  
  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!debouncedSearch) return navItems;
    
    const search = debouncedSearch.toLowerCase();
    return navItems.filter(item => {
      const matchesTitle = item.title.toLowerCase().includes(search);
      const matchesSubItems = item.items?.some(
        subItem => subItem.title.toLowerCase().includes(search)
      );
      return matchesTitle || matchesSubItems;
    });
  }, [navItems, debouncedSearch]);
  
  // Check if path is active
  const isPathActive = useCallback((href?: string) => {
    if (!href) return false;
    return pathname.startsWith(href);
  }, [pathname]);
  
  // Handle navigation with recent items tracking
  const handleNavigation = useCallback((href: string) => {
    haptic('light');
    
    // Add to recent items
    setRecentItems(prev => {
      const filtered = prev.filter(item => item !== href);
      return [href, ...filtered].slice(0, 5);
    });
    
    router.push(href as any);
  }, [router]);
  
  // Keyboard shortcuts
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      // Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      
      // Quick navigation
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'd':
            e.preventDefault();
            router.push('/(app)/(tabs)/home');
            break;
          case 'a':
            e.preventDefault();
            if (canViewAlerts) router.push('/(app)/(tabs)/alerts');
            break;
          case 'p':
            e.preventDefault();
            if (canViewPatients) router.push('/(app)/(tabs)/patients');
            break;
          case ',':
            e.preventDefault();
            router.push('/(app)/(tabs)/settings');
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [router, canViewAlerts, canViewPatients]);
  
  // Recent items component
  const RecentItemsSection = () => {
    if (recentItems.length === 0) return null;
    
    const recentNavItems = recentItems.map(href => {
      // Find the nav item for this href
      for (const item of navItems) {
        if (item.href === href) return item;
        if (item.items) {
          const subItem = item.items.find(sub => sub.href === href);
          if (subItem) return subItem;
        }
      }
      return null;
    }).filter(Boolean) as NavItem[];
    
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Recent</SidebarGroupLabel>
        <SidebarMenu>
          {recentNavItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                tooltip={item.title}
                onPress={() => handleNavigation(item.href!)}
                isActive={isPathActive(item.href)}
              >
                <Symbol name={item.icon as any} size={16} />
                <Text size="sm">{item.title}</Text>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    );
  };
  
  // Enhanced nav item with animations and features
  const EnhancedNavItem = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const isActive = isPathActive(item.href);
    const isOpen = openGroups.includes(item.id);
    const hasSubItems = item.items && item.items.length > 0;
    
    const scale = useSharedValue(1);
    const backgroundColor = useSharedValue(0);
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      backgroundColor: backgroundColor.value === 0 ? 'transparent' : theme.accent + '20',
    }));
    
    const handlePress = () => {
      if (hasSubItems) {
        toggleGroup(item.id);
      } else if (item.href) {
        handleNavigation(item.href);
      }
    };
    
    const handlePressIn = () => {
      scale.value = withSpring(0.98);
      backgroundColor.value = withTiming(1, { duration: 100 });
    };
    
    const handlePressOut = () => {
      scale.value = withSpring(1);
      backgroundColor.value = withTiming(0, { duration: 100 });
    };
    
    return (
      <View>
        <AnimatedPressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[2],
              marginLeft: level * spacing[4],
              borderRadius: 8,
            },
            animatedStyle,
            isActive && {
              backgroundColor: theme.accent,
            },
          ]}
        >
          <Symbol
            name={item.icon as any}
            size={20}
            color={isActive ? theme.accentForeground : theme.foreground}
          />
          
          {!isCollapsed && (
            <>
              <Text
                size="sm"
                weight={isActive ? 'medium' : 'normal'}
                style={{
                  flex: 1,
                  marginLeft: spacing[3],
                  color: isActive ? theme.accentForeground : theme.foreground,
                }}
              >
                {item.title}
              </Text>
              
              {item.isNew && (
                <Badge variant="secondary" size="sm" style={{ marginRight: spacing[2] }}>
                  NEW
                </Badge>
              )}
              
              {item.badge !== undefined && item.badge !== 0 && (
                <Badge
                  variant={item.badgeVariant || 'default'}
                  size="sm"
                  style={{ marginRight: spacing[2] }}
                >
                  {item.badge}
                </Badge>
              )}
              
              {item.shortcut && Platform.OS === 'web' && (
                <Text
                  size="xs"
                  style={{
                    color: theme.mutedForeground,
                    marginRight: spacing[2],
                  }}
                >
                  {item.shortcut}
                </Text>
              )}
              
              {hasSubItems && (
                <Animated.View
                  style={{
                    transform: [{
                      rotate: isOpen ? '90deg' : '0deg',
                    }],
                  }}
                >
                  <Symbol
                    name="chevron.right"
                    size={16}
                    color={theme.mutedForeground}
                  />
                </Animated.View>
              )}
            </>
          )}
        </AnimatedPressable>
        
        {!isCollapsed && hasSubItems && isOpen && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            {item.items!.map((subItem) => (
              <EnhancedNavItem
                key={subItem.id}
                item={subItem}
                level={level + 1}
              />
            ))}
          </Animated.View>
        )}
      </View>
    );
  };
  
  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <TeamSwitcher
            teams={[{
              name: user?.organizationName || 'Hospital',
              plan: 'Healthcare',
              logo: (<Symbol name="cross.case.fill" size={24} color={theme.primary} />),
            }]}
          />
          
          {/* Search Bar */}
          {!isCollapsed && (
            <Pressable
              onPress={() => setShowCommandPalette(true)}
              style={{
                marginTop: spacing[3],
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[2],
                backgroundColor: theme.input,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.border,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Symbol name="magnifyingglass" size={16} color={theme.mutedForeground} />
              <Text
                size="sm"
                style={{
                  flex: 1,
                  marginLeft: spacing[2],
                  color: theme.mutedForeground,
                }}
              >
                Search... {Platform.OS === 'web' && '⌘K'}
              </Text>
            </Pressable>
          )}
          
          {/* Notifications */}
          {!isCollapsed && notifications && notifications.count > 0 && (
            <Pressable
              onPress={() => router.push('/(modals)/notification-center')}
              style={{
                marginTop: spacing[2],
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[2],
                backgroundColor: theme.destructive + '10',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.destructive + '30',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Symbol name="bell.badge" size={16} color={theme.destructive} />
              <Text
                size="sm"
                weight="medium"
                style={{
                  flex: 1,
                  marginLeft: spacing[2],
                  color: theme.destructive,
                }}
              >
                {notifications.count} new notifications
              </Text>
            </Pressable>
          )}
        </SidebarHeader>
        
        <SidebarContent>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Favorites Section */}
            <SidebarGroup>
              <SidebarGroupLabel>Favorites</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Create Alert"
                    onPress={() => router.push('/(modals)/create-alert')}
                  >
                    <Symbol name="plus.circle.fill" size={16} color={theme.destructive} />
                    <Text size="sm">Create Alert</Text>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            
            {/* Recent Items */}
            <RecentItemsSection />
            
            {/* Main Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <VStack gap={1}>
                {filteredItems.map((item) => (
                  <EnhancedNavItem key={item.id} item={item} />
                ))}
              </VStack>
            </SidebarGroup>
            
            {/* Help & Support */}
            <SidebarGroup>
              <SidebarGroupLabel>Help & Support</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Documentation"
                    onPress={() => showAlert({ title: 'Opening documentation...', variant: 'default' })}
                  >
                    <Symbol name="book" size={16} />
                    <Text size="sm">Documentation</Text>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Support"
                    onPress={() => router.push('/(app)/support')}
                  >
                    <Symbol name="questionmark.circle" size={16} />
                    <Text size="sm">Support</Text>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Keyboard Shortcuts"
                    onPress={() => setShowCommandPalette(true)}
                  >
                    <Symbol name="keyboard" size={16} />
                    <Text size="sm">Shortcuts</Text>
                    {Platform.OS === 'web' && (
                      <Text size="xs" style={{ color: theme.mutedForeground }}>
                        ⌘K
                      </Text>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </ScrollView>
        </SidebarContent>
        
        <SidebarFooter>
          <NavUser
            user={{
              name: user?.name || 'User',
              email: user?.email || '',
              avatar: user?.image,
            }}
          />
          
          {/* Theme Switcher */}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onPress={() => router.push('/(app)/(tabs)/settings')}
              style={{ marginTop: spacing[2] }}
            >
              <HStack gap={2} alignItems="center">
                <Symbol name="moon" size={16} />
                <Text size="sm">Appearance</Text>
              </HStack>
            </Button>
          )}
        </SidebarFooter>
        
        <SidebarRail />
      </Sidebar>
      
      {/* Command Palette Modal */}
      {showCommandPalette && (
        <CommandPalette
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          items={navItems}
          onNavigate={handleNavigation}
        />
      )}
    </>
  );
}

// Command Palette Component
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  onNavigate: (href: string, title: string) => void;
}

function CommandPalette({ isOpen, onClose, items, onNavigate }: CommandPaletteProps) {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Flatten items for search
  const flatItems = useMemo(() => {
    const flat: NavItem[] = [];
    items.forEach(item => {
      flat.push(item);
      if (item.items) {
        flat.push(...item.items);
      }
    });
    return flat;
  }, [items]);
  
  // Filter based on search
  const filteredItems = useMemo(() => {
    if (!search) return flatItems.filter(item => item.href);
    
    const searchLower = search.toLowerCase();
    return flatItems.filter(item => 
      item.href && item.title.toLowerCase().includes(searchLower)
    );
  }, [flatItems, search]);
  
  // Handle keyboard navigation
  React.useEffect(() => {
    if (Platform.OS !== 'web' || !isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredItems.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredItems.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          const selected = filteredItems[selectedIndex];
          if (selected?.href) {
            onNavigate(selected.href, selected.title);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onNavigate, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <Pressable
      onPress={onClose}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        paddingTop: 100,
        zIndex: 9999,
      }}
    >
      <Animated.View
        entering={SlideInLeft}
        exiting={SlideOutLeft}
        style={{
          width: '90%',
          maxWidth: 600,
          backgroundColor: theme.card,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 20,
        }}
      >
        <KeyboardAvoidingView behavior="padding">
          <VStack>
            {/* Search Input */}
            <HStack
              alignItems="center"
              p={4}
              style={{
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
              }}
            >
              <Symbol name="magnifyingglass" size={20} color={theme.mutedForeground} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search commands..."
                placeholderTextColor={theme.mutedForeground}
                autoFocus
                style={{
                  flex: 1,
                  marginLeft: spacing[3],
                  fontSize: 16,
                  color: theme.foreground,
                }}
              />
              <Pressable onPress={onClose}>
                <Text size="sm" style={{ color: theme.mutedForeground }}>
                  ESC
                </Text>
              </Pressable>
            </HStack>
            
            {/* Results */}
            <ScrollView
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={false}
            >
              <VStack p={2}>
                {filteredItems.length === 0 ? (
                  <Box p={8} alignItems="center">
                    <Text size="sm" colorTheme="mutedForeground">
                      No results found
                    </Text>
                  </Box>
                ) : (
                  filteredItems.map((item, index) => (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        if (item.href) {
                          onNavigate(item.href, item.title);
                          onClose();
                        }
                      }}
                      style={{
                        paddingHorizontal: spacing[3],
                        paddingVertical: spacing[2],
                        borderRadius: 8,
                        backgroundColor: selectedIndex === index 
                          ? theme.accent 
                          : 'transparent',
                      }}
                    >
                      <HStack alignItems="center" gap={3}>
                        <Symbol
                          name={item.icon as any}
                          size={20}
                          color={selectedIndex === index 
                            ? theme.accentForeground 
                            : theme.foreground}
                        />
                        <Text
                          size="sm"
                          style={{
                            flex: 1,
                            color: selectedIndex === index 
                              ? theme.accentForeground 
                              : theme.foreground,
                          }}
                        >
                          {item.title}
                        </Text>
                        {item.shortcut && (
                          <Text
                            size="xs"
                            style={{
                              color: selectedIndex === index 
                                ? theme.accentForeground 
                                : theme.mutedForeground,
                            }}
                          >
                            {item.shortcut}
                          </Text>
                        )}
                      </HStack>
                    </Pressable>
                  ))
                )}
              </VStack>
            </ScrollView>
          </VStack>
        </KeyboardAvoidingView>
      </Animated.View>
    </Pressable>
  );
}