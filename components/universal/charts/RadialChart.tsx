import React, { useEffect } from 'react';
import {
  View,
  ViewStyle,
  Text,
  Dimensions,
} from 'react-native';
import Svg, {
  Circle,
  Path,
  G,
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


const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedSvgText = Animated.createAnimatedComponent(SvgText);

export type RadialChartAnimationType = 'sweep' | 'fade' | 'pulse' | 'bounce' | 'none';

export interface RadialChartProps {
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showValue?: boolean;
  showPercentage?: boolean;
  label?: string;
  startAngle?: number;
  endAngle?: number;
  style?: ViewStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationType?: RadialChartAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  useHaptics?: boolean;
}

export const RadialChart: React.FC<RadialChartProps> = ({
  value,
  maxValue = 100,
  size: propSize,
  strokeWidth = 20,
  color,
  backgroundColor,
  showValue = true,
  showPercentage = false,
  label,
  startAngle = -90,
  endAngle = 270,
  style,
  testID,
  // Animation props
  animated = true,
  animationType = 'sweep',
  animationDuration = 700,
  animationDelay = 0,
  useHaptics = true,
}) => {
  const chartConfig = useChartConfig();
  const screenWidth = Dimensions.get('window').width;
  const size = propSize || Math.min(screenWidth - 64, 200);
  
  const duration = animationDuration;
  
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Calculate percentage
  const percentage = Math.min(value / maxValue, 1);
  
  // Convert angles to radians
  const startAngleRad = (startAngle * Math.PI) / 180;
  const endAngleRad = (endAngle * Math.PI) / 180;
  const sweepAngle = endAngleRad - startAngleRad;
  const currentAngle = startAngleRad + sweepAngle * percentage;
  
  // Calculate path
  const x1 = centerX + Math.cos(startAngleRad) * radius;
  const y1 = centerY + Math.sin(startAngleRad) * radius;
  const x2 = centerX + Math.cos(currentAngle) * radius;
  const y2 = centerY + Math.sin(currentAngle) * radius;
  
  const largeArcFlag = Math.abs(currentAngle - startAngleRad) > Math.PI ? 1 : 0;
  
  const pathData = [
    `M ${x1} ${y1}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
  ].join(' ');
  
  const backgroundPathData = [
    `M ${x1} ${y1}`,
    `A ${radius} ${radius} 0 ${Math.abs(sweepAngle) > Math.PI ? 1 : 0} 1 ${centerX + Math.cos(endAngleRad) * radius} ${centerY + Math.sin(endAngleRad) * radius}`,
  ].join(' ');
  
  const progressColor = color || chartConfig.colors.primary;
  const bgColor = backgroundColor || '#e5e7eb';
  
  // Animation values
  const animationProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const textOpacity = useSharedValue(0);
  
  useEffect(() => {
    if (animated) {
      if (animationType === 'sweep') {
        animationProgress.value = withDelay(
          animationDelay,
          withTiming(1, {
            duration,
            easing: Easing.out(Easing.cubic),
          })
        );
      } else if (animationType === 'fade') {
        animationProgress.value = withDelay(
          animationDelay,
          withTiming(1, { duration })
        );
      } else if (animationType === 'pulse') {
        animationProgress.value = withDelay(
          animationDelay,
          withTiming(1, { duration })
        );
        // Add continuous pulse
        pulseScale.value = withDelay(
          animationDelay + duration,
          withTiming(1.05, {
            duration: 1500,
            easing: Easing.inOut(Easing.sine),
          })
        );
      } else if (animationType === 'bounce') {
        animationProgress.value = withDelay(
          animationDelay,
          withSpring(1, {
            damping: 8,
            stiffness: 100,
            velocity: 2,
          })
        );
      }
      
      // Animate text after progress
      textOpacity.value = withDelay(
        animationDelay + duration / 2,
        withTiming(1, { duration: duration / 2 })
      );
    } else {
      animationProgress.value = 1;
      textOpacity.value = 1;
    }
  }, [animated, animationType, duration, animationDelay, animationProgress, pulseScale, textOpacity]);
  
  const animatedProgressProps = useAnimatedProps(() => {
    const progress = animationProgress.value * percentage;
    const currentAngleAnimated = startAngleRad + sweepAngle * progress;
    
    const x2Animated = centerX + Math.cos(currentAngleAnimated) * radius;
    const y2Animated = centerY + Math.sin(currentAngleAnimated) * radius;
    
    const largeArcFlagAnimated = Math.abs(currentAngleAnimated - startAngleRad) > Math.PI ? 1 : 0;
    
    const pathDataAnimated = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlagAnimated} 1 ${x2Animated} ${y2Animated}`,
    ].join(' ');
    
    let opacity = 1;
    let scale = 1;
    
    if (animationType === 'fade') {
      opacity = animationProgress.value;
    } else if (animationType === 'pulse') {
      scale = pulseScale.value;
    }
    
    return {
      d: pathDataAnimated,
      stroke: progressColor,
      strokeWidth: strokeWidth * scale,
      fillOpacity: 0,
      strokeOpacity: opacity,
    };
  });
  
  const animatedTextStyle = useAnimatedProps(() => {
    return {
      opacity: textOpacity.value,
    };
  });
  
  if (animated && animationType !== 'none') {
    return (
      <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style] as any} testID={testID}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <G>
            {/* Background arc */}
            <Path
              d={backgroundPathData}
              stroke={bgColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
            />
            
            {/* Animated Progress arc */}
            <AnimatedPath
              animatedProps={animatedProgressProps}
              fill="none"
              strokeLinecap="round"
            />
          </G>
        </Svg>
        
        {/* Center content */}
        <Animated.View style={[{ alignItems: 'center' }, animatedTextStyle] as any}>
          {showValue && (
            <Text
              style={{
                fontSize: size / 5,
                fontWeight: 'bold',
                color: '#000000',
              }}
            >
              {showPercentage ? `${Math.round(percentage * 100)}%` : value}
            </Text>
          )}
          {label && (
            <Text
              style={{
                fontSize: size / 12,
                color: '#6b7280',
                marginTop: 4,
              }}
            >
              {label}
            </Text>
          )}
        </Animated.View>
      </View>
    );
  }
  
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style] as any} testID={testID}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <G>
          {/* Background arc */}
          <Path
            d={backgroundPathData}
            stroke={bgColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Progress arc */}
          <Path
            d={pathData}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        </G>
      </Svg>
      
      {/* Center content */}
      <View style={{ alignItems: 'center' }}>
        {showValue && (
          <Text
            style={{
              fontSize: size / 5,
              fontWeight: 'bold',
              color: '#000000',
            }}
          >
            {showPercentage ? `${Math.round(percentage * 100)}%` : value}
          </Text>
        )}
        {label && (
          <Text
            style={{
              fontSize: size / 12,
              color: '#6b7280',
              marginTop: 4,
            }}
          >
            {label}
          </Text>
        )}
      </View>
    </View>
  );
};

