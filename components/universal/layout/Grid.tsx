import React, { useEffect } from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  FadeIn,
  SlideInDown,
  Layout,
} from 'react-native-reanimated';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { cn } from '@/lib/core/utils';
import { SpacingScale } from '@/lib/design';

export type GridAnimationType = 'none' | 'stagger' | 'cascade' | 'wave' | 'fade';

const AnimatedView = Animated.createAnimatedComponent(View);

export interface GridProps {
  children: React.ReactNode;
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number };
  gap?: SpacingScale;
  rowGap?: SpacingScale;
  columnGap?: SpacingScale;
  alignItems?: 'stretch' | 'center' | 'flex-start' | 'flex-end' | 'baseline';
  justifyItems?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  className?: string;
  style?: ViewStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationType?: GridAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  staggerDelay?: number;
}

interface GridItemProps {
  children: React.ReactNode;
  span?: number | { xs?: number; sm?: number; md?: number; lg?: number };
  style?: ViewStyle;
  testID?: string;
  animated?: boolean;
  entering?: any;
  layout?: any;
}

// Helper to get responsive value
const getResponsiveValue = <T,>(
  value: T | { xs?: T; sm?: T; md?: T; lg?: T },
  screenWidth: number
): T => {
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  // Simple breakpoint system
  if (screenWidth < 640 && (value as any).xs !== undefined) {
    return (value as any).xs;
  } else if (screenWidth < 768 && (value as any).sm !== undefined) {
    return (value as any).sm;
  } else if (screenWidth < 1024 && (value as any).md !== undefined) {
    return (value as any).md;
  } else if ((value as any).lg !== undefined) {
    return (value as any).lg;
  }

  // Fallback to largest defined value
  return (value as any).lg || (value as any).md || (value as any).sm || (value as any).xs || 1;
};

// Spring config for grid animations
const springConfig = {
  damping: 20,
  stiffness: 300,
};

export const Grid = React.forwardRef<View, GridProps>(
  (
    {
      children,
      columns = 12,
      gap,
      rowGap,
      columnGap,
      alignItems = 'stretch',
      justifyItems = 'flex-start',
      className,
      style,
      testID,
      // Animation props
      animated = false,
      animationType = 'stagger',
      animationDuration = 500,
      animationDelay = 0,
      staggerDelay = 50,
    },
    ref
  ) => {
    const { spacing } = useSpacing();
    const [containerWidth, setContainerWidth] = React.useState(0);
    const { shouldAnimate } = useAnimationStore();

    const handleLayout = (event: any) => {
      setContainerWidth(event.nativeEvent.layout.width);
    };

    const currentColumns = getResponsiveValue(columns, containerWidth);
    const gapValue = gap !== undefined ? spacing[gap] : 0;
    const rowGapValue = rowGap !== undefined ? spacing[rowGap] : gapValue;
    const columnGapValue = columnGap !== undefined ? spacing[columnGap] : gapValue;

    // Calculate column width
    const totalGapWidth = columnGapValue * (currentColumns - 1);
    const columnWidth = containerWidth > 0 
      ? (containerWidth - totalGapWidth) / currentColumns 
      : 0;

    const containerStyle: ViewStyle = {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -columnGapValue / 2,
      marginVertical: -rowGapValue / 2,
      ...style,
    };

    // Process children to wrap in grid items
    const processedChildren = React.Children.map(children, (child, index) => {
      const shouldApplyAnimation = animated && shouldAnimate();
      
      let itemDelay = animationDelay;
      if (shouldApplyAnimation) {
        if (animationType === 'stagger') {
          itemDelay = animationDelay + (index * staggerDelay);
        } else if (animationType === 'cascade') {
          // Cascade: diagonal animation from top-left
          const row = Math.floor(index / currentColumns);
          const col = index % currentColumns;
          itemDelay = animationDelay + ((row + col) * staggerDelay);
        } else if (animationType === 'wave') {
          // Wave: sinusoidal delay pattern
          const row = Math.floor(index / currentColumns);
          itemDelay = animationDelay + (Math.sin(index * 0.5) * staggerDelay + row * staggerDelay);
        }
      }
      
      const enteringAnimation = shouldApplyAnimation && animationType !== 'none' && Platform.OS !== 'web'
        ? FadeIn.delay(itemDelay).duration(animationDuration).springify(springConfig)
        : undefined;
        
      const layoutAnimation = shouldApplyAnimation
        ? Layout.springify(springConfig)
        : undefined;
      
      if (React.isValidElement(child) && child.type === GridItem) {
        const span = getResponsiveValue(child.props.span || 1, containerWidth);
        const itemWidth = columnWidth * span + columnGapValue * (span - 1);

        return React.cloneElement(child as React.ReactElement<GridItemProps>, {
          style: {
            width: itemWidth,
            paddingHorizontal: columnGapValue / 2,
            paddingVertical: rowGapValue / 2,
            alignItems: justifyItems,
            ...child.props.style,
          },
          animated: shouldApplyAnimation,
          entering: enteringAnimation,
          layout: layoutAnimation,
        });
      }

      // Wrap non-GridItem children in a default GridItem
      return (
        <GridItem
          key={index}
          style={{
            width: columnWidth,
            paddingHorizontal: columnGapValue / 2,
            paddingVertical: rowGapValue / 2,
            alignItems: justifyItems,
          }}
          animated={shouldApplyAnimation}
          entering={enteringAnimation}
          layout={layoutAnimation}
        >
          {child}
        </GridItem>
      );
    });

    return (
      <View
        ref={ref}
        className={cn('flex-row flex-wrap', className)}
        style={containerStyle}
        onLayout={handleLayout}
        testID={testID}
      >
        {processedChildren}
      </View>
    );
  }
);

