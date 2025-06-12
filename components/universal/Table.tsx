import React, { useMemo, useCallback, useEffect } from 'react';
import { View, ScrollView, ViewStyle, TextStyle, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  interpolate,
  FadeIn,
  Layout,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Text } from './Text';
import { HStack } from './Stack';
import { AnimationVariant } from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

export type TableAnimationType = 'fade' | 'slide' | 'stagger' | 'none';

// Table Props
export interface TableProps {
  children: React.ReactNode;
  style?: ViewStyle;
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: TableAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  rowAnimationStagger?: number;
  sortAnimation?: boolean;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    spring?: { damping: number; stiffness: number };
  };
}

const AnimatedView = Animated.View;
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export const Table: React.FC<TableProps> = ({
  children,
  style,
  striped = false,
  bordered = true,
  hoverable = false,
  // Animation props
  animated = true,
  animationVariant = 'moderate',
  animationType = 'fade',
  animationDuration,
  animationDelay = 0,
  rowAnimationStagger = 50,
  sortAnimation = true,
  useHaptics = true,
  animationConfig,
}) => {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const duration = animationDuration ?? config.duration.normal;
  
  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(animationType === 'slide' ? 20 : 0);
  
  // Initialize animations
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      setTimeout(() => {
        opacity.value = withTiming(1, { duration });
        if (animationType === 'slide') {
          translateY.value = withTiming(0, { duration });
        }
      }, animationDelay);
    } else {
      opacity.value = 1;
      translateY.value = 0;
    }
  }, [animated, isAnimated, shouldAnimate, animationType, animationDelay, duration, opacity, translateY]);
  
  const tableAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  
  const ScrollComponent = animated && isAnimated && shouldAnimate() ? AnimatedScrollView : ScrollView;
  const ViewComponent = animated && isAnimated && shouldAnimate() ? AnimatedView : View;
  
  return (
    <ScrollComponent 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={style}
    >
      <ViewComponent
        style={[
          {
            borderWidth: bordered ? 1 : 0,
            borderColor: theme.border,
            borderRadius: spacing[2],
            backgroundColor: theme.card,
            overflow: 'hidden',
          },
          animated && isAnimated && shouldAnimate() ? tableAnimatedStyle : {},
        ]}
        entering={Platform.OS !== 'web' && animated && isAnimated && shouldAnimate() && animationType === 'fade'
          ? FadeIn.duration(duration).delay(animationDelay)
          : undefined
        }
      >
        {children}
      </ViewComponent>
    </ScrollComponent>
  );
};