// Multiple radial charts for comparison
export interface RadialBarChartData {
  label: string;
  value: number;
  color?: string;
}

export interface RadialBarChartProps {
  data: RadialBarChartData[];
  maxValue?: number;
  size?: number;
  innerRadius?: number;
  barWidth?: number;
  showLabels?: boolean;
  showValues?: boolean;
  style?: ViewStyle;
  testID?: string;
  
  // Animation props
  animated?: boolean;
  animationType?: RadialChartAnimationType;
  animationDuration?: number;
  animationDelay?: number;
  staggerDelay?: number;
  useHaptics?: boolean;
}

export const RadialBarChart: React.FC<RadialBarChartProps> = ({
  data,
  maxValue = 100,
  size: propSize,
  innerRadius = 30,
  barWidth = 15,
  showLabels = true,
  showValues = true,
  style,
  testID,
  // Animation props
  animated = true,
  animationType = 'sweep',
  animationDuration = 700,
  animationDelay = 0,
  staggerDelay = 100,
  useHaptics = true,
}) => {
  const chartConfig = useChartConfig();
  const screenWidth = Dimensions.get('window').width;
  const size = propSize || Math.min(screenWidth - 64, 250);
  
  const duration = animationDuration;
  
  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = size / 2 - 20;
  
  const bars = data.map((item, index) => {
    const radius = maxRadius - index * (barWidth + 5);
    const percentage = Math.min(item.value / maxValue, 1);
    const sweepAngle = percentage * 2 * Math.PI * 0.75; // 3/4 circle
    const startAngle = -Math.PI * 0.75;
    const endAngle = startAngle + sweepAngle;
    
    const x1 = centerX + Math.cos(startAngle) * radius;
    const y1 = centerY + Math.sin(startAngle) * radius;
    const x2 = centerX + Math.cos(endAngle) * radius;
    const y2 = centerY + Math.sin(endAngle) * radius;
    
    const bgEndAngle = startAngle + 2 * Math.PI * 0.75;
    const bgX2 = centerX + Math.cos(bgEndAngle) * radius;
    const bgY2 = centerY + Math.sin(bgEndAngle) * radius;
    
    const color = item.color || chartConfig.colors[`chart${(index % 5) + 1}`];
    
    return {
      progressPath: `M ${x1} ${y1} A ${radius} ${radius} 0 ${sweepAngle > Math.PI ? 1 : 0} 1 ${x2} ${y2}`,
      backgroundPath: `M ${x1} ${y1} A ${radius} ${radius} 0 1 1 ${bgX2} ${bgY2}`,
      color,
      item,
      radius,
      percentage,
    };
  });
  
  return (
    <View style={[{ width: size, height: size }, style] as any} testID={testID}>
      <Svg width={size} height={size}>
        {bars.map((bar, index) => (
          <AnimatedRadialBar
            key={`bar-${index}`}
            bar={bar}
            index={index}
            barWidth={barWidth}
            centerX={centerX}
            centerY={centerY}
            showLabels={showLabels}
            showValues={showValues}
            animated={animated}
            animationType={animationType}
            duration={duration}
            animationDelay={animationDelay}
            staggerDelay={staggerDelay}
          />
        ))}
      </Svg>
    </View>
  );
};

