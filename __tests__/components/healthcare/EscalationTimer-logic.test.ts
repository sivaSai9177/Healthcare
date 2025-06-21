import { describe, it, expect, jest } from '@jest/globals';

describe('EscalationTimer Component Logic', () => {
  describe('Timer Calculation', () => {
    interface EscalationConfig {
      priority: 'low' | 'medium' | 'high' | 'critical';
      startTime: Date;
      thresholds: {
        low: number;      // minutes
        medium: number;
        high: number;
        critical: number;
      };
    }

    const calculateEscalationTime = (config: EscalationConfig) => {
      const threshold = config.thresholds[config.priority];
      const escalationTime = new Date(config.startTime.getTime() + threshold * 60 * 1000);
      
      return {
        escalationTime,
        thresholdMinutes: threshold,
      };
    };

    const getTimeRemaining = (escalationTime: Date, currentTime: Date = new Date()) => {
      const remaining = escalationTime.getTime() - currentTime.getTime();
      
      if (remaining <= 0) {
        return {
          expired: true,
          minutes: 0,
          seconds: 0,
          display: 'OVERDUE',
          percentage: 100,
        };
      }

      const totalMinutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      
      return {
        expired: false,
        minutes: totalMinutes,
        seconds,
        display: `${totalMinutes}:${seconds.toString().padStart(2, '0')}`,
        percentage: 0, // Calculate separately based on total time
      };
    };

    it('calculates escalation time based on priority', () => {
      const startTime = new Date('2024-01-01T10:00:00');
      const config: EscalationConfig = {
        priority: 'high',
        startTime,
        thresholds: {
          low: 120,
          medium: 60,
          high: 30,
          critical: 15,
        },
      };

      const result = calculateEscalationTime(config);
      expect(result.thresholdMinutes).toBe(30);
      expect(result.escalationTime).toEqual(new Date('2024-01-01T10:30:00'));
    });

    it('calculates time remaining correctly', () => {
      const currentTime = new Date('2024-01-01T10:00:00');
      const escalationTime = new Date('2024-01-01T10:05:00'); // 5 minutes later
      const remaining = getTimeRemaining(escalationTime, currentTime);

      expect(remaining.expired).toBe(false);
      expect(remaining.minutes).toBe(5);
      expect(remaining.display).toBe('5:00');
    });

    it('handles expired timers', () => {
      const escalationTime = new Date(Date.now() - 60000); // 1 minute ago
      const remaining = getTimeRemaining(escalationTime);

      expect(remaining.expired).toBe(true);
      expect(remaining.display).toBe('OVERDUE');
      expect(remaining.minutes).toBe(0);
      expect(remaining.seconds).toBe(0);
    });
  });

  describe('Timer Status', () => {
    const getTimerStatus = (remainingMinutes: number, thresholdMinutes: number) => {
      const percentageRemaining = (remainingMinutes / thresholdMinutes) * 100;

      if (percentageRemaining <= 0) {
        return {
          status: 'overdue',
          color: 'text-red-600',
          backgroundColor: 'bg-red-100',
          pulseAnimation: true,
          alertLevel: 'critical',
        };
      } else if (percentageRemaining <= 25) {
        return {
          status: 'critical',
          color: 'text-red-500',
          backgroundColor: 'bg-red-50',
          pulseAnimation: true,
          alertLevel: 'high',
        };
      } else if (percentageRemaining <= 50) {
        return {
          status: 'warning',
          color: 'text-orange-500',
          backgroundColor: 'bg-orange-50',
          pulseAnimation: false,
          alertLevel: 'medium',
        };
      } else {
        return {
          status: 'normal',
          color: 'text-green-600',
          backgroundColor: 'bg-green-50',
          pulseAnimation: false,
          alertLevel: 'low',
        };
      }
    };

    it('returns normal status for ample time', () => {
      const status = getTimerStatus(20, 30); // 66% remaining
      expect(status.status).toBe('normal');
      expect(status.color).toBe('text-green-600');
      expect(status.pulseAnimation).toBe(false);
    });

    it('returns warning status at 50% threshold', () => {
      const status = getTimerStatus(15, 30); // 50% remaining
      expect(status.status).toBe('warning');
      expect(status.color).toBe('text-orange-500');
    });

    it('returns critical status at 25% threshold', () => {
      const status = getTimerStatus(7, 30); // 23% remaining
      expect(status.status).toBe('critical');
      expect(status.pulseAnimation).toBe(true);
    });

    it('returns overdue status for expired timers', () => {
      const status = getTimerStatus(0, 30);
      expect(status.status).toBe('overdue');
      expect(status.alertLevel).toBe('critical');
      expect(status.pulseAnimation).toBe(true);
    });
  });

  describe('Progress Bar', () => {
    const calculateProgress = (
      startTime: Date,
      escalationTime: Date,
      currentTime: Date = new Date()
    ) => {
      const totalDuration = escalationTime.getTime() - startTime.getTime();
      const elapsed = currentTime.getTime() - startTime.getTime();
      const remaining = escalationTime.getTime() - currentTime.getTime();

      const progressPercentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
      const remainingPercentage = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));

      return {
        progressPercentage,
        remainingPercentage,
        isOverdue: remaining < 0,
      };
    };

    it('calculates progress percentage correctly', () => {
      const startTime = new Date('2024-01-01T10:00:00');
      const escalationTime = new Date('2024-01-01T10:30:00');
      const currentTime = new Date('2024-01-01T10:15:00'); // Halfway

      const progress = calculateProgress(startTime, escalationTime, currentTime);
      expect(progress.progressPercentage).toBe(50);
      expect(progress.remainingPercentage).toBe(50);
      expect(progress.isOverdue).toBe(false);
    });

    it('handles overdue timers', () => {
      const startTime = new Date('2024-01-01T10:00:00');
      const escalationTime = new Date('2024-01-01T10:30:00');
      const currentTime = new Date('2024-01-01T10:45:00'); // 15 minutes overdue

      const progress = calculateProgress(startTime, escalationTime, currentTime);
      expect(progress.progressPercentage).toBe(100);
      expect(progress.remainingPercentage).toBe(0);
      expect(progress.isOverdue).toBe(true);
    });
  });

  describe('Alert Notifications', () => {
    interface NotificationConfig {
      enabled: boolean;
      thresholds: number[]; // Percentages at which to notify
      sound: boolean;
      vibration: boolean;
      pushNotification: boolean;
    }

    const shouldNotify = (
      percentageRemaining: number,
      notifiedThresholds: Set<number>,
      config: NotificationConfig
    ) => {
      if (!config.enabled) return null;

      for (const threshold of config.thresholds) {
        if (percentageRemaining <= threshold && !notifiedThresholds.has(threshold)) {
          return {
            threshold,
            type: threshold <= 25 ? 'critical' : threshold <= 50 ? 'warning' : 'info',
            methods: {
              sound: config.sound,
              vibration: config.vibration,
              push: config.pushNotification,
            },
          };
        }
      }

      return null;
    };

    it('triggers notification at thresholds', () => {
      const config: NotificationConfig = {
        enabled: true,
        thresholds: [50, 25, 10],
        sound: true,
        vibration: true,
        pushNotification: false,
      };

      // At 45% remaining, should trigger 50% threshold
      const notification50 = shouldNotify(45, new Set(), config);
      expect(notification50).not.toBeNull();
      expect(notification50?.threshold).toBe(50);
      expect(notification50?.type).toBe('warning');

      // At 24% remaining, should trigger 25% threshold
      const notification25 = shouldNotify(24, new Set([50]), config);
      expect(notification25).not.toBeNull();
      expect(notification25?.threshold).toBe(25);
      expect(notification25?.type).toBe('critical');
    });

    it('does not repeat notifications', () => {
      const config: NotificationConfig = {
        enabled: true,
        thresholds: [50, 25, 10],
        sound: true,
        vibration: true,
        pushNotification: false,
      };

      const notifiedThresholds = new Set([50, 25, 10]);
      const notification = shouldNotify(5, notifiedThresholds, config);
      expect(notification).toBeNull();
    });

    it('respects enabled flag', () => {
      const config: NotificationConfig = {
        enabled: false,
        thresholds: [50, 25, 10],
        sound: true,
        vibration: true,
        pushNotification: false,
      };

      const notification = shouldNotify(10, new Set(), config);
      expect(notification).toBeNull();
    });
  });

  describe('Timer Display Formatting', () => {
    const formatTimerDisplay = (minutes: number, seconds: number, expired: boolean) => {
      if (expired) {
        return {
          primary: 'OVERDUE',
          secondary: 'Escalation required',
          className: 'text-red-600 font-bold animate-pulse',
        };
      }

      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return {
          primary: `${hours}h ${remainingMinutes}m`,
          secondary: 'Time remaining',
          className: 'text-gray-700',
        };
      }

      if (minutes === 0) {
        return {
          primary: `${seconds}s`,
          secondary: 'Escalating soon',
          className: 'text-red-500 font-semibold',
        };
      }

      return {
        primary: `${minutes}:${seconds.toString().padStart(2, '0')}`,
        secondary: 'Time remaining',
        className: minutes <= 5 ? 'text-orange-600 font-semibold' : 'text-gray-700',
      };
    };

    it('formats hours for long durations', () => {
      const display = formatTimerDisplay(125, 30, false);
      expect(display.primary).toBe('2h 5m');
    });

    it('formats minutes and seconds', () => {
      const display = formatTimerDisplay(5, 45, false);
      expect(display.primary).toBe('5:45');
    });

    it('shows seconds only when less than a minute', () => {
      const display = formatTimerDisplay(0, 30, false);
      expect(display.primary).toBe('30s');
      expect(display.secondary).toBe('Escalating soon');
    });

    it('shows overdue state', () => {
      const display = formatTimerDisplay(0, 0, true);
      expect(display.primary).toBe('OVERDUE');
      expect(display.className).toContain('animate-pulse');
    });

    it('applies urgency styling', () => {
      const urgent = formatTimerDisplay(3, 0, false);
      expect(urgent.className).toContain('text-orange-600');
      expect(urgent.className).toContain('font-semibold');
    });
  });

  describe('Timer Controls', () => {
    interface TimerAction {
      id: string;
      label: string;
      icon: string;
      enabled: boolean;
      confirmRequired?: boolean;
    }

    const getTimerActions = (state: {
      isRunning: boolean;
      isPaused: boolean;
      isOverdue: boolean;
      canEscalate: boolean;
      canDismiss: boolean;
    }): TimerAction[] => {
      const actions: TimerAction[] = [];

      if (state.isRunning && !state.isPaused) {
        actions.push({
          id: 'pause',
          label: 'Pause Timer',
          icon: 'pause',
          enabled: !state.isOverdue,
        });
      } else if (state.isPaused) {
        actions.push({
          id: 'resume',
          label: 'Resume Timer',
          icon: 'play',
          enabled: true,
        });
      }

      if (state.canEscalate) {
        actions.push({
          id: 'escalate',
          label: 'Escalate Now',
          icon: 'arrow-up',
          enabled: true,
          confirmRequired: true,
        });
      }

      if (state.canDismiss && !state.isOverdue) {
        actions.push({
          id: 'dismiss',
          label: 'Dismiss Timer',
          icon: 'x',
          enabled: true,
          confirmRequired: true,
        });
      }

      if (state.isOverdue) {
        actions.push({
          id: 'acknowledge',
          label: 'Acknowledge Overdue',
          icon: 'check',
          enabled: true,
        });
      }

      return actions;
    };

    it('shows pause action when running', () => {
      const actions = getTimerActions({
        isRunning: true,
        isPaused: false,
        isOverdue: false,
        canEscalate: true,
        canDismiss: true,
      });

      expect(actions.find(a => a.id === 'pause')).toBeDefined();
      expect(actions.find(a => a.id === 'resume')).toBeUndefined();
    });

    it('shows resume action when paused', () => {
      const actions = getTimerActions({
        isRunning: true,
        isPaused: true,
        isOverdue: false,
        canEscalate: true,
        canDismiss: true,
      });

      expect(actions.find(a => a.id === 'resume')).toBeDefined();
      expect(actions.find(a => a.id === 'pause')).toBeUndefined();
    });

    it('shows acknowledge action when overdue', () => {
      const actions = getTimerActions({
        isRunning: true,
        isPaused: false,
        isOverdue: true,
        canEscalate: false,
        canDismiss: false,
      });

      const acknowledge = actions.find(a => a.id === 'acknowledge');
      expect(acknowledge).toBeDefined();
    });

    it('requires confirmation for escalate and dismiss', () => {
      const actions = getTimerActions({
        isRunning: true,
        isPaused: false,
        isOverdue: false,
        canEscalate: true,
        canDismiss: true,
      });

      const escalate = actions.find(a => a.id === 'escalate');
      const dismiss = actions.find(a => a.id === 'dismiss');

      expect(escalate?.confirmRequired).toBe(true);
      expect(dismiss?.confirmRequired).toBe(true);
    });
  });
});