// Table Header Props
export interface TableHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
  animated?: boolean;
  sortable?: boolean;
  onSort?: () => void;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  children,
  style,
  animated = false,
  sortable = false,
  onSort,
}) => {
  const theme = useTheme();
  const { shouldAnimate } = useAnimationStore();
  const scale = useSharedValue(1);
  
  const handleSort = () => {
    if (sortable && onSort) {
      if (animated && shouldAnimate()) {
        scale.value = withSequence(
          withTiming(0.95, { duration: 100 }),
          withSpring(1, { damping: 15, stiffness: 400 })
        );
        haptic('impact');
      }
      onSort();
    }
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const ViewComponent = animated && shouldAnimate() && sortable ? AnimatedView : View;
  const content = (
    <ViewComponent
      style={[
        {
          backgroundColor: theme.muted,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        style,
        animated && shouldAnimate() && sortable ? animatedStyle : {},
      ]}
    >
      {children}
    </ViewComponent>
  );
  
  if (sortable) {
    return (
      <Pressable onPress={handleSort}>
        {content}
      </Pressable>
    );
  }
  
  return content;
};

// Table Body Props
export interface TableBodyProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const TableBody: React.FC<TableBodyProps> = ({
  children,
  style,
}) => {
  return <View style={style}>{children}</View>;
};

// Table Footer Props
export interface TableFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const TableFooter: React.FC<TableFooterProps> = ({
  children,
  style,
}) => {
  const theme = useTheme();
  
  return (
    <View
      style={[
        {
          backgroundColor: theme.muted,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// Table Row Props
export interface TableRowProps {
  children: React.ReactNode;
  style?: ViewStyle;
  striped?: boolean;
  index?: number;
  hoverable?: boolean;
  onPress?: () => void;
  animated?: boolean;
  animationDelay?: number;
  staggerIndex?: number;
  useHaptics?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedHStack = Animated.createAnimatedComponent(HStack);

export const TableRow = React.memo<TableRowProps>(function TableRow({
  children,
  style,
  striped = false,
  index = 0,
  hoverable = false,
  onPress,
  animated = false,
  animationDelay = 0,
  staggerIndex = 0,
  useHaptics = true,
}) {
  const theme = useTheme();
  const [isHovered, setIsHovered] = React.useState(false);
  const { shouldAnimate } = useAnimationStore();
  const { config } = useAnimationVariant({ variant: 'moderate' });
  
  const isStriped = striped && index % 2 === 1;
  
  // Animation values
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-20);
  const scale = useSharedValue(1);
  
  // Initialize row animation with stagger
  useEffect(() => {
    if (animated && shouldAnimate()) {
      const delay = animationDelay + (staggerIndex * 50);
      setTimeout(() => {
        opacity.value = withTiming(1, { duration: config.duration.normal });
        translateX.value = withSpring(0, config.spring);
      }, delay);
    } else {
      opacity.value = 1;
      translateX.value = 0;
    }
  }, [animated, shouldAnimate, animationDelay, staggerIndex, config, opacity, translateX]);
  
  const rowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));
  
  const handlePress = () => {
    if (useHaptics) {
      haptic('impact');
    }
    onPress?.();
  };
  
  const handlePressIn = () => {
    if (animated && shouldAnimate()) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    }
  };
  
  const handlePressOut = () => {
    if (animated && shouldAnimate()) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
  };
  
  const PressableComponent = animated && shouldAnimate() ? AnimatedPressable : Pressable;
  const RowComponent = animated && shouldAnimate() ? AnimatedHStack : HStack;
  
  return (
    <PressableComponent
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onHoverIn={() => hoverable && setIsHovered(true)}
      onHoverOut={() => hoverable && setIsHovered(false)}
      disabled={!onPress}
      style={animated && shouldAnimate() ? rowAnimatedStyle : {}}
    >
      {({ pressed }) => (
        <RowComponent
          style={[
            {
              backgroundColor: isStriped 
                ? theme.muted 
                : isHovered || pressed 
                  ? theme.muted 
                  : 'transparent',
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            },
            style,
          ]}
        >
          {children}
        </RowComponent>
      )}
    </PressableComponent>
  );
});

// Table Cell Props
export interface TableCellProps {
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  align?: 'left' | 'center' | 'right';
  width?: number;
  flex?: number;
  header?: boolean;
}

export const TableCell = React.memo<TableCellProps>(function TableCell({
  children,
  style,
  textStyle,
  align = 'left',
  width,
  flex,
  header = false,
}) {
  const { spacing } = useSpacing();
  
  const textAlign = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';
  
  return (
    <View
      style={[
        {
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[2],
          width,
          flex: flex || (width ? 0 : 1),
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text
          size="sm"
          weight={header ? 'medium' : 'normal'}
          style={[{ textAlign }, textStyle]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
});

// Simple Table Component
export interface SimpleTableColumn {
  key: string;
  header: string;
  width?: number;
  flex?: number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any, index: number) => React.ReactNode;
}

export interface SimpleTableProps {
  columns: SimpleTableColumn[];
  data: any[];
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  onRowPress?: (row: any, index: number) => void;
  style?: ViewStyle;
}

export const SimpleTable = React.memo<SimpleTableProps>(({
  columns,
  data,
  striped = false,
  bordered = true,
  hoverable = false,
  onRowPress,
  style,
}) => {
  // Memoize row press handlers to prevent recreation
  const handleRowPress = useCallback((row: any, rowIndex: number) => {
    return onRowPress ? () => onRowPress(row, rowIndex) : undefined;
  }, [onRowPress]);

  // Memoize header row
  const headerRow = useMemo(() => (
    <TableRow>
      {columns.map((col) => (
        <TableCell
          key={col.key}
          header
          width={col.width}
          flex={col.flex}
          align={col.align}
        >
          {col.header}
        </TableCell>
      ))}
    </TableRow>
  ), [columns]);

  return (
    <Table striped={striped} bordered={bordered} hoverable={hoverable} style={style}>
      <TableHeader>
        {headerRow}
      </TableHeader>
      <TableBody>
        {data.map((row, rowIndex) => (
          <TableRow
            key={rowIndex}
            index={rowIndex}
            striped={striped}
            hoverable={hoverable}
            onPress={handleRowPress(row, rowIndex)}
          >
            {columns.map((col) => (
              <TableCell
                key={col.key}
                width={col.width}
                flex={col.flex}
                align={col.align}
              >
                {col.render 
                  ? col.render(row[col.key], row, rowIndex)
                  : row[col.key]
                }
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});