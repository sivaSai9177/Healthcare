import React, { useMemo, useEffect } from 'react';
import {
  View,
  ViewStyle,
  Dimensions,
} from 'react-native';
import Svg, {
  Polygon,
  Line,
  Circle,
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
import { haptic } from '@/lib/ui/haptics';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

export interface RadarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
    fillOpacity?: number;
    strokeWidth?: number;
  }[];
}

export type RadarChartAnimationType = 'expand' | 'draw' | 'fade' | 'pulse' | 'none';

export interface RadarChartProps {
  data: RadarChartData;
  width?: number;
  height?: number;
  levels?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  showPoints?: boolean;
  style?: ViewStyle;
  onDataPointPress?: (dataset: number, index: number, value: number) => void;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationType?: RadarChartAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  staggerDelay?: number;
  useHaptics?: boolean;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  width: propWidth,
  height = 250,
  levels = 5,
  showGrid = true,
  showLabels = true,
  showPoints = true,
  style,
  onDataPointPress,
  testID,
  // Animation props
  animated = true,
  animationType = 'expand',
  animationDuration = 700,
  animationDelay = 0,
  staggerDelay = 100,
  useHaptics = true,
}) => {
  const chartConfig = useChartConfig();
  const screenWidth = Dimensions.get('window').width;
  const width = propWidth || screenWidth - 32;
  const duration = animationDuration;
  
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 40;
  
  // Calculate max value
  const maxValue = Math.max(...data.datasets.flatMap(d => d.data));
  
  // Calculate angle for each data point
  const angleStep = (2 * Math.PI) / data.labels.length;
  
  // Generate grid
  const gridLines = useMemo(() => {
    const lines = [];
    
    if (showGrid) {
      // Concentric polygons
      for (let level = 1; level <= levels; level++) {
        const levelRadius = (radius * level) / levels;
        const points = data.labels.map((_, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const x = centerX + Math.cos(angle) * levelRadius;
          const y = centerY + Math.sin(angle) * levelRadius;
          return `${x},${y}`;
        }).join(' ');
        
        lines.push(
          <Polygon
            key={`grid-level-${level}`}
            points={points}
            fill="none"
            stroke={chartConfig.styles.grid.stroke}
            strokeWidth={chartConfig.styles.grid.strokeWidth}
          />
        );
      }
      
      // Radial lines
      data.labels.forEach((_, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        lines.push(
          <Line
            key={`grid-radial-${index}`}
            x1={centerX}
            y1={centerY}
            x2={x}
            y2={y}
            stroke={chartConfig.styles.grid.stroke}
            strokeWidth={chartConfig.styles.grid.strokeWidth}
          />
        );
      });
    }
    
    return lines;
  }, [showGrid, levels, data.labels, angleStep, centerX, centerY, radius, chartConfig]);
  
  // Generate data polygons
  const dataPolygons = useMemo(() => {
    return data.datasets.map((dataset, datasetIndex) => {
      const points = dataset.data.map((value, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const distance = (value / maxValue) * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        return { x, y, value, index };
      });
      
      const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');
      const color = dataset.color || chartConfig.colors[`chart${datasetIndex + 1}`];
      
      return {
        polygonPoints,
        points,
        color,
        fillOpacity: dataset.fillOpacity || 0.3,
        strokeWidth: dataset.strokeWidth || 2,
        datasetIndex,
        key: `dataset-${datasetIndex}`,
      };
    });
  }, [data.datasets, angleStep, maxValue, radius, centerX, centerY, chartConfig]);
  
  // Labels
  const labels = useMemo(() => {
    if (!showLabels) return null;
    
    return data.labels.map((label, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * (radius + 20);
      const y = centerY + Math.sin(angle) * (radius + 20);
      
      return (
        <SvgText
          key={`label-${index}`}
          x={x}
          y={y}
          fill={chartConfig.styles.text.fill}
          fontSize={chartConfig.styles.text.fontSize}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {label}
        </SvgText>
      );
    });
  }, [showLabels, data.labels, angleStep, centerX, centerY, radius, chartConfig]);
  
  return (
    <View style={[{ width, height }, style] as any} testID={testID}>
      <Svg width={width} height={height}>
        {/* Grid */}
        {gridLines}
        
        {/* Data polygons */}
        {dataPolygons.map((polygon, datasetIndex) => (
          <AnimatedDataset
            key={polygon.key}
            polygon={polygon}
            datasetIndex={datasetIndex}
            showPoints={showPoints}
            animated={animated}
            animationType={animationType}
            duration={duration}
            animationDelay={animationDelay}
            staggerDelay={staggerDelay}
            onPointPress={(pointIndex, value) => {
              if (useHaptics) {
                haptic('impact');
              }
              onDataPointPress?.(polygon.datasetIndex, pointIndex, value);
            }}
          />
        ))}
        
        {/* Labels */}
        {labels}
      </Svg>
    </View>
  );
};

