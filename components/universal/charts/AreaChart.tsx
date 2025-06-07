import React from 'react';
import { ViewStyle } from 'react-native';
import { LineChart, LineChartData, LineChartProps } from './LineChart';

export interface AreaChartData extends LineChartData {}

export interface AreaChartProps extends Omit<LineChartProps, 'data'> {
  data: AreaChartData;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  ...props
}) => {
  // Area chart is essentially a line chart with filled areas
  const areaData: LineChartData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      filled: true, // Always fill area charts
    })),
  };

  return <LineChart data={areaData} {...props} />;
};