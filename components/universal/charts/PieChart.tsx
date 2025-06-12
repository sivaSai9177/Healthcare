import React, { useMemo, useEffect } from 'react';
import {
  View,
  ViewStyle,
  Dimensions,
  Text,
} from 'react-native';
import Svg, {
  Path,
  G,
  Circle,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useChartConfig } from './ChartContainer';
import { useTheme } from '@/lib/theme/provider';
import { AnimationVariant } from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

export interface PieChartData {
  label: string;
  value: number;
  color?: string;
}

export type PieChartAnimationType = 'rotate' | 'expand' | 'fade' | 'stagger' | 'none';

export interface PieChartProps {
  data: PieChartData[];
  width?: number;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
  showValues?: boolean;
  labelPosition?: 'inside' | 'outside';
  style?: ViewStyle;
  onSlicePress?: (index: number, item: PieChartData) => void;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: PieChartAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  staggerDelay?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    easing?: typeof Easing.inOut;
  };
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  width: propWidth,
  height = 250,
  innerRadius = 0,
  outerRadius,
  showLabels = true,
  showValues = false,
  labelPosition = 'outside',
  style,
  onSlicePress,
  testID,
  // Animation props
  animated = true,
  animationVariant = 'moderate',
  animationType = 'rotate',
  animationDuration,
  animationDelay = 0,
  staggerDelay = 50,
  useHaptics = true,
  animationConfig,
}) => {
  const theme = useTheme();
  const chartConfig = useChartConfig();
  const screenWidth = Dimensions.get('window').width;
  const width = propWidth || screenWidth - 32;
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const duration = animationDuration ?? config.duration.normal;
  
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = outerRadius || Math.min(width, height) / 2 - 20;
  
  // Calculate total and percentages
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
  
  // Generate pie slices
  const slices = useMemo(() => {
    let startAngle = -Math.PI / 2; // Start from top
    
    return data.map((item, index) => {
      const percentage = item.value / total;
      const angle = percentage * 2 * Math.PI;
      const endAngle = startAngle + angle;
      
      // Calculate path
      const x1 = centerX + Math.cos(startAngle) * radius;
      const y1 = centerY + Math.sin(startAngle) * radius;
      const x2 = centerX + Math.cos(endAngle) * radius;
      const y2 = centerY + Math.sin(endAngle) * radius;
      
      const largeArcFlag = angle > Math.PI ? 1 : 0;
      
      let path: string;
      if (innerRadius > 0) {
        // Donut chart
        const innerX1 = centerX + Math.cos(startAngle) * innerRadius;
        const innerY1 = centerY + Math.sin(startAngle) * innerRadius;
        const innerX2 = centerX + Math.cos(endAngle) * innerRadius;
        const innerY2 = centerY + Math.sin(endAngle) * innerRadius;
        
        path = [
          `M ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          `L ${innerX2} ${innerY2}`,
          `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}`,
          'Z',
        ].join(' ');
      } else {
        // Regular pie chart
        path = [
          `M ${centerX} ${centerY}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z',
        ].join(' ');
      }
      
      // Calculate label position
      const labelAngle = startAngle + angle / 2;
      const labelRadius = labelPosition === 'inside' 
        ? (innerRadius + radius) / 2 
        : radius + 20;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;
      
      const slice = {
        path,
        color: item.color || chartConfig.colors[`chart${(index % 5) + 1}`],
        percentage,
        labelX,
        labelY,
        item,
        index,
        key: `slice-${index}`,
      };
      
      startAngle = endAngle;
      return slice;
    });
  }, [data, total, centerX, centerY, radius, innerRadius, labelPosition, chartConfig]);
  
  return (
    <View style={[{ width, height }, style]} testID={testID}>
      <Svg width={width} height={height}>
        {/* Slices */}
        {slices.map((slice, index) => (
          <AnimatedSlice
            key={slice.key}
            slice={slice}
            index={index}
            animated={animated}
            isAnimated={isAnimated}
            shouldAnimate={shouldAnimate}
            animationType={animationType}
            duration={duration}
            animationDelay={animationDelay}
            staggerDelay={staggerDelay}
            showLabels={showLabels}
            showValues={showValues}
            labelPosition={labelPosition}
            theme={theme}
            onPress={() => {
              if (useHaptics) {
                haptic('impact');
              }
              onSlicePress?.(slice.index, slice.item);
            }}
          />
        ))}
        
        {/* Center text for donut charts */}
        {innerRadius > 0 && (
          <G>
            <Circle
              cx={centerX}
              cy={centerY}
              r={innerRadius - 1}
              fill={theme.background}
            />
            <SvgText
              x={centerX}
              y={centerY - 8}
              fill={theme.foreground}
              fontSize={24}
              fontWeight="bold"
              textAnchor="middle"
            >
              {total}
            </SvgText>
            <SvgText
              x={centerX}
              y={centerY + 8}
              fill={theme.mutedForeground}
              fontSize={12}
              textAnchor="middle"
            >
              Total
            </SvgText>
          </G>
        )}
      </Svg>
    </View>
  );
};

