import React from 'react';
import { Card, CardProps } from './Card';
import { cn } from '@/lib/core/utils';

// Specialized Glass Card presets for consistent design
export interface GlassCardProps extends Omit<CardProps, 'variant'> {
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  glowOnHover?: boolean;
}

export const GlassCard = React.forwardRef<any, GlassCardProps>(({
  urgency,
  glowOnHover = true,
  className,
  shadowColor,
  glowEffect,
  animationType = 'lift',
  pointerEvents,
  ...props
}, ref) => {
  // Map urgency to shadow colors and glow
  const urgencyConfig = urgency ? {
    low: { shadowColor: 'default' as const, glowEffect: false },
    medium: { shadowColor: 'warning' as const, glowEffect: false },
    high: { shadowColor: 'warning' as const, glowEffect: true },
    critical: { shadowColor: 'destructive' as const, glowEffect: true },
  }[urgency] : {};

  return (
    <Card
      ref={ref}
      variant="glass"
      shadowColor={shadowColor || urgencyConfig.shadowColor}
      glowEffect={glowEffect !== undefined ? glowEffect : urgencyConfig.glowEffect}
      animationType={animationType}
      className={cn(
        glowOnHover && 'transition-all duration-300',
        className
      )}
      pointerEvents={pointerEvents}
      {...props}
    />
  );
});
GlassCard.displayName = 'GlassCard';

// Healthcare-specific glass cards
export const AlertGlassCard = React.forwardRef<any, GlassCardProps>(({ pointerEvents, ...props }, ref) => (
  <GlassCard
    ref={ref}
    animationType="glass-shimmer"
    pressable
    pointerEvents={pointerEvents}
    {...props}
  />
));
AlertGlassCard.displayName = 'AlertGlassCard';

export const MetricGlassCard = React.forwardRef<any, GlassCardProps>(({ pointerEvents, ...props }, ref) => (
  <GlassCard
    ref={ref}
    variant="glass-strong"
    animationType="scale"
    pointerEvents={pointerEvents}
    {...props}
  />
));
MetricGlassCard.displayName = 'MetricGlassCard';

export const StatusGlassCard = React.forwardRef<any, GlassCardProps>(({ pointerEvents, ...props }, ref) => (
  <GlassCard
    ref={ref}
    variant="glass-subtle"
    animationType="glow"
    pointerEvents={pointerEvents}
    {...props}
  />
));
StatusGlassCard.displayName = 'StatusGlassCard';