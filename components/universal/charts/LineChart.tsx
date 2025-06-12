import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  ViewStyle,
  Dimensions,
  Animated as RNAnimated,
  Platform,
} from 'react-native';
import Svg, {
  Path,
  Line,
  Text as SvgText,
  Circle,
  G,
  Defs,
  LinearGradient,
  Stop,
  Rect,
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
import { AnimationVariant , SpacingScale } from '@/lib/design';
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { haptic } from '@/lib/ui/haptics';
import { useChartConfig } from './ChartContainer';
import { Box } from '../Box';
import { Text } from '../Text';
import { HStack } from '../Stack';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface LineChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
    strokeWidth?: number;
    showPoints?: boolean;
    filled?: boolean;
  }[];
}

export type LineChartAnimationType = 'draw' | 'fade' | 'wave' | 'morph' | 'none';

export interface LineChartProps {
  data: LineChartData;
  width?: number;
  height?: number;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showLegend?: boolean;
  bezier?: boolean;
  style?: ViewStyle;
  onDataPointPress?: (dataset: number, index: number, value: number) => void;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationVariant?: AnimationVariant;
  animationType?: LineChartAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  staggerDelay?: number;
  useHaptics?: boolean;
  animationConfig?: {
    duration?: number;
    easing?: typeof Easing.inOut;
  };
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  width: propWidth,
  height = 200,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  showLegend = false,
  bezier = true,
  style,
  onDataPointPress,
  testID,
  // Animation props
  animated = true,
  animationVariant = 'moderate',
  animationType = 'draw',
  animationDuration,
  animationDelay = 0,
  staggerDelay = 100,
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
  
  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    value: number;
    label: string;
    datasetLabel: string;
  } | null>(null);
  const tooltipOpacity = useRef(new RNAnimated.Value(0)).current;
  const tooltipTimer = useRef<any>(null);
  
  const padding = {
    left: showYAxis ? 50 : 20,
    right: 20,
    top: 20,
    bottom: showXAxis ? 40 : 20,
  };
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate min and max values
  const allValues = data.datasets.flatMap(d => d.data);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const valueRange = maxValue - minValue || 1;
  
  // Calculate positions
  const xStep = chartWidth / (data.labels.length - 1 || 1);
  const yScale = chartHeight / valueRange;
  
  // Generate path for each dataset
  const paths = useMemo(() => {
    return data.datasets.map((dataset, datasetIndex) => {
      const points = dataset.data.map((value, index) => ({
        x: padding.left + index * xStep,
        y: padding.top + (maxValue - value) * yScale,
        value,
      }));
      
      let path = '';
      if (bezier && points.length > 2) {
        // Create smooth bezier curve
        path = `M ${points[0].x} ${points[0].y}`;
        
        for (let i = 1; i < points.length - 1; i++) {
          const cp1x = (points[i].x + points[i - 1].x) / 2;
          const cp1y = points[i - 1].y;
          const cp2x = (points[i].x + points[i - 1].x) / 2;
          const cp2y = points[i].y;
          
          path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
        }
        
        // Last point
        const lastIndex = points.length - 1;
        const cp1x = (points[lastIndex].x + points[lastIndex - 1].x) / 2;
        const cp1y = points[lastIndex - 1].y;
        const cp2x = (points[lastIndex].x + points[lastIndex - 1].x) / 2;
        const cp2y = points[lastIndex].y;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[lastIndex].x} ${points[lastIndex].y}`;
      } else {
        // Simple line path
        path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      }
      
      return { path, points, dataset, datasetIndex };
    });
  }, [data, xStep, yScale, padding, maxValue, bezier]);
  
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
      
      // Vertical grid lines
      data.labels.forEach((_, index) => {
        const x = padding.left + index * xStep;
        lines.push(
          <Line
            key={`v-grid-${index}`}
            x1={x}
            y1={padding.top}
            x2={x}
            y2={padding.top + chartHeight}
            stroke={chartConfig.styles.grid.stroke}
            strokeWidth={chartConfig.styles.grid.strokeWidth}
            strokeDasharray={chartConfig.styles.grid.strokeDasharray}
          />
        );
      });
    }
    
    return lines;
  }, [showGrid, data.labels, padding, chartHeight, chartWidth, xStep, chartConfig]);
  
  // Handle point hover/press
  const showTooltip = (datasetIndex: number, index: number, value: number, x: number, y: number) => {
    const dataset = data.datasets[datasetIndex];
    const label = data.labels[index];
    
    if (tooltipTimer.current) {
      clearTimeout(tooltipTimer.current);
    }
    
    setTooltip({
      x,
      y,
      value,
      label,
      datasetLabel: dataset.label,
    });
    
    RNAnimated.timing(tooltipOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    if (useHaptics) {
      haptic('selection');
    }
    
    onDataPointPress?.(datasetIndex, index, value);
  };
  
  const hideTooltip = () => {
    tooltipTimer.current = setTimeout(() => {
      RNAnimated.timing(tooltipOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setTooltip(null);
      });
    }, Platform.OS === 'web' ? 100 : 3000);
  };
  
  useEffect(() => {
    return () => {
      if (tooltipTimer.current) {
        clearTimeout(tooltipTimer.current);
      }
    };
  }, []);
  
  // Handle mouse/touch move for tooltip
  const handleChartInteraction = (event: any) => {
    const { locationX } = event.nativeEvent;
    if (!locationX || locationX < padding.left || locationX > width - padding.right) {
      hideTooltip();
      return;
    }
    
    // Find closest data point
    const xIndex = Math.round((locationX - padding.left) / xStep);
    if (xIndex >= 0 && xIndex < data.labels.length) {
      // Find the dataset with data at this index
      let closestDataset = 0;
      let closestValue = data.datasets[0].data[xIndex];
      let closestY = padding.top + (maxValue - closestValue) * yScale;
      
      // Show tooltip for the first dataset by default
      showTooltip(closestDataset, xIndex, closestValue, padding.left + xIndex * xStep, closestY);
    }
  };
  
  return (
    <View style={[{ width, height }, style]} testID={testID}>
      <Svg 
        width={width} 
        height={height}
        onTouchMove={handleChartInteraction}
        onTouchStart={handleChartInteraction}
        onTouchEnd={hideTooltip}
        {...(Platform.OS === 'web' && {
          onMouseMove: handleChartInteraction,
          onMouseLeave: hideTooltip,
        })}
      >
        <Defs>
          {paths.map(({ dataset, datasetIndex }) => (
            dataset.filled && (
              <LinearGradient
                key={`gradient-${datasetIndex}`}
                id={`gradient-${datasetIndex}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <Stop
                  offset="5%"
                  stopColor={dataset.color || chartConfig.colors[`chart${datasetIndex + 1}`]}
                  stopOpacity={datasetIndex === 0 ? 0.8 : 0.6}
                />
                <Stop
                  offset="95%"
                  stopColor={dataset.color || chartConfig.colors[`chart${datasetIndex + 1}`]}
                  stopOpacity={0.1}
                />
              </LinearGradient>
            )
          ))}
        </Defs>
        
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
              const x = padding.left + index * xStep;
              return (
                <SvgText
                  key={`x-label-${index}`}
                  x={x}
                  y={height - 10}
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
        
        {/* Draw lines and areas */}
        {paths.map(({ path, points, dataset, datasetIndex }) => {
          const color = dataset.color || chartConfig.colors[`chart${datasetIndex + 1}`];
          
          return (
            <AnimatedLine
              key={`dataset-${datasetIndex}`}
              path={path}
              points={points}
              dataset={dataset}
              datasetIndex={datasetIndex}
              color={color}
              padding={padding}
              chartHeight={chartHeight}
              animated={animated}
              isAnimated={isAnimated}
              shouldAnimate={shouldAnimate}
              animationType={animationType}
              duration={duration}
              animationDelay={animationDelay}
              staggerDelay={staggerDelay}
              tooltip={tooltip}
              chartConfig={chartConfig}
            />
          );
        })}
      </Svg>
      
      {/* Tooltip */}
      {tooltip && (
        <RNAnimated.View
          style={{
            position: 'absolute',
            left: Math.max(10, Math.min(tooltip.x - 75, width - 160)),
            top: Math.max(10, tooltip.y - 80),
            opacity: tooltipOpacity,
            pointerEvents: 'none',
            ...(Platform.OS === 'web' && {
              transition: 'left 0.15s ease-out, top 0.15s ease-out',
            }),
          }}
        >
          <Box
            bgTheme="popover"
            borderWidth={1}
            borderTheme="border"
            rounded="md"
            shadow="md"
            p={2.5 as SpacingScale}
            style={{
              minWidth: 120,
            }}
          >
            <HStack alignItems="center" spacing={1.5} mb={0.5 as SpacingScale}>
              <Box
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: tooltip.datasetLabel === 'Desktop' ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-2))',
                }}
              />
              <Text size="xs" weight="medium" colorTheme="foreground">
                {tooltip.datasetLabel}
              </Text>
            </HStack>
            <Text size="xs" colorTheme="mutedForeground">
              {tooltip.label}
            </Text>
            <Text size="sm" weight="bold" colorTheme="foreground" mt={0.5 as SpacingScale}>
              {tooltip.value.toLocaleString()}
            </Text>
          </Box>
        </RNAnimated.View>
      )}
    </View>
  );
};

