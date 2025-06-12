import React, { useMemo, useEffect } from 'react';
import {
  View,
  ViewStyle,
  Dimensions,
} from 'react-native';
import Svg, {
  Rect,
  Line,
  Text as SvgText,
  G,
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
import { AnimationVariant } from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export interface BarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

export type BarChartAnimationType = 'grow' | 'fade' | 'slide' | 'stagger' | 'none';

export interface BarChartProps {
  data: BarChartData;
  width?: number;
  height?: number;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  horizontal?: boolean;
  stacked?: boolean;
  barWidth?: number;
  style?: ViewStyle;
  onBarPress?: (dataset: number, index: number, value: number) => void;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: BarChartAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  staggerDelay?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    easing?: typeof Easing.inOut;
  };
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  width: propWidth,
  height = 200,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  horizontal = false,
  stacked = false,
  barWidth: customBarWidth,
  style,
  onBarPress,
  testID,
  // Animation props
  animated = true,
  animationVariant = 'moderate',
  animationType = 'grow',
  animationDuration,
  animationDelay = 0,
  staggerDelay = 50,
  useHaptics = true,
  animationConfig,
}) => {
  const chartConfig = useChartConfig();
  const screenWidth = Dimensions.get('window').width;
  const width = propWidth || screenWidth - 32;
  const { shouldAnimate } = useAnimationStore();
  const { config, isAnimated } = useAnimationVariant({
    variant: animationVariant,
    overrides: animationConfig,
  });
  
  const duration = animationDuration ?? config.duration.normal;
  
  const padding = useMemo(() => ({
    left: showYAxis ? 60 : 20,
    right: 20,
    top: 20,
    bottom: showXAxis ? 50 : 20,
  }), [showYAxis, showXAxis]);
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate min and max values
  const maxValue = useMemo(() => {
    if (stacked) {
      // For stacked bars, sum values at each index
      return Math.max(...data.labels.map((_, index) => 
        data.datasets.reduce((sum, dataset) => sum + dataset.data[index], 0)
      ));
    } else {
      // For grouped bars, find max individual value
      return Math.max(...data.datasets.flatMap(d => d.data));
    }
  }, [data, stacked]);
  
  const minValue = 0; // Bar charts typically start at 0
  const valueRange = maxValue - minValue || 1;
  
  // Calculate bar dimensions
  const groupWidth = chartWidth / data.labels.length;
  const defaultBarWidth = stacked ? groupWidth * 0.6 : (groupWidth * 0.8) / data.datasets.length;
  const barWidth = customBarWidth || defaultBarWidth;
  const barSpacing = (groupWidth - (stacked ? barWidth : barWidth * data.datasets.length)) / 2;
  
  // Generate bars
  const bars = useMemo(() => {
    const result: any[] = [];
    
    data.labels.forEach((label, labelIndex) => {
      let stackedHeight = 0;
      
      data.datasets.forEach((dataset, datasetIndex) => {
        const value = dataset.data[labelIndex];
        const barHeight = (value / valueRange) * chartHeight;
        
        let x: number, y: number;
        
        if (stacked) {
          x = padding.left + labelIndex * groupWidth + barSpacing;
          y = padding.top + chartHeight - stackedHeight - barHeight;
          stackedHeight += barHeight;
        } else {
          x = padding.left + labelIndex * groupWidth + barSpacing + datasetIndex * barWidth;
          y = padding.top + chartHeight - barHeight;
        }
        
        const color = dataset.color || chartConfig.colors[`chart${datasetIndex + 1}`];
        
        result.push({
          x,
          y,
          width: barWidth,
          height: barHeight,
          value,
          color,
          datasetIndex,
          labelIndex,
          key: `bar-${datasetIndex}-${labelIndex}`,
        });
      });
    });
    
    return result;
  }, [data, stacked, groupWidth, barWidth, barSpacing, chartHeight, valueRange, padding, chartConfig]);
  
  // Grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    
    if (showGrid) {
      // Horizontal grid lines
      const ySteps = 5;
      for (let i = 0; i <= ySteps; i++) {
        const y = padding.top + (i * chartHeight) / ySteps;
        lines.push(
          <Line
            key={`h-grid-${i}`}
            x1={padding.left}
            y1={y}
            x2={padding.left + chartWidth}
            y2={y}
            stroke={chartConfig.styles.grid.stroke}
            strokeWidth={chartConfig.styles.grid.strokeWidth}
            strokeDasharray={chartConfig.styles.grid.strokeDasharray}
          />
        );
      }
    }
    
    return lines;
  }, [showGrid, padding, chartHeight, chartWidth, chartConfig]);
  
  return (
    <View style={[{ width, height }, style]} testID={testID}>
      <Svg width={width} height={height}>
        {/* Grid */}
        {gridLines}
        
        {/* Axes */}
        {showXAxis && (
          <Line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight}
            stroke={chartConfig.styles.axis.stroke}
            strokeWidth={chartConfig.styles.axis.strokeWidth}
          />
        )}
        
        {showYAxis && (
          <Line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            stroke={chartConfig.styles.axis.stroke}
            strokeWidth={chartConfig.styles.axis.strokeWidth}
          />
        )}
        
        {/* Y-axis labels */}
        {showYAxis && (
          <G>
            {[0, 1, 2, 3, 4, 5].map(i => {
              const value = minValue + (valueRange * (5 - i)) / 5;
              const y = padding.top + (i * chartHeight) / 5;
              return (
                <SvgText
                  key={`y-label-${i}`}
                  x={padding.left - 10}
                  y={y + 4}
                  fill={chartConfig.styles.text.fill}
                  fontSize={chartConfig.styles.text.fontSize}
                  textAnchor="end"
                >
                  {value.toFixed(0)}
                </SvgText>
              );
            })}
          </G>
        )}
        
        {/* X-axis labels */}
        {showXAxis && (
          <G>
            {data.labels.map((label, index) => {
              const x = padding.left + index * groupWidth + groupWidth / 2;
              return (
                <SvgText
                  key={`x-label-${index}`}
                  x={x}
                  y={height - padding.bottom + 15}
                  fill={chartConfig.styles.text.fill}
                  fontSize={chartConfig.styles.text.fontSize}
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              );
            })}
          </G>
        )}
        
        {/* Bars */}
        {bars.map((bar, index) => (
          <AnimatedBar
            key={bar.key}
            bar={bar}
            index={index}
            animated={animated}
            isAnimated={isAnimated}
            shouldAnimate={shouldAnimate}
            animationType={animationType}
            duration={duration}
            animationDelay={animationDelay}
            staggerDelay={staggerDelay}
            onPress={() => {
              if (useHaptics) {
                haptic('impact');
              }
              onBarPress?.(bar.datasetIndex, bar.labelIndex, bar.value);
            }}
          />
        ))}
      </Svg>
    </View>
  );
};

