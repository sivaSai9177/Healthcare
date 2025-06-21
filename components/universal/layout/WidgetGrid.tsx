import React from 'react';
import { View, ViewStyle, Platform, useWindowDimensions } from 'react-native';
import { Grid, GridItem, GridProps } from './Grid';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { SpacingScale } from '@/lib/design/spacing';

// Widget size variants
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

// Responsive breakpoints
const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
} as const;

// Widget span configuration based on screen size
const WIDGET_SPANS = {
  small: {
    mobile: 12,    // Full width on mobile
    tablet: 6,     // Half width on tablet
    desktop: 4,    // 1/3 width on desktop
    wide: 3,       // 1/4 width on wide screens
  },
  medium: {
    mobile: 12,    // Full width on mobile
    tablet: 12,    // Full width on tablet
    desktop: 6,    // Half width on desktop
    wide: 6,       // Half width on wide screens
  },
  large: {
    mobile: 12,    // Full width on mobile
    tablet: 12,    // Full width on tablet
    desktop: 8,    // 2/3 width on desktop
    wide: 8,       // 2/3 width on wide screens
  },
  full: {
    mobile: 12,
    tablet: 12,
    desktop: 12,
    wide: 12,
  },
} as const;

export interface WidgetGridProps extends Omit<GridProps, 'columns'> {
  maxWidth?: number | 'full';
  center?: boolean;
  padding?: SpacingScale;
}

export interface WidgetProps {
  size?: WidgetSize;
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
  testID?: string;
}

// Helper to get current breakpoint
const getBreakpoint = (width: number): keyof typeof BREAKPOINTS => {
  if (width >= BREAKPOINTS.wide) return 'wide';
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
};

// Helper to get widget span based on size and breakpoint
const getWidgetSpan = (size: WidgetSize, breakpoint: keyof typeof BREAKPOINTS): number => {
  return WIDGET_SPANS[size][breakpoint];
};

// Main WidgetGrid component
export const WidgetGrid = React.forwardRef<View, WidgetGridProps>(({
  maxWidth = 1280,
  center = true,
  padding = 4,
  gap = 4,
  children,
  className,
  style,
  ...props
}, ref) => {
  const { spacing } = useSpacing();
  const dimensions = useWindowDimensions();
  
  const containerStyle: ViewStyle = {
    width: '100%',
    maxWidth: maxWidth === 'full' ? undefined : maxWidth,
    marginHorizontal: center ? 'auto' : undefined,
    paddingHorizontal: spacing[padding],
    paddingVertical: spacing[padding],
    ...style,
  };
  
  return (
    <View
      ref={ref}
      className={cn('flex-1', className) as string}
      style={containerStyle}
    >
      <Grid
        columns={12}
        gap={gap}
        {...props}
      >
        {children}
      </Grid>
    </View>
  );
});

WidgetGrid.displayName = 'WidgetGrid';

// Widget component
export const Widget = React.forwardRef<View, WidgetProps>(({
  size = 'medium',
  children,
  className,
  style,
  minHeight,
  maxHeight,
  aspectRatio,
  testID,
}, ref) => {
  const dimensions = useWindowDimensions();
  const breakpoint = getBreakpoint(dimensions.width);
  const span = getWidgetSpan(size, breakpoint);
  
  const widgetStyle: ViewStyle = {
    minHeight,
    maxHeight,
    aspectRatio,
    height: aspectRatio ? undefined : '100%',
    ...style,
  };
  
  return (
    <GridItem
      ref={ref}
      span={span}
      style={widgetStyle}
      testID={testID}
    >
      <View className={cn('flex-1', className) as string}>
        {children}
      </View>
    </GridItem>
  );
});

Widget.displayName = 'Widget';

// Preset widget layouts
export const DashboardGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <WidgetGrid
    maxWidth={1440}
    center
    padding={Platform.select({ web: 6, default: 4 })}
    gap={Platform.select({ web: 6, default: 4 })}
    className={cn('min-h-screen bg-background', className) as string}
  >
    {children}
  </WidgetGrid>
);

export const CompactGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <WidgetGrid
    maxWidth={1024}
    center
    padding={3}
    gap={3}
    className={className}
  >
    {children}
  </WidgetGrid>
);

// Widget size presets for common use cases
export const MetricWidget: React.FC<WidgetProps> = (props) => (
  <Widget size="small" minHeight={120} {...props} />
);

export const ChartWidget: React.FC<WidgetProps> = (props) => (
  <Widget size="medium" minHeight={300} {...props} />
);

export const TableWidget: React.FC<WidgetProps> = (props) => (
  <Widget size="large" minHeight={400} {...props} />
);

export const FullWidget: React.FC<WidgetProps> = (props) => (
  <Widget size="full" minHeight={400} {...props} />
);

// Helper hook for responsive widget behavior
export const useWidgetSize = () => {
  const dimensions = useWindowDimensions();
  const breakpoint = getBreakpoint(dimensions.width);
  
  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop' || breakpoint === 'wide',
    isWide: breakpoint === 'wide',
    width: dimensions.width,
    height: dimensions.height,
  };
};