// Animated Slice Component
interface AnimatedSliceProps {
  slice: any;
  index: number;
  animated: boolean;
  isAnimated: boolean;
  shouldAnimate: () => boolean;
  animationType: PieChartAnimationType;
  duration: number;
  animationDelay: number;
  staggerDelay: number;
  showLabels: boolean;
  showValues: boolean;
  labelPosition: 'inside' | 'outside';
  theme: any;
  onPress: () => void;
}

const AnimatedSlice: React.FC<AnimatedSliceProps> = ({
  slice,
  index,
  animated,
  isAnimated,
  shouldAnimate,
  animationType,
  duration,
  animationDelay,
  staggerDelay,
  showLabels,
  showValues,
  labelPosition,
  theme,
  onPress,
}) => {
  const animationProgress = useSharedValue(0);
  const scale = useSharedValue(1);
  const labelOpacity = useSharedValue(0);
  
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      const delay = animationDelay + (index * staggerDelay);
      
      if (animationType === 'rotate') {
        animationProgress.value = withDelay(
          delay,
          withTiming(1, {
            duration,
            easing: Easing.out(Easing.cubic),
          })
        );
      } else if (animationType === 'expand') {
        animationProgress.value = withDelay(
          delay,
          withSpring(1, {
            damping: 15,
            stiffness: 100,
          })
        );
      } else if (animationType === 'fade') {
        animationProgress.value = withDelay(
          delay,
          withTiming(1, { duration })
        );
      } else if (animationType === 'stagger') {
        animationProgress.value = withDelay(
          delay,
          withTiming(1, {
            duration: duration + (index * 50),
            easing: Easing.out(Easing.exp),
          })
        );
      }
      
      // Animate labels after slice
      labelOpacity.value = withDelay(
        delay + duration / 2,
        withTiming(1, { duration: duration / 2 })
      );
    } else {
      animationProgress.value = 1;
      labelOpacity.value = 1;
    }
  }, [animated, isAnimated, shouldAnimate, animationType, duration, animationDelay, staggerDelay, index, animationProgress, labelOpacity]);
  
  const animatedProps = useAnimatedProps(() => {
    let path = slice.path;
    let opacity = 1;
    let transform = [];
    
    if (animationType === 'rotate') {
      // Rotate animation - sweep from start angle
      const sweepProgress = interpolate(animationProgress.value, [0, 1], [0, 1]);
      // We'll need to recalculate the path based on sweep progress
      // For now, use opacity as a simpler implementation
      opacity = animationProgress.value;
    } else if (animationType === 'expand') {
      // Scale from center
      const scaleValue = interpolate(animationProgress.value, [0, 1], [0, 1]);
      transform = [{
        scale: scaleValue,
      }];
    } else if (animationType === 'fade') {
      opacity = animationProgress.value;
    } else if (animationType === 'stagger') {
      opacity = animationProgress.value;
      const scaleValue = interpolate(animationProgress.value, [0, 1], [0.8, 1]);
      transform = [{
        scale: scaleValue,
      }];
    }
    
    return {
      d: path,
      fill: slice.color,
      fillOpacity: opacity,
      transform: transform,
    };
  });
  
  const handlePressIn = () => {
    if (animated && isAnimated && shouldAnimate()) {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    }
  };
  
  const handlePressOut = () => {
    if (animated && isAnimated && shouldAnimate()) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
  };
  
  if (animated && isAnimated && shouldAnimate() && animationType !== 'none') {
    return (
      <G>
        <AnimatedPath
          animatedProps={animatedProps}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
        />
        
        {/* Animated Labels */}
        <AnimatedG style={{ opacity: labelOpacity }}>
          {showLabels && (
            <SvgText
              x={slice.labelX}
              y={slice.labelY - (showValues ? 8 : 0)}
              fill={labelPosition === 'inside' ? theme.background : theme.foreground}
              fontSize={12}
              fontWeight="500"
              textAnchor="middle"
            >
              {slice.item.label}
            </SvgText>
          )}
          
          {showValues && (
            <SvgText
              x={slice.labelX}
              y={slice.labelY + (showLabels ? 8 : 0)}
              fill={labelPosition === 'inside' ? theme.background : theme.mutedForeground}
              fontSize={11}
              textAnchor="middle"
            >
              {`${(slice.percentage * 100).toFixed(1)}%`}
            </SvgText>
          )}
        </AnimatedG>
      </G>
    );
  }
  
  return (
    <G>
      <Path
        d={slice.path}
        fill={slice.color}
        onPress={onPress}
      />
      
      {showLabels && (
        <SvgText
          x={slice.labelX}
          y={slice.labelY - (showValues ? 8 : 0)}
          fill={labelPosition === 'inside' ? theme.background : theme.foreground}
          fontSize={12}
          fontWeight="500"
          textAnchor="middle"
        >
          {slice.item.label}
        </SvgText>
      )}
      
      {showValues && (
        <SvgText
          x={slice.labelX}
          y={slice.labelY + (showLabels ? 8 : 0)}
          fill={labelPosition === 'inside' ? theme.background : theme.mutedForeground}
          fontSize={11}
          textAnchor="middle"
        >
          {`${(slice.percentage * 100).toFixed(1)}%`}
        </SvgText>
      )}
    </G>
  );
};