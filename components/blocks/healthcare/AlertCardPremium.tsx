import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Pressable, 
  Animated as RNAnimated,
  Platform,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { VStack, HStack } from '@/components/universal/layout';
import { Text } from '@/components/universal/typography';
import { Badge, Avatar, Symbol } from '@/components/universal/display';
import { Button } from '@/components/universal/interaction';
import { 
  ALERT_TYPE_CONFIG, 
  URGENCY_LEVEL_CONFIG,
} from '@/types/healthcare';
import { haptic } from '@/lib/ui/haptics';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useTheme } from '@/lib/theme/provider';
import { formatDistanceToNow } from 'date-fns';
import Animated, { 
  FadeInDown, 
  FadeOut,
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { log } from '@/lib/core/debug/unified-logger';
import { useResponsive } from '@/hooks/responsive';


interface AlertCardPremiumProps {
  alert: any;
  index: number;
  onPress?: () => void;
  onAcknowledge?: (alertId: string) => Promise<void>;
  onResolve?: (alertId: string) => Promise<void>;
  canAcknowledge?: boolean;
  canResolve?: boolean;
  isHighlighted?: boolean;
}

export const AlertCardPremium: React.FC<AlertCardPremiumProps> = ({
  alert,
  index,
  onPress,
  onAcknowledge,
  onResolve,
  canAcknowledge = false,
  canResolve = false,
  isHighlighted = false,
}) => {
  const { spacing } = useSpacing();
  const theme = useTheme();
  const { isMobile } = useResponsive();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const expandAnimation = useRef(new RNAnimated.Value(0)).current;
  const pulseAnimation = useSharedValue(1);
  const swipeX = useSharedValue(0);
  const highlightAnimation = useSharedValue(0);
  const glowAnimation = useSharedValue(0);
  
  const config = ALERT_TYPE_CONFIG[alert.alertType] || { icon: '🚨', color: 'destructive' };
  const urgencyConfig = URGENCY_LEVEL_CONFIG[alert.urgencyLevel] || { label: `Level ${alert.urgencyLevel}`, color: 'destructive' };
  
  // Get urgency colors
  const getUrgencyColors = () => {
    switch (alert.urgencyLevel) {
      case 1:
      case 2:
        return ['#ef4444', '#dc2626', '#b91c1c']; // Red gradient
      case 3:
        return ['#f59e0b', '#d97706', '#b45309']; // Orange gradient
      case 4:
      case 5:
        return ['#3b82f6', '#2563eb', '#1d4ed8']; // Blue gradient
      default:
        return ['#6b7280', '#4b5563', '#374151']; // Gray gradient
    }
  };
  
  // Pulse animation for critical alerts
  useEffect(() => {
    if (alert.urgencyLevel <= 2 && alert.status === 'active') {
      pulseAnimation.value = withRepeat(
        withTiming(1.1, { duration: 1000 }),
        -1,
        true
      );
    }
  }, [alert.urgencyLevel, alert.status, pulseAnimation]);
  
  // Highlight animation for newly created alerts
  useEffect(() => {
    if (isHighlighted) {
      highlightAnimation.value = withTiming(1, { duration: 300 });
      glowAnimation.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        3,
        true
      );
      
      // Auto remove highlight after 5 seconds
      const timeout = setTimeout(() => {
        highlightAnimation.value = withTiming(0, { duration: 500 });
        glowAnimation.value = 0;
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [isHighlighted, highlightAnimation, glowAnimation]);
  
  // Expand/collapse animation
  useEffect(() => {
    RNAnimated.timing(expandAnimation, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, expandAnimation]);
  
  const handlePress = () => {
    haptic('light');
    setIsExpanded(!isExpanded);
    onPress?.();
  };
  
  const handleAcknowledge = async () => {
    if (!canAcknowledge || isAcknowledging) return;
    
    haptic('medium');
    setIsAcknowledging(true);
    
    try {
      await onAcknowledge?.(alert.id);
      haptic('success');
    } catch (error) {
      haptic('error');
      log.error('Failed to acknowledge alert', 'ALERT_CARD', error);
    } finally {
      setIsAcknowledging(false);
    }
  };
  
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));
  
  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: swipeX.value }],
  }));
  
  const detailsHeight = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isMobile ? 150 : 200],
  });
  
  const highlightStyle = useAnimatedStyle(() => ({
    opacity: highlightAnimation.value,
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + glowAnimation.value * 0.05 }],
    opacity: 0.5 - glowAnimation.value * 0.5,
  }));
  
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      exiting={FadeOut}
      style={[swipeStyle, { marginBottom: spacing[3] }]}
    >
      <Pressable onPress={handlePress}>
        <View style={styles.cardContainer}>
          {/* Highlight Glow Effect */}
          {isHighlighted && (
            <>
              <Animated.View
                style={[
                  StyleSheet.absoluteFillObject,
                  glowStyle,
                  {
                    backgroundColor: '#10b981',
                    borderRadius: 16,
                  },
                ]}
              />
              <Animated.View
                style={[
                  StyleSheet.absoluteFillObject,
                  highlightStyle,
                  {
                    borderRadius: 16,
                    borderWidth: 3,
                    borderColor: '#10b981',
                  },
                ]}
              />
            </>
          )}
          
          {/* Gradient Border */}
          <LinearGradient
            colors={getUrgencyColors() as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            {/* Glass Card */}
            <View style={[styles.glassCard, { backgroundColor: theme.card + 'ee', padding: isMobile ? spacing[3] : spacing[4] }]}>
              {Platform.OS === 'ios' && (
                <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />
              )}
              
              <VStack gap={spacing[2] as any}>
                {/* Header Section */}
                <HStack gap={spacing[3] as any} alignItems="center">
                  {/* Animated Urgency Indicator */}
                  <Animated.View style={[pulseStyle]}>
                    <LinearGradient
                      colors={getUrgencyColors() as [string, string, ...string[]]}
                      style={[
                        styles.urgencyIndicator,
                        alert.status !== 'active' && styles.inactiveIndicator
                      ]}
                    >
                      <Text size="xl" style={{ color: 'white' }}>{config.icon}</Text>
                    </LinearGradient>
                  </Animated.View>
                  
                  {/* Alert Info */}
                  <VStack style={{ flex: 1 }}>
                    <HStack gap={spacing[2] as any} alignItems="center">
                      <Text weight="bold" size="xl">
                        Room {alert.roomNumber}
                      </Text>
                      {isHighlighted && (
                        <Animated.View style={highlightStyle}>
                          <Badge
                            variant="default"
                            style={{
                              backgroundColor: '#10b981',
                              borderColor: '#10b981',
                            }}
                          >
                            <Text size="xs" weight="bold" style={{ color: 'white' }}>
                              NEW
                            </Text>
                          </Badge>
                        </Animated.View>
                      )}
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: getUrgencyColors()[0] + '20',
                          borderColor: getUrgencyColors()[0],
                        }}
                      >
                        <Text size="xs" style={{ color: getUrgencyColors()[0] }}>
                          {urgencyConfig.label}
                        </Text>
                      </Badge>
                    </HStack>
                    
                    <HStack gap={spacing[2] as any} alignItems="center">
                      <Text size="sm" colorTheme="mutedForeground">
                        {alert.alertType.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                      <Text size="xs" colorTheme="mutedForeground">
                        • {formatDistanceToNow(new Date(alert.createdAt))} ago
                      </Text>
                    </HStack>
                  </VStack>
                  
                  {/* Status */}
                  {alert.status === 'acknowledged' && (
                    <View style={styles.statusBadge}>
                      <Symbol name="checkmark.circle.fill" size="sm" color="#10b981" />
                    </View>
                  )}
                </HStack>
                
                {/* Description */}
                {alert.description && (
                  <Text size="sm" colorTheme="mutedForeground" numberOfLines={isExpanded ? 0 : 2}>
                    {alert.description}
                  </Text>
                )}
                
                {/* Quick Stats */}
                <HStack gap={spacing[4] as any}>
                  {alert.responseTime && (
                    <HStack gap={spacing[1] as any} alignItems="center">
                      <Symbol name="clock.fill" size="xs" color={theme.mutedForeground} />
                      <Text size="xs" colorTheme="mutedForeground">
                        Response: {alert.responseTime}s
                      </Text>
                    </HStack>
                  )}
                  
                  {alert.assignedStaff && alert.assignedStaff.length > 0 && (
                    <HStack gap={spacing[1] as any} alignItems="center">
                      <HStack gap={-spacing[2] as any}>
                        {alert.assignedStaff.slice(0, 3).map((staff: any, idx: number) => (
                          <Avatar
                            key={staff.id}
                            source={staff.image ? { uri: staff.image } : undefined}
                            name={staff.name}
                            size="xs"
                            style={styles.staffAvatar}
                          />
                        ))}
                      </HStack>
                      {alert.assignedStaff.length > 3 && (
                        <Text size="xs" colorTheme="mutedForeground">
                          +{alert.assignedStaff.length - 3}
                        </Text>
                      )}
                    </HStack>
                  )}
                  
                  {alert.currentEscalationTier > 1 && (
                    <Badge variant="error" size="sm">
                      <Text size="xs">Tier {alert.currentEscalationTier}</Text>
                    </Badge>
                  )}
                </HStack>
                
                {/* Expanded Details */}
                <RNAnimated.View style={{ height: detailsHeight, overflow: 'hidden' }}>
                  <VStack gap={spacing[3] as any} pt={spacing[2]}>
                    {/* Timeline Preview */}
                    {alert.timeline && alert.timeline.length > 0 && (
                      <VStack gap={spacing[2] as any}>
                        <Text size="sm" weight="semibold">Recent Activity</Text>
                        {alert.timeline.slice(0, 2).map((event: any, idx: number) => (
                          <HStack key={idx} gap={spacing[2] as any} alignItems="center">
                            <View style={styles.timelineDot} />
                            <Text size="xs" colorTheme="mutedForeground">
                              {event.description}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    )}
                    
                    {/* Actions */}
                    {alert.status === 'active' && (
                      <HStack gap={spacing[2] as any}>
                        {canAcknowledge && (
                          <Button
                            onPress={handleAcknowledge}
                            variant="default"
                            size="sm"
                            fullWidth
                            isLoading={isAcknowledging}
                            style={{
                              backgroundColor: getUrgencyColors()[0],
                            }}
                          >
                            <HStack gap={spacing[1] as any} alignItems="center">
                              <Symbol name="checkmark.circle" size="sm" color="white" />
                              <Text size="sm" style={{ color: 'white' }}>
                                Acknowledge
                              </Text>
                            </HStack>
                          </Button>
                        )}
                        
                        <Button
                          onPress={() => {}}
                          variant="outline"
                          size="sm"
                          fullWidth
                        >
                          <HStack gap={spacing[1] as any} alignItems="center">
                            <Symbol name="info.circle" size="sm" />
                            <Text size="sm">Details</Text>
                          </HStack>
                        </Button>
                      </HStack>
                    )}
                  </VStack>
                </RNAnimated.View>
                
                {/* Expand Indicator */}
                <HStack justifyContent="center">
                  <Symbol 
                    name={isExpanded ? "chevron.up" : "chevron.down"} 
                    size="xs" 
                    color={theme.mutedForeground}
                  />
                </HStack>
              </VStack>
            </View>
          </LinearGradient>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradientBorder: {
    padding: 2,
    borderRadius: 16,
  },
  glassCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  urgencyIndicator: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveIndicator: {
    opacity: 0.6,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b98120',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffAvatar: {
    borderWidth: 2,
    borderColor: 'white',
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6b7280',
  },
});