// Animated Bar Component
interface AnimatedBarProps {
  bar: any;
  index: number;
  animated: boolean;
  isAnimated: boolean;
  shouldAnimate: () => boolean;
  animationType: BarChartAnimationType;
  duration: number;
  animationDelay: number;
  staggerDelay: number;
  onPress: () => void;
}

const AnimatedBar: React.FC<AnimatedBarProps> = ({
  bar,
  index,
  animated,
  isAnimated,
  shouldAnimate,
  animationType,
  duration,
  animationDelay,
  staggerDelay,
  onPress,
}) => {
  const animationProgress = useSharedValue(0);
  const scale = useSharedValue(1);
  
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      const delay = animationDelay + (index * staggerDelay);
      
      if (animationType === 'grow') {
        animationProgress.value = withDelay(
          delay,
          withTiming(1, {
            duration,
            easing: Easing.out(Easing.cubic),
          })
        );
      } else if (animationType === 'fade') {
        animationProgress.value = withDelay(
          delay,
          withTiming(1, { duration })
        );
      } else if (animationType === 'slide') {
        animationProgress.value = withDelay(
          delay,
          withSpring(1, {
            damping: 15,
            stiffness: 100,
          })
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
    } else {
      animationProgress.value = 1;
    }
  }, [animated, isAnimated, shouldAnimate, animationType, duration, animationDelay, staggerDelay, index, animationProgress]);
  
  const animatedProps = useAnimatedProps(() => {
    let height = bar.height;
    let y = bar.y;
    let opacity = 1;
    
    if (animationType === 'grow') {
      height = interpolate(animationProgress.value, [0, 1], [0, bar.height]);
      y = interpolate(animationProgress.value, [0, 1], [bar.y + bar.height, bar.y]);
    } else if (animationType === 'fade') {
      opacity = animationProgress.value;
    } else if (animationType === 'slide') {
      y = interpolate(animationProgress.value, [0, 1], [bar.y + 50, bar.y]);
      opacity = interpolate(animationProgress.value, [0, 0.5, 1], [0, 0.8, 1]);
    } else if (animationType === 'stagger') {
      height = interpolate(animationProgress.value, [0, 1], [0, bar.height]);
      y = interpolate(animationProgress.value, [0, 1], [bar.y + bar.height, bar.y]);
      opacity = interpolate(animationProgress.value, [0, 0.3, 1], [0, 0.5, 1]);
    }
    
    return {
      x: bar.x,
      y,
      width: bar.width * scale.value,
      height,
      fill: bar.color,
      fillOpacity: opacity,
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
      <AnimatedRect
        animatedProps={animatedProps}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      />
    );
  }
  
  return (
    <Rect
      x={bar.x}
      y={bar.y}
      width={bar.width}
      height={bar.height}
      fill={bar.color}
      onPress={onPress}
    />
  );
};