// Animated Line Component
interface AnimatedLineProps {
  path: string;
  points: { x: number; y: number; value: number }[];
  dataset: any;
  datasetIndex: number;
  color: string;
  padding: any;
  chartHeight: number;
  animated: boolean;
  isAnimated: boolean;
  shouldAnimate: () => boolean;
  animationType: LineChartAnimationType;
  duration: number;
  animationDelay: number;
  staggerDelay: number;
  tooltip: any;
  chartConfig: any;
}

const AnimatedLine: React.FC<AnimatedLineProps> = ({
  path,
  points,
  dataset,
  datasetIndex,
  color,
  padding,
  chartHeight,
  animated,
  isAnimated,
  shouldAnimate,
  animationType,
  duration,
  animationDelay,
  staggerDelay,
  tooltip,
  chartConfig,
}) => {
  const pathAnimation = useSharedValue(0);
  const opacityAnimation = useSharedValue(0);
  
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      const delay = animationDelay + (datasetIndex * staggerDelay);
      
      if (animationType === 'draw') {
        pathAnimation.value = withDelay(
          delay,
          withTiming(1, {
            duration: duration * 1.5,
            easing: Easing.out(Easing.cubic),
          })
        );
        opacityAnimation.value = withDelay(
          delay,
          withTiming(1, { duration: duration / 2 })
        );
      } else if (animationType === 'fade') {
        pathAnimation.value = 1;
        opacityAnimation.value = withDelay(
          delay,
          withTiming(1, { duration })
        );
      } else if (animationType === 'wave') {
        pathAnimation.value = withDelay(
          delay,
          withTiming(1, {
            duration: duration * 2,
            easing: Easing.inOut(Easing.sin),
          })
        );
        opacityAnimation.value = withDelay(
          delay,
          withTiming(1, { duration: duration / 2 })
        );
      } else if (animationType === 'morph') {
        pathAnimation.value = withDelay(
          delay,
          withSpring(1, {
            damping: 12,
            stiffness: 100,
          })
        );
        opacityAnimation.value = withDelay(
          delay,
          withTiming(1, { duration: duration / 3 })
        );
      }
    } else {
      pathAnimation.value = 1;
      opacityAnimation.value = 1;
    }
  }, [animated, isAnimated, shouldAnimate, animationType, duration, animationDelay, staggerDelay, datasetIndex, pathAnimation, opacityAnimation]);
  
  const animatedPathProps = useAnimatedProps(() => {
    if (animationType === 'draw') {
      const pathLength = path.length;
      const strokeDashoffset = interpolate(pathAnimation.value, [0, 1], [pathLength, 0]);
      return {
        strokeDasharray: pathLength,
        strokeDashoffset,
        opacity: opacityAnimation.value,
      };
    } else if (animationType === 'wave') {
      // Create a wave effect by modifying the path
      return {
        opacity: opacityAnimation.value,
      };
    } else {
      return {
        opacity: opacityAnimation.value,
      };
    }
  });
  
  const animatedAreaProps = useAnimatedProps(() => ({
    opacity: interpolate(opacityAnimation.value, [0, 1], [0, 0.8]),
  }));
  
  const LineComponent = animated && isAnimated && shouldAnimate() && animationType !== 'none' ? AnimatedPath : Path;
  const AreaComponent = animated && isAnimated && shouldAnimate() && animationType !== 'none' ? AnimatedPath : Path;
  
  return (
    <G>
      {/* Filled area */}
      {dataset.filled && (
        <AreaComponent
          d={`${path} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`}
          fill={`url(#gradient-${datasetIndex})`}
          animatedProps={animated && isAnimated && shouldAnimate() && animationType !== 'none' ? animatedAreaProps : undefined}
        />
      )}
      
      {/* Line */}
      <LineComponent
        d={path}
        stroke={color}
        strokeWidth={dataset.strokeWidth || 2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        animatedProps={animated && isAnimated && shouldAnimate() && animationType !== 'none' ? animatedPathProps : undefined}
      />
      
      {/* Data points */}
      {points.map((point, index) => (
        <AnimatedDataPoint
          key={`point-${datasetIndex}-${index}`}
          point={point}
          index={index}
          color={color}
          animated={animated}
          isAnimated={isAnimated}
          shouldAnimate={shouldAnimate}
          animationDelay={animationDelay + (datasetIndex * staggerDelay) + (index * 30)}
          duration={duration}
          tooltip={tooltip}
          chartConfig={chartConfig}
        />
      ))}
    </G>
  );
};

