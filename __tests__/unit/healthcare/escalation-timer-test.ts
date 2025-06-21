import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

describe('Escalation Timer Logic', () => {
  jest.useFakeTimers();

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Escalation Rules', () => {
    interface EscalationRule {
      urgencyLevel: number;
      timeoutMinutes: number;
      escalateTo: string;
    }

    const escalationRules: EscalationRule[] = [
      { urgencyLevel: 5, timeoutMinutes: 3, escalateTo: 'head_doctor' },
      { urgencyLevel: 4, timeoutMinutes: 5, escalateTo: 'doctor' },
      { urgencyLevel: 3, timeoutMinutes: 10, escalateTo: 'doctor' },
      { urgencyLevel: 2, timeoutMinutes: 15, escalateTo: 'nurse_supervisor' },
      { urgencyLevel: 1, timeoutMinutes: 30, escalateTo: 'nurse_supervisor' },
    ];

    const getEscalationRule = (urgencyLevel: number) => {
      return escalationRules.find(rule => rule.urgencyLevel === urgencyLevel);
    };

    it('should return correct escalation rule for each urgency level', () => {
      const rule5 = getEscalationRule(5);
      expect(rule5?.timeoutMinutes).toBe(3);
      expect(rule5?.escalateTo).toBe('head_doctor');

      const rule1 = getEscalationRule(1);
      expect(rule1?.timeoutMinutes).toBe(30);
      expect(rule1?.escalateTo).toBe('nurse_supervisor');
    });

    it('should have shorter timeouts for higher urgency', () => {
      const rules = escalationRules.sort((a, b) => b.urgencyLevel - a.urgencyLevel);
      for (let i = 1; i < rules.length; i++) {
        expect(rules[i].timeoutMinutes).toBeGreaterThanOrEqual(rules[i - 1].timeoutMinutes);
      }
    });
  });

  describe('Timer Management', () => {
    class EscalationTimer {
      private timers: Map<string, NodeJS.Timeout> = new Map();
      private callbacks: Map<string, () => void> = new Map();

      start(alertId: string, timeoutMs: number, callback: () => void): void {
        this.stop(alertId); // Clear existing timer if any
        
        const timer = setTimeout(() => {
          callback();
          this.timers.delete(alertId);
          this.callbacks.delete(alertId);
        }, timeoutMs);

        this.timers.set(alertId, timer);
        this.callbacks.set(alertId, callback);
      }

      stop(alertId: string): void {
        const timer = this.timers.get(alertId);
        if (timer) {
          clearTimeout(timer);
          this.timers.delete(alertId);
          this.callbacks.delete(alertId);
        }
      }

      pause(alertId: string): number | null {
        const timer = this.timers.get(alertId);
        if (!timer) return null;

        // In real implementation, we'd track remaining time
        this.stop(alertId);
        return 0; // Placeholder
      }

      resume(alertId: string, remainingMs: number): void {
        const callback = this.callbacks.get(alertId);
        if (callback) {
          this.start(alertId, remainingMs, callback);
        }
      }

      hasTimer(alertId: string): boolean {
        return this.timers.has(alertId);
      }

      clear(): void {
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();
        this.callbacks.clear();
      }
    }

    let timer: EscalationTimer;

    beforeEach(() => {
      timer = new EscalationTimer();
    });

    afterEach(() => {
      timer.clear();
    });

    it('should start a timer for an alert', () => {
      const callback = jest.fn<any>();
      timer.start('alert-1', 5000, callback);
      
      expect(timer.hasTimer('alert-1')).toBe(true);
      expect(callback).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(5000);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(timer.hasTimer('alert-1')).toBe(false);
    });

    it('should stop a timer before it expires', () => {
      const callback = jest.fn<any>();
      timer.start('alert-1', 5000, callback);
      
      jest.advanceTimersByTime(3000);
      timer.stop('alert-1');
      
      jest.advanceTimersByTime(3000);
      expect(callback).not.toHaveBeenCalled();
      expect(timer.hasTimer('alert-1')).toBe(false);
    });

    it('should replace existing timer when starting new one', () => {
      const callback1 = jest.fn<any>();
      const callback2 = jest.fn<any>();
      
      timer.start('alert-1', 5000, callback1);
      timer.start('alert-1', 3000, callback2);
      
      jest.advanceTimersByTime(3000);
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple timers independently', () => {
      const callback1 = jest.fn<any>();
      const callback2 = jest.fn<any>();
      
      timer.start('alert-1', 3000, callback1);
      timer.start('alert-2', 5000, callback2);
      
      jest.advanceTimersByTime(3000);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(2000);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should clear all timers', () => {
      const callback1 = jest.fn<any>();
      const callback2 = jest.fn<any>();
      
      timer.start('alert-1', 3000, callback1);
      timer.start('alert-2', 5000, callback2);
      
      timer.clear();
      
      jest.advanceTimersByTime(10000);
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('Escalation Chain', () => {
    interface EscalationLevel {
      level: number;
      role: string;
      timeoutMinutes: number;
    }

    const escalationChain: EscalationLevel[] = [
      { level: 1, role: 'nurse', timeoutMinutes: 5 },
      { level: 2, role: 'doctor', timeoutMinutes: 5 },
      { level: 3, role: 'head_doctor', timeoutMinutes: 5 },
      { level: 4, role: 'administrator', timeoutMinutes: 0 }, // Final level
    ];

    const getNextEscalation = (currentLevel: number): EscalationLevel | null => {
      const nextLevel = escalationChain.find(e => e.level === currentLevel + 1);
      return nextLevel || null;
    };

    const canEscalate = (currentLevel: number): boolean => {
      const current = escalationChain.find(e => e.level === currentLevel);
      return current ? current.timeoutMinutes > 0 : false;
    };

    it('should get next escalation level', () => {
      const next = getNextEscalation(1);
      expect(next?.level).toBe(2);
      expect(next?.role).toBe('doctor');
    });

    it('should return null at final level', () => {
      const next = getNextEscalation(4);
      expect(next).toBeNull();
    });

    it('should determine if can escalate', () => {
      expect(canEscalate(1)).toBe(true);
      expect(canEscalate(2)).toBe(true);
      expect(canEscalate(3)).toBe(true);
      expect(canEscalate(4)).toBe(false); // Final level
    });

    it('should have proper escalation chain', () => {
      let currentLevel = 1;
      const escalations = [];
      
      while (canEscalate(currentLevel)) {
        const next = getNextEscalation(currentLevel);
        if (next) {
          escalations.push(next.role);
          currentLevel = next.level;
        } else {
          break;
        }
      }
      
      expect(escalations).toEqual(['doctor', 'head_doctor', 'administrator']);
    });
  });
});