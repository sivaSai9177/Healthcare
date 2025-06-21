import React from 'react';
import {
  View,
  ViewStyle,
  TextStyle,
  ScrollView,
  Platform,
} from 'react-native';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Card } from '@/components/universal/display/Card';
import { SpacingScale } from '@/lib/design';
import { Text as UniversalText } from '@/components/universal/typography/Text';
import { cn } from '@/lib/core/utils';

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
    const { spacing } = useSpacing();

    const containerHeight = aspectRatio ? undefined : height;

    return (
      <Card ref={ref} className="p-4" style={style} testID={testID}>
        {(title || description) && (
          <View style={{ marginBottom: spacing[4] }}>
            {title && (
              <UniversalText
                size="lg"
                weight="semibold"
                className="text-foreground"
                style={[
                  {
                    marginBottom: spacing[1],
                  },
                  titleStyle,
                ]}
              >
                {title}
              </UniversalText>
            )}
            {description && (
              <UniversalText
                size="sm"
                className="text-muted-foreground"
                style={descriptionStyle}
              >
                {description}
              </UniversalText>
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
          gap: spacing[3] as any,
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
                borderRadius: 2 as any,
                backgroundColor: item.color,
                marginRight: spacing[2],
              }}
            />
            <UniversalText
              size="xs"
              className="text-muted-foreground"
              style={labelStyle}
            >
              {item.name}
            </UniversalText>
            {item.value !== undefined && (
              <UniversalText
                size="xs"
                weight="semibold"
                className="text-foreground"
                style={[
                  {
                    marginLeft: spacing[2],
                  },
                  valueStyle,
                ]}
              >
                {item.value}
              </UniversalText>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// Chart Tooltip Component
// Removed old ChartTooltipProps interface

// Old ChartTooltip implementation removed - no longer needed

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

// Hook to get chart config with hardcoded color values
export const useChartConfig = (): ChartConfig => {
  return {
    colors: {
      primary: '#0F172A', // slate-900
      secondary: '#64748B', // slate-500
      accent: '#3B82F6', // blue-500
      success: '#10B981', // emerald-500
      warning: '#F59E0B', // amber-500
      danger: '#EF4444', // red-500
      // Chart-specific colors
      chart1: '#0F172A', // slate-900
      chart2: '#64748B', // slate-500
      chart3: '#3B82F6', // blue-500
      chart4: '#10B981', // emerald-500
      chart5: '#F59E0B', // amber-500
    },
    styles: {
      axis: {
        stroke: '#E2E8F0', // slate-200
        strokeWidth: 1,
      },
      grid: {
        stroke: '#E2E8F0', // slate-200
        strokeWidth: 0.5,
        strokeDasharray: '3 3',
      },
      text: {
        fill: '#64748B', // slate-500
        fontSize: 11,
      },
    },
  };
};

// Chart Tooltip Component
export const ChartTooltip = ({ active, payload, label, content: Content, ...props }: any) => {
  if (!Content) return null;
  return <Content active={active} payload={payload} label={label} {...props} />;
};

// Chart Tooltip Content Component
export const ChartTooltipContent: React.FC<{
  active?: boolean;
  payload?: any[];
  label?: string;
  labelFormatter?: (value: any) => string;
  indicator?: 'line' | 'dot' | 'dashed';
}> = ({ active, payload, label, labelFormatter, indicator = 'dot' }) => {
  const { spacing } = useSpacing();
  
  if (!active || !payload) return null;

  return (
    <View
      className={cn(
        "bg-popover border border-border rounded-md",
        Platform.OS === 'ios' && "shadow-sm",
        Platform.OS === 'android' && "elevation-1"
      )}
      style={{
        padding: spacing[2] as any,
        ...(Platform.OS === 'web' && {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }),
      }}
    >
      {label && (
        <UniversalText
          size="xs"
          className="text-muted-foreground"
          style={{
            marginBottom: spacing[1],
          }}
        >
          {labelFormatter ? labelFormatter(label) : label}
        </UniversalText>
      )}
      {payload.map((entry: any, index: number) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 2,
          }}
        >
          <View
            style={{
              width: indicator === 'dot' ? 8 : 12,
              height: indicator === 'dot' ? 8 : 2,
              borderRadius: indicator === 'dot' ? 4 : 0,
              backgroundColor: entry.color || entry.fill,
              marginRight: 6,
              borderStyle: indicator === 'dashed' ? 'dashed' : 'solid',
              borderWidth: indicator === 'dashed' ? 1 : 0,
              borderColor: entry.color || entry.fill,
            }}
          />
          <UniversalText
            size="xs"
            className="text-muted-foreground"
            style={{
              marginRight: spacing[1],
            }}
          >
            {entry.name || entry.dataKey}:
          </UniversalText>
          <UniversalText
            size="xs"
            weight="semibold"
            className="text-foreground"
          >
            {entry.value.toLocaleString()}
          </UniversalText>
        </View>
      ))}
    </View>
  );
};