// Animated Data Point Component
interface AnimatedDataPointProps {
  point: { x: number; y: number; value: number };
  index: number;
  color: string;
  animated: boolean;
  isAnimated: boolean;
  shouldAnimate: () => boolean;
  animationDelay: number;
  duration: number;
  tooltip: any;
  chartConfig: any;
}

const AnimatedDataPoint: React.FC<AnimatedDataPointProps> = ({
  point,
  index,
  color,
  animated,
  isAnimated,
  shouldAnimate,
  animationDelay,
  duration,
  tooltip,
  chartConfig,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    if (animated && isAnimated && shouldAnimate()) {
      opacity.value = withDelay(
        animationDelay,
        withTiming(1, { duration: duration / 3 })
      );
      scale.value = withDelay(
        animationDelay,
        withSpring(1, {
          damping: 12,
          stiffness: 200,
        })
      );
    } else {
      opacity.value = 1;
      scale.value = 1;
    }
  }, [animated, isAnimated, shouldAnimate, animationDelay, duration, opacity, scale]);
  
  const animatedProps = useAnimatedProps(() => ({
    r: interpolate(scale.value, [0, 1], [0, tooltip?.x === point.x && tooltip?.y === point.y ? 5 : 3]),
    opacity: opacity.value,
  }));
  
  if (tooltip?.x === point.x && tooltip?.y === point.y) {
    return (
      <AnimatedCircle
        cx={point.x}
        cy={point.y}
        fill={color}
        strokeWidth={2}
        stroke={chartConfig.colors.background}
        animatedProps={animatedProps}
      />
    );
  }
  
  return null;
};