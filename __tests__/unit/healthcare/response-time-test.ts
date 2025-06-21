import { describe, it, expect } from '@jest/globals';
import { differenceInMinutes, differenceInSeconds, subMinutes } from 'date-fns';

describe('Response Time Calculations', () => {
  describe('Response Time Metrics', () => {
    const calculateResponseTime = (createdAt: Date, acknowledgedAt: Date) => {
      return {
        seconds: differenceInSeconds(acknowledgedAt, createdAt),
        minutes: differenceInMinutes(acknowledgedAt, createdAt),
        formatted: formatResponseTime(differenceInSeconds(acknowledgedAt, createdAt)),
      };
    };

    const formatResponseTime = (seconds: number): string => {
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      if (remainingSeconds === 0) return `${minutes}m`;
      return `${minutes}m ${remainingSeconds}s`;
    };

    it('should calculate response time in seconds', () => {
      const createdAt = new Date('2025-06-17T10:00:00Z');
      const acknowledgedAt = new Date('2025-06-17T10:00:45Z');
      
      const result = calculateResponseTime(createdAt, acknowledgedAt);
      expect(result.seconds).toBe(45);
      expect(result.formatted).toBe('45s');
    });

    it('should calculate response time in minutes', () => {
      const createdAt = new Date('2025-06-17T10:00:00Z');
      const acknowledgedAt = new Date('2025-06-17T10:05:30Z');
      
      const result = calculateResponseTime(createdAt, acknowledgedAt);
      expect(result.minutes).toBe(5);
      expect(result.seconds).toBe(330);
      expect(result.formatted).toBe('5m 30s');
    });

    it('should format exact minutes correctly', () => {
      const createdAt = new Date('2025-06-17T10:00:00Z');
      const acknowledgedAt = new Date('2025-06-17T10:03:00Z');
      
      const result = calculateResponseTime(createdAt, acknowledgedAt);
      expect(result.formatted).toBe('3m');
    });
  });

  describe('Response Time Targets', () => {
    interface ResponseTarget {
      urgencyLevel: number;
      targetMinutes: number;
      criticalMinutes: number;
    }

    const responseTargets: ResponseTarget[] = [
      { urgencyLevel: 5, targetMinutes: 3, criticalMinutes: 5 },
      { urgencyLevel: 4, targetMinutes: 5, criticalMinutes: 10 },
      { urgencyLevel: 3, targetMinutes: 10, criticalMinutes: 20 },
      { urgencyLevel: 2, targetMinutes: 15, criticalMinutes: 30 },
      { urgencyLevel: 1, targetMinutes: 30, criticalMinutes: 60 },
    ];

    const evaluateResponseTime = (urgencyLevel: number, responseMinutes: number) => {
      const target = responseTargets.find(t => t.urgencyLevel === urgencyLevel);
      if (!target) throw new Error('Invalid urgency level');

      return {
        status: responseMinutes <= target.targetMinutes ? 'excellent' :
                responseMinutes <= target.criticalMinutes ? 'acceptable' : 'delayed',
        isWithinTarget: responseMinutes <= target.targetMinutes,
        isWithinCritical: responseMinutes <= target.criticalMinutes,
        targetMinutes: target.targetMinutes,
        criticalMinutes: target.criticalMinutes,
      };
    };

    it('should mark response as excellent when within target', () => {
      const result = evaluateResponseTime(5, 2);
      expect(result.status).toBe('excellent');
      expect(result.isWithinTarget).toBe(true);
    });

    it('should mark response as acceptable when within critical time', () => {
      const result = evaluateResponseTime(5, 4);
      expect(result.status).toBe('acceptable');
      expect(result.isWithinTarget).toBe(false);
      expect(result.isWithinCritical).toBe(true);
    });

    it('should mark response as delayed when beyond critical time', () => {
      const result = evaluateResponseTime(5, 6);
      expect(result.status).toBe('delayed');
      expect(result.isWithinCritical).toBe(false);
    });

    it('should have longer targets for lower urgency levels', () => {
      const high = evaluateResponseTime(5, 3);
      const low = evaluateResponseTime(2, 15);
      
      expect(high.targetMinutes).toBeLessThan(low.targetMinutes);
      expect(high.status).toBe('excellent');
      expect(low.status).toBe('excellent');
    });
  });

  describe('Average Response Time Calculations', () => {
    interface AlertResponse {
      createdAt: Date;
      acknowledgedAt: Date | null;
      urgencyLevel: number;
    }

    const calculateAverageResponseTime = (alerts: AlertResponse[]) => {
      const acknowledgedAlerts = alerts.filter(a => a.acknowledgedAt);
      if (acknowledgedAlerts.length === 0) return null;

      const totalSeconds = acknowledgedAlerts.reduce((sum, alert) => {
        return sum + differenceInSeconds(alert.acknowledgedAt!, alert.createdAt);
      }, 0);

      const avgSeconds = totalSeconds / acknowledgedAlerts.length;
      
      return {
        averageSeconds: Math.round(avgSeconds),
        averageMinutes: Math.round(avgSeconds / 60 * 10) / 10, // 1 decimal place
        acknowledgedCount: acknowledgedAlerts.length,
        totalCount: alerts.length,
        acknowledgmentRate: (acknowledgedAlerts.length / alerts.length) * 100,
      };
    };

    it('should calculate average response time for multiple alerts', () => {
      const now = new Date();
      const alerts: AlertResponse[] = [
        { createdAt: subMinutes(now, 10), acknowledgedAt: subMinutes(now, 8), urgencyLevel: 5 },
        { createdAt: subMinutes(now, 15), acknowledgedAt: subMinutes(now, 12), urgencyLevel: 4 },
        { createdAt: subMinutes(now, 20), acknowledgedAt: subMinutes(now, 15), urgencyLevel: 3 },
      ];

      const result = calculateAverageResponseTime(alerts);
      expect(result).not.toBeNull();
      expect(result!.averageMinutes).toBeCloseTo(3.3, 1);
      expect(result!.acknowledgedCount).toBe(3);
      expect(result!.acknowledgmentRate).toBe(100);
    });

    it('should handle unacknowledged alerts', () => {
      const now = new Date();
      const alerts: AlertResponse[] = [
        { createdAt: subMinutes(now, 10), acknowledgedAt: subMinutes(now, 8), urgencyLevel: 5 },
        { createdAt: subMinutes(now, 15), acknowledgedAt: null, urgencyLevel: 4 },
        { createdAt: subMinutes(now, 20), acknowledgedAt: subMinutes(now, 16), urgencyLevel: 3 },
      ];

      const result = calculateAverageResponseTime(alerts);
      expect(result!.acknowledgedCount).toBe(2);
      expect(result!.totalCount).toBe(3);
      expect(result!.acknowledgmentRate).toBeCloseTo(66.67, 1);
    });

    it('should return null for no acknowledged alerts', () => {
      const now = new Date();
      const alerts: AlertResponse[] = [
        { createdAt: subMinutes(now, 10), acknowledgedAt: null, urgencyLevel: 5 },
        { createdAt: subMinutes(now, 15), acknowledgedAt: null, urgencyLevel: 4 },
      ];

      const result = calculateAverageResponseTime(alerts);
      expect(result).toBeNull();
    });
  });
});