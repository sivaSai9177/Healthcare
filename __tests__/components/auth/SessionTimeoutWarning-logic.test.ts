import { describe, it, expect } from '@jest/globals';

describe('SessionTimeoutWarning Component Logic', () => {
  describe('Timeout Calculation', () => {
    interface SessionConfig {
      lastActivity: Date;
      sessionDuration: number; // minutes
      warningThreshold: number; // minutes before expiry
      inactivityTimeout: number; // minutes
    }

    const calculateTimeoutState = (config: SessionConfig, currentTime: Date = new Date()) => {
      const timeSinceActivity = (currentTime.getTime() - config.lastActivity.getTime()) / (1000 * 60);
      const sessionAge = timeSinceActivity;
      const timeUntilExpiry = config.sessionDuration - sessionAge;
      const timeUntilInactivityTimeout = config.inactivityTimeout - timeSinceActivity;

      // Check if session has expired
      if (timeUntilExpiry <= 0 || timeUntilInactivityTimeout <= 0) {
        return {
          expired: true,
          showWarning: false,
          timeRemaining: 0,
          reason: timeUntilInactivityTimeout <= 0 ? 'inactivity' : 'session-limit',
        };
      }

      // Use the shorter timeout
      const effectiveTimeRemaining = Math.min(timeUntilExpiry, timeUntilInactivityTimeout);
      const showWarning = effectiveTimeRemaining <= config.warningThreshold;

      return {
        expired: false,
        showWarning,
        timeRemaining: Math.floor(effectiveTimeRemaining * 60), // seconds
        timeRemainingMinutes: Math.floor(effectiveTimeRemaining),
        timeRemainingDisplay: formatTimeRemaining(effectiveTimeRemaining * 60),
      };
    };

    const formatTimeRemaining = (seconds: number): string => {
      if (seconds <= 0) return 'Session expired';
      
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      
      if (minutes > 0) {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
      }
      return `${remainingSeconds} seconds`;
    };

    it('calculates time until session expiry', () => {
      const config: SessionConfig = {
        lastActivity: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
        sessionDuration: 30,
        warningThreshold: 5,
        inactivityTimeout: 15,
      };

      const state = calculateTimeoutState(config);
      expect(state.expired).toBe(true);
      expect(state.reason).toBe('inactivity');
    });

    it('shows warning when threshold reached', () => {
      const config: SessionConfig = {
        lastActivity: new Date(Date.now() - 26 * 60 * 1000), // 26 minutes ago
        sessionDuration: 30,
        warningThreshold: 5,
        inactivityTimeout: 60,
      };

      const state = calculateTimeoutState(config);
      expect(state.expired).toBe(false);
      expect(state.showWarning).toBe(true);
      expect(state.timeRemainingMinutes).toBe(4);
    });

    it('formats time display correctly', () => {
      expect(formatTimeRemaining(125)).toBe('2:05');
      expect(formatTimeRemaining(45)).toBe('45 seconds');
      expect(formatTimeRemaining(0)).toBe('Session expired');
    });

    it('uses shorter timeout between session and inactivity', () => {
      const config: SessionConfig = {
        lastActivity: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        sessionDuration: 30, // 20 minutes remaining
        warningThreshold: 5,
        inactivityTimeout: 15, // 5 minutes remaining
      };

      const state = calculateTimeoutState(config);
      expect(state.timeRemainingMinutes).toBe(5); // Uses inactivity timeout
    });
  });

  describe('Warning States', () => {
    type WarningLevel = 'none' | 'info' | 'warning' | 'critical' | 'expired';

    const getWarningLevel = (minutesRemaining: number): {
      level: WarningLevel;
      color: string;
      icon: string;
      animate: boolean;
    } => {
      if (minutesRemaining <= 0) {
        return {
          level: 'expired',
          color: 'text-red-600',
          icon: 'x-circle',
          animate: false,
        };
      } else if (minutesRemaining <= 1) {
        return {
          level: 'critical',
          color: 'text-red-600',
          icon: 'alert-octagon',
          animate: true,
        };
      } else if (minutesRemaining <= 5) {
        return {
          level: 'warning',
          color: 'text-orange-600',
          icon: 'alert-triangle',
          animate: true,
        };
      } else if (minutesRemaining <= 10) {
        return {
          level: 'info',
          color: 'text-yellow-600',
          icon: 'clock',
          animate: false,
        };
      } else {
        return {
          level: 'none',
          color: 'text-gray-600',
          icon: 'info',
          animate: false,
        };
      }
    };

    it('assigns correct warning levels', () => {
      expect(getWarningLevel(15).level).toBe('none');
      expect(getWarningLevel(8).level).toBe('info');
      expect(getWarningLevel(3).level).toBe('warning');
      expect(getWarningLevel(0.5).level).toBe('critical');
      expect(getWarningLevel(0).level).toBe('expired');
    });

    it('enables animation for urgent warnings', () => {
      expect(getWarningLevel(10).animate).toBe(false);
      expect(getWarningLevel(3).animate).toBe(true);
      expect(getWarningLevel(0.5).animate).toBe(true);
    });

    it('uses appropriate colors and icons', () => {
      const warning = getWarningLevel(3);
      expect(warning.color).toBe('text-orange-600');
      expect(warning.icon).toBe('alert-triangle');

      const critical = getWarningLevel(0.5);
      expect(critical.color).toBe('text-red-600');
      expect(critical.icon).toBe('alert-octagon');
    });
  });

  describe('User Actions', () => {
    interface ActionConfig {
      canExtend: boolean;
      canLogout: boolean;
      isExtending: boolean;
      extensionLimit: number;
      extensionsUsed: number;
    }

    const getAvailableActions = (config: ActionConfig, timeRemaining: number) => {
      const actions = [];

      if (config.canExtend && config.extensionsUsed < config.extensionLimit && timeRemaining > 0) {
        actions.push({
          id: 'extend',
          label: config.isExtending ? 'Extending...' : 'Extend Session',
          icon: config.isExtending ? 'loader' : 'refresh',
          variant: 'primary',
          disabled: config.isExtending,
          remainingExtensions: config.extensionLimit - config.extensionsUsed,
        });
      }

      if (config.canLogout) {
        actions.push({
          id: 'logout',
          label: 'Log Out Now',
          icon: 'log-out',
          variant: 'secondary',
          disabled: config.isExtending,
        });
      }

      if (timeRemaining <= 0) {
        actions.push({
          id: 'login',
          label: 'Log In Again',
          icon: 'log-in',
          variant: 'primary',
          disabled: false,
        });
      }

      return actions;
    };

    it('shows extend action when available', () => {
      const config: ActionConfig = {
        canExtend: true,
        canLogout: true,
        isExtending: false,
        extensionLimit: 3,
        extensionsUsed: 1,
      };

      const actions = getAvailableActions(config, 300);
      const extendAction = actions.find(a => a.id === 'extend');
      expect(extendAction).toBeDefined();
      expect(extendAction?.remainingExtensions).toBe(2);
    });

    it('hides extend when limit reached', () => {
      const config: ActionConfig = {
        canExtend: true,
        canLogout: true,
        isExtending: false,
        extensionLimit: 3,
        extensionsUsed: 3,
      };

      const actions = getAvailableActions(config, 300);
      expect(actions.find(a => a.id === 'extend')).toBeUndefined();
    });

    it('shows login action when expired', () => {
      const config: ActionConfig = {
        canExtend: false,
        canLogout: false,
        isExtending: false,
        extensionLimit: 0,
        extensionsUsed: 0,
      };

      const actions = getAvailableActions(config, 0);
      const loginAction = actions.find(a => a.id === 'login');
      expect(loginAction).toBeDefined();
      expect(loginAction?.variant).toBe('primary');
    });

    it('disables actions while extending', () => {
      const config: ActionConfig = {
        canExtend: true,
        canLogout: true,
        isExtending: true,
        extensionLimit: 3,
        extensionsUsed: 1,
      };

      const actions = getAvailableActions(config, 300);
      expect(actions.every(a => a.disabled)).toBe(true);
      expect(actions.find(a => a.id === 'extend')?.label).toBe('Extending...');
    });
  });

  describe('Notification Management', () => {
    interface NotificationState {
      shown: Set<number>; // Minutes at which notifications were shown
      soundEnabled: boolean;
      desktopEnabled: boolean;
    }

    const shouldShowNotification = (
      minutesRemaining: number,
      notificationState: NotificationState,
      thresholds: number[] = [10, 5, 2, 1]
    ) => {
      // Find the lowest threshold that is greater than or equal to minutesRemaining
      // and hasn't been shown yet
      const applicableThresholds = thresholds
        .filter(t => minutesRemaining <= t && !notificationState.shown.has(t))
        .sort((a, b) => a - b);
      
      const threshold = applicableThresholds[0];

      if (!threshold) return null;

      return {
        show: true,
        threshold,
        type: threshold <= 2 ? 'urgent' : 'warning',
        title: threshold <= 2 
          ? 'Session Expiring Soon!' 
          : 'Session Timeout Warning',
        message: `Your session will expire in ${threshold} minute${threshold === 1 ? '' : 's'}`,
        playSound: notificationState.soundEnabled && threshold <= 5,
        showDesktop: notificationState.desktopEnabled,
      };
    };

    it('triggers notifications at thresholds', () => {
      const state: NotificationState = {
        shown: new Set(),
        soundEnabled: true,
        desktopEnabled: true,
      };

      const notification = shouldShowNotification(4.5, state);
      expect(notification?.show).toBe(true);
      expect(notification?.threshold).toBe(5);
      expect(notification?.type).toBe('warning');
    });

    it('plays sound for urgent notifications', () => {
      const state: NotificationState = {
        shown: new Set([10, 5]),
        soundEnabled: true,
        desktopEnabled: false,
      };

      const notification = shouldShowNotification(1.5, state);
      expect(notification?.playSound).toBe(true);
      expect(notification?.type).toBe('urgent');
    });

    it('prevents duplicate notifications', () => {
      const state: NotificationState = {
        shown: new Set([10, 5]),
        soundEnabled: true,
        desktopEnabled: true,
      };

      const notification5 = shouldShowNotification(4.5, state);
      expect(notification5).toBeNull();

      const notification2 = shouldShowNotification(1.5, state);
      expect(notification2?.threshold).toBe(2);
    });
  });

  describe('Display Formatting', () => {
    const getDisplayConfig = (secondsRemaining: number) => {
      const minutes = Math.floor(secondsRemaining / 60);
      const seconds = secondsRemaining % 60;

      if (secondsRemaining <= 0) {
        return {
          primary: 'Session Expired',
          secondary: 'Please log in again',
          countdown: null,
          showProgressBar: false,
          progressPercent: 0,
        };
      }

      let primary: string;
      let secondary: string;

      if (minutes >= 5) {
        primary = 'Session Active';
        secondary = `${minutes} minutes remaining`;
      } else if (minutes >= 1) {
        primary = 'Session Expiring Soon';
        secondary = `${minutes} minute${minutes === 1 ? '' : 's'} remaining`;
      } else {
        primary = 'Session About to Expire';
        secondary = `${seconds} seconds remaining`;
      }

      // Calculate progress (5 minutes = 100%, 0 = 0%)
      const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / 300) * 100));

      return {
        primary,
        secondary,
        countdown: `${minutes}:${seconds.toString().padStart(2, '0')}`,
        showProgressBar: secondsRemaining <= 300, // Show for last 5 minutes
        progressPercent,
      };
    };

    it('formats display for different time ranges', () => {
      const active = getDisplayConfig(600); // 10 minutes
      expect(active.primary).toBe('Session Active');
      expect(active.showProgressBar).toBe(false);

      const warning = getDisplayConfig(180); // 3 minutes
      expect(warning.primary).toBe('Session Expiring Soon');
      expect(warning.showProgressBar).toBe(true);

      const critical = getDisplayConfig(45); // 45 seconds
      expect(critical.primary).toBe('Session About to Expire');
      expect(critical.secondary).toBe('45 seconds remaining');
    });

    it('calculates progress percentage', () => {
      expect(getDisplayConfig(300).progressPercent).toBe(100);
      expect(getDisplayConfig(150).progressPercent).toBe(50);
      expect(getDisplayConfig(0).progressPercent).toBe(0);
    });
  });

  describe('Auto-Extend Logic', () => {
    interface AutoExtendConfig {
      enabled: boolean;
      idleThreshold: number; // minutes
      activityTypes: string[];
      blacklistedRoutes: string[];
    }

    const shouldAutoExtend = (
      config: AutoExtendConfig,
      lastActivity: Date,
      currentRoute: string,
      recentActivity: { type: string; timestamp: Date }[]
    ): boolean => {
      if (!config.enabled) return false;
      if (config.blacklistedRoutes.includes(currentRoute)) return false;

      const now = new Date();
      const timeSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60);
      
      if (timeSinceActivity > config.idleThreshold) return false;

      // Check for qualifying activity in the last minute
      const oneMinuteAgo = new Date(now.getTime() - 60000);
      const hasQualifyingActivity = recentActivity.some(
        activity => 
          activity.timestamp > oneMinuteAgo && 
          config.activityTypes.includes(activity.type)
      );

      return hasQualifyingActivity;
    };

    it('auto-extends when user is active', () => {
      const config: AutoExtendConfig = {
        enabled: true,
        idleThreshold: 5,
        activityTypes: ['click', 'keypress', 'scroll'],
        blacklistedRoutes: ['/logout', '/idle'],
      };

      const result = shouldAutoExtend(
        config,
        new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        '/dashboard',
        [{ type: 'click', timestamp: new Date(Date.now() - 30000) }]
      );

      expect(result).toBe(true);
    });

    it('does not extend when idle', () => {
      const config: AutoExtendConfig = {
        enabled: true,
        idleThreshold: 5,
        activityTypes: ['click', 'keypress'],
        blacklistedRoutes: [],
      };

      const result = shouldAutoExtend(
        config,
        new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        '/dashboard',
        []
      );

      expect(result).toBe(false);
    });

    it('respects blacklisted routes', () => {
      const config: AutoExtendConfig = {
        enabled: true,
        idleThreshold: 5,
        activityTypes: ['click'],
        blacklistedRoutes: ['/logout', '/idle'],
      };

      const result = shouldAutoExtend(
        config,
        new Date(),
        '/logout',
        [{ type: 'click', timestamp: new Date() }]
      );

      expect(result).toBe(false);
    });
  });
});