// Animated Dataset Component
interface AnimatedDatasetProps {
  polygon: any;
  datasetIndex: number;
  showPoints: boolean;
  animated: boolean;
  animationType: RadarChartAnimationType;
  duration: number;
  animationDelay: number;
  staggerDelay: number;
  onPointPress: (index: number, value: number) => void;
}

const AnimatedDataset: React.FC<AnimatedDatasetProps> = ({
  polygon,
  datasetIndex,
  showPoints,
  animated,
  animationType,
  duration,
  animationDelay,
  staggerDelay,
  onPointPress,
}) => {
  const animationProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const pointScale = useSharedValue(0);
  
  useEffect(() => {
    if (animated) {
      const delay = animationDelay + (datasetIndex * staggerDelay);
      
      if (animationType === 'expand') {
        animationProgress.value = withDelay(
          delay,
          withSpring(1, {
            damping: 15,
            stiffness: 100,
          })
        );
      } else if (animationType === 'draw') {
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
      } else if (animationType === 'pulse') {
        animationProgress.value = withDelay(
          delay,
          withTiming(1, { duration })
        );
        // Add pulse effect
        pulseScale.value = withDelay(
          delay + duration,
          withTiming(1.05, {
            duration: 1000,
            easing: Easing.inOut(Easing.sine),
          })
        );
      }
      
      // Animate points after polygon
      if (showPoints) {
        pointScale.value = withDelay(
          delay + duration / 2,
          withSpring(1, {
            damping: 10,
            stiffness: 200,
          })
        );
      }
    } else {
      animationProgress.value = 1;
      pointScale.value = 1;
    }
  }, [animated, animationType, duration, animationDelay, staggerDelay, datasetIndex, showPoints, animationProgress, pulseScale, pointScale]);
  
  const animatedPolygonProps = useAnimatedProps(() => {
    let scale = 1;
    let opacity = polygon.fillOpacity;
    
    if (animationType === 'expand') {
      scale = animationProgress.value;
    } else if (animationType === 'draw') {
      // For draw effect, we'd need to animate stroke-dasharray
      // For now, use scale as a simpler implementation
      scale = animationProgress.value;
    } else if (animationType === 'fade') {
      opacity = interpolate(animationProgress.value, [0, 1], [0, polygon.fillOpacity]);
    } else if (animationType === 'pulse') {
      scale = interpolate(animationProgress.value, [0, 1], [0.8, 1]) * pulseScale.value;
      opacity = interpolate(animationProgress.value, [0, 1], [0, polygon.fillOpacity]);
    }
    
    return {
      points: polygon.polygonPoints,
      fill: polygon.color,
      fillOpacity: opacity,
      stroke: polygon.color,
      strokeWidth: polygon.strokeWidth,
      transform: [{
        scale,
      }],
      transformOrigin: 'center',
    };
  });
  
  const animatedPointProps = useAnimatedProps(() => {
    return {
      r: 4 * pointScale.value,
    };
  });
  
  if (animated && animationType !== 'none') {
    return (
      <G>
        <AnimatedPolygon
          animatedProps={animatedPolygonProps}
        />
        
        {/* Animated Data points */}
        {showPoints && polygon.points.map((point: any, index: number) => (
          <AnimatedCircle
            key={`point-${polygon.datasetIndex}-${index}`}
            cx={point.x}
            cy={point.y}
            animatedProps={animatedPointProps}
            fill={polygon.color}
            onPress={() => onPointPress(point.index, point.value)}
          />
        ))}
      </G>
    );
  }
  
  return (
    <G>
      <Polygon
        points={polygon.polygonPoints}
        fill={polygon.color}
        fillOpacity={polygon.fillOpacity}
        stroke={polygon.color}
        strokeWidth={polygon.strokeWidth}
      />
      
      {showPoints && polygon.points.map((point: any, index: number) => (
        <Circle
          key={`point-${polygon.datasetIndex}-${index}`}
          cx={point.x}
          cy={point.y}
          r={4}
          fill={polygon.color}
          onPress={() => onPointPress(point.index, point.value)}
        />
      ))}
    </G>
  );
};