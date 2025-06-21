import { describe, it, expect } from '@jest/globals';

describe('MetricsOverview Component Logic', () => {
  describe('Metric Calculations', () => {
    interface AlertMetrics {
      total: number;
      pending: number;
      acknowledged: number;
      resolved: number;
      escalated: number;
      avgResponseTime: number; // minutes
      avgResolutionTime: number; // minutes
    }

    const calculateMetricPercentages = (metrics: AlertMetrics) => {
      const percentages = {
        pendingRate: (metrics.pending / metrics.total) * 100,
        acknowledgedRate: (metrics.acknowledged / metrics.total) * 100,
        resolvedRate: (metrics.resolved / metrics.total) * 100,
        escalatedRate: (metrics.escalated / metrics.total) * 100,
      };

      const performance = {
        responseScore: Math.max(0, 100 - (metrics.avgResponseTime * 2)), // Lose 2 points per minute
        resolutionScore: Math.max(0, 100 - (metrics.avgResolutionTime / 30)), // Lose 1 point per 30 minutes
        overallScore: 0,
      };

      performance.overallScore = (
        performance.responseScore * 0.6 + 
        performance.resolutionScore * 0.4
      );

      return {
        ...percentages,
        performance,
      };
    };

    it('calculates alert distribution percentages', () => {
      const metrics: AlertMetrics = {
        total: 100,
        pending: 20,
        acknowledged: 30,
        resolved: 45,
        escalated: 5,
        avgResponseTime: 10,
        avgResolutionTime: 120,
      };

      const result = calculateMetricPercentages(metrics);
      expect(result.pendingRate).toBe(20);
      expect(result.acknowledgedRate).toBe(30);
      expect(result.resolvedRate).toBe(45);
      expect(result.escalatedRate).toBe(5);
    });

    it('calculates performance scores', () => {
      const metrics: AlertMetrics = {
        total: 50,
        pending: 10,
        acknowledged: 20,
        resolved: 20,
        escalated: 0,
        avgResponseTime: 5, // 5 minutes
        avgResolutionTime: 60, // 60 minutes
      };

      const result = calculateMetricPercentages(metrics);
      expect(result.performance.responseScore).toBe(90); // 100 - (5 * 2)
      expect(result.performance.resolutionScore).toBe(98); // 100 - (60 / 30)
      expect(result.performance.overallScore).toBe(93.2); // (90 * 0.6) + (98 * 0.4)
    });

    it('handles poor performance metrics', () => {
      const metrics: AlertMetrics = {
        total: 50,
        pending: 40,
        acknowledged: 5,
        resolved: 5,
        escalated: 0,
        avgResponseTime: 60, // 1 hour
        avgResolutionTime: 3600, // 60 hours
      };

      const result = calculateMetricPercentages(metrics);
      expect(result.performance.responseScore).toBe(0); // Max(0, 100 - 120)
      expect(result.performance.resolutionScore).toBe(0); // Max(0, 100 - 120)
    });
  });

  describe('Time Range Calculations', () => {
    interface TimeRange {
      start: Date;
      end: Date;
      label: string;
    }

    const getTimeRanges = (baseDate: Date = new Date()): Record<string, TimeRange> => {
      const ranges: Record<string, TimeRange> = {};

      // Today
      const todayStart = new Date(baseDate);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(baseDate);
      todayEnd.setHours(23, 59, 59, 999);
      ranges.today = { start: todayStart, end: todayEnd, label: 'Today' };

      // This Week
      const weekStart = new Date(baseDate);
      weekStart.setDate(baseDate.getDate() - baseDate.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      ranges.week = { start: weekStart, end: weekEnd, label: 'This Week' };

      // This Month
      const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
      const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999);
      ranges.month = { start: monthStart, end: monthEnd, label: 'This Month' };

      // Last 30 Days
      const last30Start = new Date(baseDate);
      last30Start.setDate(baseDate.getDate() - 30);
      last30Start.setHours(0, 0, 0, 0);
      ranges.last30 = { start: last30Start, end: todayEnd, label: 'Last 30 Days' };

      return ranges;
    };

    it('calculates correct time ranges', () => {
      const testDate = new Date('2024-01-15T12:00:00'); // Monday
      const ranges = getTimeRanges(testDate);

      // Today
      expect(ranges.today.start).toEqual(new Date('2024-01-15T00:00:00.000'));
      expect(ranges.today.end).toEqual(new Date('2024-01-15T23:59:59.999'));

      // This Week (Sunday to Saturday)
      expect(ranges.week.start).toEqual(new Date('2024-01-14T00:00:00.000'));
      expect(ranges.week.end).toEqual(new Date('2024-01-20T23:59:59.999'));

      // This Month
      expect(ranges.month.start).toEqual(new Date('2024-01-01T00:00:00.000'));
      expect(ranges.month.end).toEqual(new Date('2024-01-31T23:59:59.999'));
    });
  });

  describe('Trend Analysis', () => {
    interface DataPoint {
      date: Date;
      value: number;
    }

    const analyzeTrend = (data: DataPoint[]) => {
      if (data.length < 2) {
        return { trend: 'neutral', changePercent: 0, direction: 'stable' };
      }

      const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
      const firstValue = sortedData[0].value;
      const lastValue = sortedData[sortedData.length - 1].value;
      
      const changePercent = ((lastValue - firstValue) / firstValue) * 100;
      
      let trend: 'improving' | 'declining' | 'neutral';
      let direction: 'up' | 'down' | 'stable';

      if (Math.abs(changePercent) < 5) {
        trend = 'neutral';
        direction = 'stable';
      } else if (changePercent > 0) {
        trend = 'declining'; // More alerts is bad
        direction = 'up';
      } else {
        trend = 'improving'; // Fewer alerts is good
        direction = 'down';
      }

      return { trend, changePercent, direction };
    };

    it('identifies improving trend', () => {
      const data: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 100 },
        { date: new Date('2024-01-02'), value: 90 },
        { date: new Date('2024-01-03'), value: 80 },
        { date: new Date('2024-01-04'), value: 70 },
      ];

      const trend = analyzeTrend(data);
      expect(trend.trend).toBe('improving');
      expect(trend.direction).toBe('down');
      expect(trend.changePercent).toBe(-30);
    });

    it('identifies declining trend', () => {
      const data: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 50 },
        { date: new Date('2024-01-02'), value: 60 },
        { date: new Date('2024-01-03'), value: 75 },
        { date: new Date('2024-01-04'), value: 100 },
      ];

      const trend = analyzeTrend(data);
      expect(trend.trend).toBe('declining');
      expect(trend.direction).toBe('up');
      expect(trend.changePercent).toBe(100);
    });

    it('identifies stable trend', () => {
      const data: DataPoint[] = [
        { date: new Date('2024-01-01'), value: 100 },
        { date: new Date('2024-01-02'), value: 98 },
        { date: new Date('2024-01-03'), value: 102 },
        { date: new Date('2024-01-04'), value: 101 },
      ];

      const trend = analyzeTrend(data);
      expect(trend.trend).toBe('neutral');
      expect(trend.direction).toBe('stable');
      expect(Math.abs(trend.changePercent)).toBeLessThan(5);
    });
  });

  describe('Chart Data Formatting', () => {
    const formatChartData = (
      data: { timestamp: Date; value: number; category: string }[],
      groupBy: 'hour' | 'day' | 'week'
    ) => {
      const grouped: Record<string, { value: number; count: number }> = {};

      data.forEach(point => {
        let key: string;
        const date = point.timestamp;

        switch (groupBy) {
          case 'hour':
            key = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
            break;
          case 'day':
            key = `${date.getMonth() + 1}/${date.getDate()}`;
            break;
          case 'week':
            const weekNumber = Math.ceil(date.getDate() / 7);
            key = `Week ${weekNumber}`;
            break;
        }

        if (!grouped[key]) {
          grouped[key] = { value: 0, count: 0 };
        }
        grouped[key].value += point.value;
        grouped[key].count += 1;
      });

      return Object.entries(grouped).map(([label, data]) => ({
        label,
        value: data.value / data.count, // Average
        total: data.value,
        count: data.count,
      }));
    };

    it('groups data by hour', () => {
      const data = [
        { timestamp: new Date('2024-01-01T10:15:00'), value: 5, category: 'alert' },
        { timestamp: new Date('2024-01-01T10:30:00'), value: 3, category: 'alert' },
        { timestamp: new Date('2024-01-01T11:00:00'), value: 7, category: 'alert' },
      ];

      const formatted = formatChartData(data, 'hour');
      expect(formatted).toHaveLength(2);
      expect(formatted[0]).toEqual({
        label: '1/1 10:00',
        value: 4, // Average of 5 and 3
        total: 8,
        count: 2,
      });
    });

    it('groups data by day', () => {
      const data = [
        { timestamp: new Date('2024-01-01T10:00:00'), value: 10, category: 'alert' },
        { timestamp: new Date('2024-01-01T14:00:00'), value: 20, category: 'alert' },
        { timestamp: new Date('2024-01-02T10:00:00'), value: 15, category: 'alert' },
      ];

      const formatted = formatChartData(data, 'day');
      expect(formatted).toHaveLength(2);
      expect(formatted[0].label).toBe('1/1');
      expect(formatted[0].value).toBe(15); // Average of 10 and 20
      expect(formatted[1].label).toBe('1/2');
      expect(formatted[1].value).toBe(15);
    });
  });

  describe('Performance Indicators', () => {
    interface PerformanceIndicator {
      name: string;
      value: number;
      target: number;
      unit: string;
    }

    const evaluatePerformance = (indicator: PerformanceIndicator) => {
      const percentOfTarget = (indicator.value / indicator.target) * 100;
      
      let status: 'excellent' | 'good' | 'warning' | 'critical';
      let color: string;
      let icon: string;

      // For time-based metrics, lower is better
      const isTimeBased = indicator.unit.includes('min') || indicator.unit.includes('hour');
      
      if (isTimeBased) {
        if (percentOfTarget <= 50) {
          status = 'excellent';
          color = 'text-green-600';
          icon = 'star';
        } else if (percentOfTarget <= 100) {
          status = 'good';
          color = 'text-blue-600';
          icon = 'check-circle';
        } else if (percentOfTarget <= 150) {
          status = 'warning';
          color = 'text-yellow-600';
          icon = 'alert-circle';
        } else {
          status = 'critical';
          color = 'text-red-600';
          icon = 'x-circle';
        }
      } else {
        // For percentage metrics, higher is better
        if (percentOfTarget >= 100) {
          status = 'excellent';
          color = 'text-green-600';
          icon = 'star';
        } else if (percentOfTarget >= 80) {
          status = 'good';
          color = 'text-blue-600';
          icon = 'check-circle';
        } else if (percentOfTarget >= 60) {
          status = 'warning';
          color = 'text-yellow-600';
          icon = 'alert-circle';
        } else {
          status = 'critical';
          color = 'text-red-600';
          icon = 'x-circle';
        }
      }

      return {
        ...indicator,
        percentOfTarget,
        status,
        color,
        icon,
        displayValue: `${indicator.value}${indicator.unit}`,
        displayTarget: `Target: ${indicator.target}${indicator.unit}`,
      };
    };

    it('evaluates time-based metrics correctly', () => {
      const responseTime: PerformanceIndicator = {
        name: 'Average Response Time',
        value: 3,
        target: 5,
        unit: ' min',
      };

      const result = evaluatePerformance(responseTime);
      expect(result.percentOfTarget).toBe(60);
      expect(result.status).toBe('good');
      expect(result.color).toBe('text-blue-600');
    });

    it('evaluates percentage metrics correctly', () => {
      const resolutionRate: PerformanceIndicator = {
        name: 'Resolution Rate',
        value: 85,
        target: 90,
        unit: '%',
      };

      const result = evaluatePerformance(resolutionRate);
      expect(result.percentOfTarget).toBeCloseTo(94.44, 1);
      expect(result.status).toBe('good');
    });

    it('identifies critical performance', () => {
      const slowResponse: PerformanceIndicator = {
        name: 'Average Response Time',
        value: 15,
        target: 5,
        unit: ' min',
      };

      const result = evaluatePerformance(slowResponse);
      expect(result.percentOfTarget).toBe(300);
      expect(result.status).toBe('critical');
      expect(result.color).toBe('text-red-600');
    });
  });

  describe('Department Comparisons', () => {
    interface DepartmentMetrics {
      department: string;
      totalAlerts: number;
      avgResponseTime: number;
      resolutionRate: number;
      staffCount: number;
    }

    const rankDepartments = (departments: DepartmentMetrics[]) => {
      // Calculate efficiency score for each department
      const scored = departments.map(dept => {
        const alertsPerStaff = dept.totalAlerts / dept.staffCount;
        const responseScore = Math.max(0, 100 - (dept.avgResponseTime * 5));
        const resolutionScore = dept.resolutionRate;
        
        const efficiencyScore = (
          responseScore * 0.4 +
          resolutionScore * 0.4 +
          (100 - Math.min(100, alertsPerStaff * 10)) * 0.2
        );

        return {
          ...dept,
          alertsPerStaff,
          efficiencyScore,
        };
      });

      // Sort by efficiency score
      return scored.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    };

    it('ranks departments by efficiency', () => {
      const departments: DepartmentMetrics[] = [
        {
          department: 'Emergency',
          totalAlerts: 100,
          avgResponseTime: 5,
          resolutionRate: 90,
          staffCount: 20,
        },
        {
          department: 'ICU',
          totalAlerts: 50,
          avgResponseTime: 3,
          resolutionRate: 95,
          staffCount: 15,
        },
        {
          department: 'General Ward',
          totalAlerts: 30,
          avgResponseTime: 8,
          resolutionRate: 85,
          staffCount: 10,
        },
      ];

      const ranked = rankDepartments(departments);
      expect(ranked[0].department).toBe('ICU'); // Best efficiency
      expect(ranked[0].efficiencyScore).toBeGreaterThan(ranked[1].efficiencyScore);
    });
  });
});