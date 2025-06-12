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
} from 'react-native-reanimated';
// eslint-disable-next-line import/no-unresolved
import { Layout } from '@/lib/ui/animations/layout-animations';
import { useSpacing } from '@/lib/stores/spacing-store';
import { 
  SpacingScale,
  AnimationVariant,
  GridAnimationType,
  getAnimationConfig,
} from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';

const AnimatedView = Animated.createAnimatedComponent(View);

export interface GridProps {
  children: React.ReactNode;
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number };
  gap?: SpacingScale;
  rowGap?: SpacingScale;
  columnGap?: SpacingScale;
  alignItems?: ViewStyle['alignItems'];
  justifyItems?: ViewStyle['justifyContent'];
  style?: ViewStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: GridAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  staggerDelay?: number;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
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
      style,
      testID,
      // Animation props
      animated = false,
      animationVariant = 'moderate',
      animationType = 'stagger',
      animationDuration,
      animationDelay = 0,
      staggerDelay,
      animationConfig,
    },
    ref
  ) => {
    const { spacing } = useSpacing();
    const [containerWidth, setContainerWidth] = React.useState(0);
    const { shouldAnimate } = useAnimationStore();
    const { config, isAnimated } = useAnimationVariant({
      variant: animationVariant,
      overrides: animationConfig,
    });
    
    const duration = animationDuration ?? config.duration.normal;
    const stagger = staggerDelay ?? config.stagger.base;

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
      const shouldApplyAnimation = animated && isAnimated && shouldAnimate();
      
      let itemDelay = animationDelay;
      if (shouldApplyAnimation) {
        if (animationType === 'stagger') {
          itemDelay = animationDelay + (index * stagger);
        } else if (animationType === 'cascade') {
          // Cascade: diagonal animation from top-left
          const row = Math.floor(index / currentColumns);
          const col = index % currentColumns;
          itemDelay = animationDelay + ((row + col) * stagger);
        } else if (animationType === 'wave') {
          // Wave: sinusoidal delay pattern
          const row = Math.floor(index / currentColumns);
          itemDelay = animationDelay + (Math.sin(index * 0.5) * stagger + row * stagger);
        }
      }
      
      const enteringAnimation = shouldApplyAnimation && animationType !== 'none' && Platform.OS !== 'web'
        ? FadeIn.delay(itemDelay).duration(duration).springify()
        : undefined;
        
      const layoutAnimation = animated && isAnimated && shouldAnimate() && Layout
        ? Layout.springify()
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
          animated: animated && isAnimated && shouldAnimate(),
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
          animated={animated && isAnimated && shouldAnimate()}
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
  alignItems?: ViewStyle['alignItems'];
  justifyContent?: ViewStyle['justifyContent'];
  style?: ViewStyle;
  testID?: string;
}

export const Row = React.forwardRef<View, RowProps>(
  (
    {
      children,
      gap = 2,
      alignItems = 'center',
      justifyContent = 'flex-start',
      style,
      testID,
    },
    ref
  ) => {
    const { spacing } = useSpacing();

    const rowStyle: ViewStyle = {
      flexDirection: 'row',
      gap: spacing[gap],
      alignItems,
      justifyContent,
      ...style,
    };

    return (
      <View ref={ref} style={rowStyle} testID={testID}>
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
  alignItems?: ViewStyle['alignItems'];
  justifyContent?: ViewStyle['justifyContent'];
  flex?: number;
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
      style,
      testID,
    },
    ref
  ) => {
    const { spacing } = useSpacing();

    const columnStyle: ViewStyle = {
      flexDirection: 'column',
      gap: spacing[gap],
      alignItems,
      justifyContent,
      flex,
      ...style,
    };

    return (
      <View ref={ref} style={columnStyle} testID={testID}>
        {children}
      </View>
    );
  }
);

Column.displayName = 'Column';