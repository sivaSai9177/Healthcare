import { describe, it, expect } from '@jest/globals';

describe('ShiftStatus Component Logic', () => {
  describe('Shift Status Calculation', () => {
    interface Shift {
      id: string;
      staffId: string;
      startTime: Date;
      endTime: Date;
      department: string;
      role: string;
      breaksTaken?: number;
      breaksAllowed: number;
    }

    const getShiftStatus = (shift: Shift, currentTime: Date = new Date()) => {
      const shiftStart = shift.startTime.getTime();
      const shiftEnd = shift.endTime.getTime();
      const now = currentTime.getTime();

      if (now < shiftStart) {
        const minutesUntilStart = Math.floor((shiftStart - now) / 60000);
        return {
          status: 'upcoming',
          label: 'Upcoming',
          description: `Starts in ${minutesUntilStart} minutes`,
          color: 'text-gray-600',
          icon: 'clock',
        };
      }

      if (now >= shiftStart && now <= shiftEnd) {
        const progress = ((now - shiftStart) / (shiftEnd - shiftStart)) * 100;
        const hoursRemaining = Math.floor((shiftEnd - now) / 3600000);
        const minutesRemaining = Math.floor(((shiftEnd - now) % 3600000) / 60000);

        return {
          status: 'active',
          label: 'On Shift',
          description: `${hoursRemaining}h ${minutesRemaining}m remaining`,
          color: 'text-green-600',
          icon: 'user-check',
          progress,
        };
      }

      return {
        status: 'completed',
        label: 'Completed',
        description: 'Shift ended',
        color: 'text-gray-500',
        icon: 'check-circle',
      };
    };

    it('identifies upcoming shifts', () => {
      const shift: Shift = {
        id: '1',
        staffId: 'staff1',
        startTime: new Date(Date.now() + 30 * 60000), // 30 minutes from now
        endTime: new Date(Date.now() + 8.5 * 3600000), // 8.5 hours from now
        department: 'Emergency',
        role: 'Nurse',
        breaksAllowed: 2,
      };

      const status = getShiftStatus(shift);
      expect(status.status).toBe('upcoming');
      expect(status.description).toBe('Starts in 30 minutes');
    });

    it('identifies active shifts with progress', () => {
      const now = new Date('2024-01-01T12:00:00');
      const shift: Shift = {
        id: '1',
        staffId: 'staff1',
        startTime: new Date('2024-01-01T08:00:00'),
        endTime: new Date('2024-01-01T16:00:00'),
        department: 'ICU',
        role: 'Doctor',
        breaksAllowed: 2,
      };

      const status = getShiftStatus(shift, now);
      expect(status.status).toBe('active');
      expect(status.progress).toBe(50); // 4 hours into 8 hour shift
      expect(status.description).toBe('4h 0m remaining');
    });

    it('identifies completed shifts', () => {
      const shift: Shift = {
        id: '1',
        staffId: 'staff1',
        startTime: new Date(Date.now() - 9 * 3600000), // 9 hours ago
        endTime: new Date(Date.now() - 3600000), // 1 hour ago
        department: 'Emergency',
        role: 'Nurse',
        breaksAllowed: 2,
      };

      const status = getShiftStatus(shift);
      expect(status.status).toBe('completed');
      expect(status.label).toBe('Completed');
    });
  });

  describe('Break Management', () => {
    interface BreakInfo {
      taken: number;
      allowed: number;
      lastBreakTime?: Date;
      nextBreakDue?: Date;
    }

    const getBreakStatus = (breakInfo: BreakInfo, shiftProgress: number) => {
      const remaining = breakInfo.allowed - breakInfo.taken;
      const breakInterval = 100 / (breakInfo.allowed + 1); // Evenly distribute breaks
      const nextBreakProgress = Math.ceil(shiftProgress / breakInterval) * breakInterval;

      let status = 'normal';
      let message = `${remaining} breaks remaining`;

      if (remaining === 0) {
        status = 'complete';
        message = 'All breaks taken';
      } else if (shiftProgress >= nextBreakProgress - 5) {
        status = 'due';
        message = 'Break due soon';
      } else if (breakInfo.lastBreakTime) {
        const timeSinceLastBreak = Date.now() - breakInfo.lastBreakTime.getTime();
        const hoursSinceLastBreak = timeSinceLastBreak / 3600000;

        if (hoursSinceLastBreak > 4) {
          status = 'overdue';
          message = 'Break overdue';
        }
      }

      return {
        status,
        message,
        remaining,
        color: status === 'overdue' ? 'text-red-600' : 
               status === 'due' ? 'text-orange-600' : 
               status === 'complete' ? 'text-green-600' : 
               'text-gray-600',
      };
    };

    it('tracks remaining breaks', () => {
      const breakStatus = getBreakStatus({
        taken: 1,
        allowed: 3,
      }, 30);

      expect(breakStatus.remaining).toBe(2);
      expect(breakStatus.message).toBe('2 breaks remaining');
      expect(breakStatus.status).toBe('normal');
    });

    it('identifies when breaks are due', () => {
      const breakStatus = getBreakStatus({
        taken: 1,
        allowed: 3,
      }, 48); // Near 50% mark

      expect(breakStatus.status).toBe('due');
      expect(breakStatus.message).toBe('Break due soon');
      expect(breakStatus.color).toBe('text-orange-600');
    });

    it('identifies overdue breaks', () => {
      const breakStatus = getBreakStatus({
        taken: 0,
        allowed: 2,
        lastBreakTime: new Date(Date.now() - 5 * 3600000), // 5 hours ago
      }, 60);

      expect(breakStatus.status).toBe('overdue');
      expect(breakStatus.message).toBe('Break overdue');
      expect(breakStatus.color).toBe('text-red-600');
    });

    it('shows completion when all breaks taken', () => {
      const breakStatus = getBreakStatus({
        taken: 3,
        allowed: 3,
      }, 80);

      expect(breakStatus.status).toBe('complete');
      expect(breakStatus.message).toBe('All breaks taken');
      expect(breakStatus.remaining).toBe(0);
    });
  });

  describe('Staff Coverage', () => {
    interface StaffMember {
      id: string;
      name: string;
      role: string;
      status: 'active' | 'break' | 'lunch' | 'unavailable';
      currentLocation?: string;
    }

    const calculateCoverage = (
      department: string,
      staffMembers: StaffMember[],
      minimumRequired: Record<string, number>
    ) => {
      const activeByRole: Record<string, number> = {};
      const totalByRole: Record<string, number> = {};

      staffMembers.forEach(member => {
        if (!totalByRole[member.role]) {
          totalByRole[member.role] = 0;
          activeByRole[member.role] = 0;
        }

        totalByRole[member.role]++;
        if (member.status === 'active') {
          activeByRole[member.role]++;
        }
      });

      const coverage = Object.entries(minimumRequired).map(([role, required]) => {
        const active = activeByRole[role] || 0;
        const total = totalByRole[role] || 0;
        const percentage = total > 0 ? (active / required) * 100 : 0;

        return {
          role,
          active,
          total,
          required,
          percentage,
          status: active >= required ? 'adequate' : 
                  active >= required * 0.75 ? 'warning' : 
                  'critical',
        };
      });

      const overallPercentage = coverage.reduce((sum, c) => sum + c.percentage, 0) / coverage.length;

      return {
        coverage,
        overallPercentage,
        status: overallPercentage >= 100 ? 'full' :
                overallPercentage >= 75 ? 'adequate' :
                'critical',
      };
    };

    it('calculates coverage by role', () => {
      const staff: StaffMember[] = [
        { id: '1', name: 'Dr. Smith', role: 'Doctor', status: 'active' },
        { id: '2', name: 'Dr. Jones', role: 'Doctor', status: 'break' },
        { id: '3', name: 'Nurse A', role: 'Nurse', status: 'active' },
        { id: '4', name: 'Nurse B', role: 'Nurse', status: 'active' },
        { id: '5', name: 'Nurse C', role: 'Nurse', status: 'lunch' },
      ];

      const result = calculateCoverage('Emergency', staff, {
        Doctor: 2,
        Nurse: 3,
      });

      const doctorCoverage = result.coverage.find(c => c.role === 'Doctor');
      expect(doctorCoverage?.active).toBe(1);
      expect(doctorCoverage?.percentage).toBe(50);
      expect(doctorCoverage?.status).toBe('critical');

      const nurseCoverage = result.coverage.find(c => c.role === 'Nurse');
      expect(nurseCoverage?.active).toBe(2);
      expect(nurseCoverage?.percentage).toBeCloseTo(66.67, 1);
      expect(nurseCoverage?.status).toBe('critical');
    });

    it('determines overall coverage status', () => {
      const staff: StaffMember[] = [
        { id: '1', name: 'Dr. Smith', role: 'Doctor', status: 'active' },
        { id: '2', name: 'Dr. Jones', role: 'Doctor', status: 'active' },
        { id: '3', name: 'Nurse A', role: 'Nurse', status: 'active' },
        { id: '4', name: 'Nurse B', role: 'Nurse', status: 'active' },
        { id: '5', name: 'Nurse C', role: 'Nurse', status: 'active' },
      ];

      const result = calculateCoverage('ICU', staff, {
        Doctor: 2,
        Nurse: 3,
      });

      expect(result.overallPercentage).toBe(100);
      expect(result.status).toBe('full');
    });
  });

  describe('Shift Handover', () => {
    interface HandoverItem {
      patientId: string;
      priority: 'low' | 'medium' | 'high';
      notes: string;
      completed: boolean;
      category: 'medication' | 'observation' | 'procedure' | 'other';
    }

    const getHandoverProgress = (items: HandoverItem[]) => {
      const total = items.length;
      const completed = items.filter(item => item.completed).length;
      const byPriority = {
        high: items.filter(i => i.priority === 'high' && !i.completed).length,
        medium: items.filter(i => i.priority === 'medium' && !i.completed).length,
        low: items.filter(i => i.priority === 'low' && !i.completed).length,
      };

      const percentage = total > 0 ? (completed / total) * 100 : 0;

      return {
        total,
        completed,
        remaining: total - completed,
        percentage,
        byPriority,
        status: percentage === 100 ? 'complete' :
                percentage >= 80 ? 'nearly-complete' :
                percentage >= 50 ? 'in-progress' :
                'started',
      };
    };

    it('calculates handover progress', () => {
      const items: HandoverItem[] = [
        { patientId: '1', priority: 'high', notes: 'Check vitals', completed: true, category: 'observation' },
        { patientId: '2', priority: 'high', notes: 'Administer medication', completed: false, category: 'medication' },
        { patientId: '3', priority: 'medium', notes: 'Update chart', completed: true, category: 'other' },
        { patientId: '4', priority: 'low', notes: 'Schedule follow-up', completed: false, category: 'other' },
      ];

      const progress = getHandoverProgress(items);
      expect(progress.completed).toBe(2);
      expect(progress.remaining).toBe(2);
      expect(progress.percentage).toBe(50);
      expect(progress.status).toBe('in-progress');
    });

    it('tracks remaining items by priority', () => {
      const items: HandoverItem[] = [
        { patientId: '1', priority: 'high', notes: 'Critical task', completed: false, category: 'procedure' },
        { patientId: '2', priority: 'high', notes: 'Important task', completed: false, category: 'medication' },
        { patientId: '3', priority: 'medium', notes: 'Regular task', completed: false, category: 'observation' },
      ];

      const progress = getHandoverProgress(items);
      expect(progress.byPriority.high).toBe(2);
      expect(progress.byPriority.medium).toBe(1);
      expect(progress.byPriority.low).toBe(0);
    });
  });

  describe('Shift Alerts', () => {
    const getShiftAlerts = (shift: {
      startTime: Date;
      endTime: Date;
      breaksTaken: number;
      breaksAllowed: number;
      handoverComplete: boolean;
    }, currentTime: Date = new Date()) => {
      const alerts = [];
      const timeToEnd = shift.endTime.getTime() - currentTime.getTime();
      const minutesToEnd = Math.floor(timeToEnd / 60000);

      // Shift ending soon
      if (minutesToEnd > 0 && minutesToEnd <= 30) {
        alerts.push({
          type: 'warning',
          message: `Shift ends in ${minutesToEnd} minutes`,
          priority: 'medium',
          action: 'Prepare for handover',
        });
      }

      // Handover not started
      if (minutesToEnd > 0 && minutesToEnd <= 15 && !shift.handoverComplete) {
        alerts.push({
          type: 'urgent',
          message: 'Handover not completed',
          priority: 'high',
          action: 'Start handover process',
        });
      }

      // Breaks not taken
      const breaksRemaining = shift.breaksAllowed - shift.breaksTaken;
      if (breaksRemaining > 0 && minutesToEnd < 60) {
        alerts.push({
          type: 'info',
          message: `${breaksRemaining} breaks not taken`,
          priority: 'low',
          action: 'Consider taking remaining breaks',
        });
      }

      // Overtime
      if (timeToEnd < 0) {
        const overtimeMinutes = Math.abs(minutesToEnd);
        alerts.push({
          type: 'critical',
          message: `${overtimeMinutes} minutes overtime`,
          priority: 'high',
          action: 'Complete handover and clock out',
        });
      }

      return alerts;
    };

    it('alerts when shift ending soon', () => {
      const shift = {
        startTime: new Date(Date.now() - 7.5 * 3600000),
        endTime: new Date(Date.now() + 25 * 60000), // 25 minutes from now
        breaksTaken: 2,
        breaksAllowed: 2,
        handoverComplete: false,
      };

      const alerts = getShiftAlerts(shift);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].message).toBe('Shift ends in 25 minutes');
      expect(alerts[0].type).toBe('warning');
    });

    it('urgent alert for incomplete handover', () => {
      const shift = {
        startTime: new Date(Date.now() - 7.75 * 3600000),
        endTime: new Date(Date.now() + 10 * 60000), // 10 minutes from now
        breaksTaken: 2,
        breaksAllowed: 2,
        handoverComplete: false,
      };

      const alerts = getShiftAlerts(shift);
      const handoverAlert = alerts.find(a => a.message === 'Handover not completed');
      expect(handoverAlert).toBeDefined();
      expect(handoverAlert?.type).toBe('urgent');
      expect(handoverAlert?.priority).toBe('high');
    });

    it('detects overtime', () => {
      const shift = {
        startTime: new Date(Date.now() - 9 * 3600000),
        endTime: new Date(Date.now() - 30 * 60000), // 30 minutes ago
        breaksTaken: 2,
        breaksAllowed: 2,
        handoverComplete: true,
      };

      const alerts = getShiftAlerts(shift);
      const overtimeAlert = alerts.find(a => a.message.includes('overtime'));
      expect(overtimeAlert).toBeDefined();
      expect(overtimeAlert?.type).toBe('critical');
      expect(overtimeAlert?.message).toBe('30 minutes overtime');
    });
  });
});