// Animated Radial Bar Component
interface AnimatedRadialBarProps {
  bar: any;
  index: number;
  barWidth: number;
  centerX: number;
  centerY: number;
  showLabels: boolean;
  showValues: boolean;
  animated: boolean;
  animationType: RadialChartAnimationType;
  duration: number;
  animationDelay: number;
  staggerDelay: number;
}

const AnimatedRadialBar: React.FC<AnimatedRadialBarProps> = ({
  bar,
  index,
  barWidth,
  centerX,
  centerY,
  showLabels,
  showValues,
  animated,
  animationType,
  duration,
  animationDelay,
  staggerDelay,
}) => {
  const animationProgress = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  
  useEffect(() => {
    if (animated) {
      const delay = animationDelay + (index * staggerDelay);
      
      if (animationType === 'sweep') {
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
      } else if (animationType === 'bounce') {
        animationProgress.value = withDelay(
          delay,
          withSpring(1, {
            damping: 8,
            stiffness: 100,
          })
        );
      }
      
      // Animate text after bar
      textOpacity.value = withDelay(
        delay + duration / 2,
        withTiming(1, { duration: duration / 2 })
      );
    } else {
      animationProgress.value = 1;
      textOpacity.value = 1;
    }
  }, [animated, animationType, duration, animationDelay, staggerDelay, index, animationProgress, textOpacity]);
  
  const animatedProgressProps = useAnimatedProps(() => {
    const progress = animationProgress.value * bar.percentage;
    const sweepAngleAnimated = progress * 2 * Math.PI * 0.75;
    const startAngle = -Math.PI * 0.75;
    const endAngleAnimated = startAngle + sweepAngleAnimated;
    
    const x2Animated = centerX + Math.cos(endAngleAnimated) * bar.radius;
    const y2Animated = centerY + Math.sin(endAngleAnimated) * bar.radius;
    
    const progressPathAnimated = `M ${bar.progressPath.split(' ')[1]} ${bar.progressPath.split(' ')[2]} A ${bar.radius} ${bar.radius} 0 ${sweepAngleAnimated > Math.PI ? 1 : 0} 1 ${x2Animated} ${y2Animated}`;
    
    let opacity = 1;
    if (animationType === 'fade') {
      opacity = animationProgress.value;
    }
    
    return {
      d: progressPathAnimated,
      stroke: bar.color,
      strokeWidth: barWidth,
      strokeOpacity: opacity,
    };
  });
  
  const animatedTextProps = useAnimatedProps(() => {
    return {
      fillOpacity: textOpacity.value,
    };
  });
  
  if (animated && animationType !== 'none') {
    return (
      <G>
        {/* Background */}
        <Path
          d={bar.backgroundPath}
          stroke="#e5e7eb"
          strokeWidth={barWidth}
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Animated Progress */}
        <AnimatedPath
          animatedProps={animatedProgressProps}
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Animated Label */}
        {showLabels && (
          <AnimatedSvgText
            x={centerX - bar.radius - barWidth}
            y={centerY + 4}
            fill="#6b7280"
            fontSize={10}
            textAnchor="end"
            animatedProps={animatedTextProps}
          >
            {bar.item.label}
          </AnimatedSvgText>
        )}
        
        {/* Animated Value */}
        {showValues && (
          <AnimatedSvgText
            x={centerX + bar.radius + barWidth}
            y={centerY + 4}
            fill="#000000"
            fontSize={12}
            fontWeight="bold"
            textAnchor="start"
            animatedProps={animatedTextProps}
          >
            {`${Math.round(bar.percentage * 100)}%`}
          </AnimatedSvgText>
        )}
      </G>
    );
  }
  
  return (
    <G>
      {/* Background */}
      <Path
        d={bar.backgroundPath}
        stroke="#e5e7eb"
        strokeWidth={barWidth}
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Progress */}
      <Path
        d={bar.progressPath}
        stroke={bar.color}
        strokeWidth={barWidth}
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Label */}
      {showLabels && (
        <SvgText
          x={centerX - bar.radius - barWidth}
          y={centerY + 4}
          fill="#6b7280"
          fontSize={10}
          textAnchor="end"
        >
          {bar.item.label}
        </SvgText>
      )}
      
      {/* Value */}
      {showValues && (
        <SvgText
          x={centerX + bar.radius + barWidth}
          y={centerY + 4}
          fill="#000000"
          fontSize={12}
          fontWeight="bold"
          textAnchor="start"
        >
          {`${Math.round(bar.percentage * 100)}%`}
        </SvgText>
      )}
    </G>
  );
};