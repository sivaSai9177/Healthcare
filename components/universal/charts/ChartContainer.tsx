import React from 'react';
import {
  View,
  Text,
  ViewStyle,
  TextStyle,
  ScrollView,
  Platform,
} from 'react-native';
import { useTheme } from '@/lib/theme/theme-provider';
import { useSpacing } from '@/contexts/SpacingContext';
import { Card } from '../Card';

export interface ChartContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  height?: number;
  aspectRatio?: number;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  descriptionStyle?: TextStyle;
  contentStyle?: ViewStyle;
  testID?: string;
}

export const ChartContainer = React.forwardRef<View, ChartContainerProps>(
  (
    {
      children,
      title,
      description,
      height = 300,
      aspectRatio,
      style,
      titleStyle,
      descriptionStyle,
      contentStyle,
      testID,
    },
    ref
  ) => {
    const theme = useTheme();
    const { spacing } = useSpacing();

    const containerHeight = aspectRatio ? undefined : height;

    return (
      <Card ref={ref} p={4} style={style} testID={testID}>
        {(title || description) && (
          <View style={{ marginBottom: spacing[4] }}>
            {title && (
              <Text
                style={[
                  {
                    fontSize: 18,
                    fontWeight: '600',
                    color: theme.foreground,
                    marginBottom: spacing[1],
                  },
                  titleStyle,
                ]}
              >
                {title}
              </Text>
            )}
            {description && (
              <Text
                style={[
                  {
                    fontSize: 14,
                    color: theme.mutedForeground,
                  },
                  descriptionStyle,
                ]}
              >
                {description}
              </Text>
            )}
          </View>
        )}
        
        <View
          style={[
            {
              height: containerHeight,
              aspectRatio,
            },
            contentStyle,
          ]}
        >
          {children}
        </View>
      </Card>
    );
  }
);

ChartContainer.displayName = 'ChartContainer';

// Chart Legend Component
export interface ChartLegendItem {
  name: string;
  color: string;
  value?: string | number;
}

export interface ChartLegendProps {
  items: ChartLegendItem[];
  orientation?: 'horizontal' | 'vertical';
  position?: 'top' | 'bottom' | 'left' | 'right';
  style?: ViewStyle;
  itemStyle?: ViewStyle;
  labelStyle?: TextStyle;
  valueStyle?: TextStyle;
}

export const ChartLegend: React.FC<ChartLegendProps> = ({
  items,
  orientation = 'horizontal',
  position = 'bottom',
  style,
  itemStyle,
  labelStyle,
  valueStyle,
}) => {
  const theme = useTheme();
  const { spacing } = useSpacing();

  const isHorizontal = orientation === 'horizontal';

  return (
    <ScrollView
      horizontal={isHorizontal}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={[
        {
          marginTop: position === 'bottom' ? spacing[3] : 0,
          marginBottom: position === 'top' ? spacing[3] : 0,
          marginLeft: position === 'right' ? spacing[3] : 0,
          marginRight: position === 'left' ? spacing[3] : 0,
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: isHorizontal ? 'row' : 'column',
          flexWrap: isHorizontal ? 'wrap' : 'nowrap',
          gap: spacing[3],
        }}
      >
        {items.map((item, index) => (
          <View
            key={`${item.name}-${index}`}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                marginRight: isHorizontal ? spacing[4] : 0,
                marginBottom: !isHorizontal ? spacing[2] : 0,
              },
              itemStyle,
            ]}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor: item.color,
                marginRight: spacing[2],
              }}
            />
            <Text
              style={[
                {
                  fontSize: 12,
                  color: theme.mutedForeground,
                },
                labelStyle,
              ]}
            >
              {item.name}
            </Text>
            {item.value !== undefined && (
              <Text
                style={[
                  {
                    fontSize: 12,
                    fontWeight: '600',
                    color: theme.foreground,
                    marginLeft: spacing[2],
                  },
                  valueStyle,
                ]}
              >
                {item.value}
              </Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// Chart Tooltip Component
export interface ChartTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  title?: string;
  items: Array<{
    label: string;
    value: string | number;
    color?: string;
  }>;
  style?: ViewStyle;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  visible,
  x,
  y,
  title,
  items,
  style,
}) => {
  const theme = useTheme();
  const { spacing } = useSpacing();

  if (!visible) return null;

  return (
    <View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          backgroundColor: theme.popover,
          borderRadius: 6,
          padding: spacing[2],
          borderWidth: 1,
          borderColor: theme.border,
          minWidth: 120,
          ...Platform.select({
            ios: {
              shadowColor: theme.foreground,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            android: {
              elevation: 4,
            },
            default: {
              boxShadow: `0 2px 8px ${theme.foreground}20`,
            },
          }),
        },
        style,
      ]}
    >
      {title && (
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: theme.foreground,
            marginBottom: spacing[1],
          }}
        >
          {title}
        </Text>
      )}
      {items.map((item, index) => (
        <View
          key={`${item.label}-${index}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: index > 0 ? spacing[1] : 0,
          }}
        >
          {item.color && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: item.color,
                marginRight: spacing[1.5],
              }}
            />
          )}
          <Text
            style={{
              fontSize: 11,
              color: theme.mutedForeground,
              flex: 1,
            }}
          >
            {item.label}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: theme.foreground,
              marginLeft: spacing[2],
            }}
          >
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
};

// Chart Config Type
export interface ChartConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    [key: string]: string;
  };
  styles: {
    axis: {
      stroke: string;
      strokeWidth: number;
    };
    grid: {
      stroke: string;
      strokeWidth: number;
      strokeDasharray?: string;
    };
    text: {
      fill: string;
      fontSize: number;
      fontFamily?: string;
    };
  };
}

// Hook to get chart config from theme
export const useChartConfig = (): ChartConfig => {
  const theme = useTheme();

  return {
    colors: {
      primary: theme.primary,
      secondary: theme.secondary,
      accent: theme.accent,
      success: theme.success || '#10b981',
      warning: '#f59e0b', // Orange for warnings
      danger: theme.destructive,
      // Chart-specific colors
      chart1: theme.primary,
      chart2: theme.secondary,
      chart3: theme.accent,
      chart4: theme.success || '#10b981',
      chart5: '#f59e0b', // Orange
    },
    styles: {
      axis: {
        stroke: theme.border,
        strokeWidth: 1,
      },
      grid: {
        stroke: theme.border,
        strokeWidth: 0.5,
        strokeDasharray: '3 3',
      },
      text: {
        fill: theme.mutedForeground,
        fontSize: 11,
      },
    },
  };
};