Grid.displayName = 'Grid';

// Grid Item Component
export const GridItem = React.forwardRef<View, GridItemProps>(
  ({ children, span = 1, style, testID, animated, entering, layout }, ref) => {
    const ViewComponent = animated ? AnimatedView : View;
    
    return (
      <ViewComponent 
        ref={ref} 
        style={style} 
        testID={testID}
        entering={animated ? entering : undefined}
        layout={animated ? layout : undefined}
      >
        {children}
      </ViewComponent>
    );
  }
);

GridItem.displayName = 'GridItem';

// Row component for simplified grid usage
export interface RowProps {
  children: React.ReactNode;
  gap?: SpacingScale;
  alignItems?: 'stretch' | 'center' | 'flex-start' | 'flex-end' | 'baseline';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  className?: string;
  style?: ViewStyle;
  testID?: string;
}

const alignItemsClasses = {
  stretch: 'items-stretch',
  center: 'items-center',
  'flex-start': 'items-start',
  'flex-end': 'items-end',
  baseline: 'items-baseline',
};

const justifyContentClasses = {
  'flex-start': 'justify-start',
  center: 'justify-center',
  'flex-end': 'justify-end',
  'space-between': 'justify-between',
  'space-around': 'justify-around',
  'space-evenly': 'justify-evenly',
};

export const Row = React.forwardRef<View, RowProps>(
  (
    {
      children,
      gap = 2,
      alignItems = 'center',
      justifyContent = 'flex-start',
      className,
      style,
      testID,
    },
    ref
  ) => {
    const { spacing } = useSpacing();

    const rowClasses = cn(
      'flex-row',
      alignItemsClasses[alignItems],
      justifyContentClasses[justifyContent],
      className
    );

    return (
      <View 
        ref={ref} 
        className={rowClasses}
        style={[{ gap: spacing[gap] }, style]} 
        testID={testID}
      >
        {children}
      </View>
    );
  }
);

Row.displayName = 'Row';

// Column component for simplified grid usage
export interface ColumnProps {
  children: React.ReactNode;
  gap?: SpacingScale;
  alignItems?: 'stretch' | 'center' | 'flex-start' | 'flex-end' | 'baseline';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  flex?: number;
  className?: string;
  style?: ViewStyle;
  testID?: string;
}

export const Column = React.forwardRef<View, ColumnProps>(
  (
    {
      children,
      gap = 2,
      alignItems = 'stretch',
      justifyContent = 'flex-start',
      flex,
      className,
      style,
      testID,
    },
    ref
  ) => {
    const { spacing } = useSpacing();

    const columnClasses = cn(
      'flex-col',
      alignItemsClasses[alignItems],
      justifyContentClasses[justifyContent],
      flex && `flex-${flex}`,
      className
    );

    return (
      <View 
        ref={ref} 
        className={columnClasses}
        style={[{ gap: spacing[gap], flex }, style]} 
        testID={testID}
      >
        {children}
      </View>
    );
  }
);

Column.displayName = 'Column';