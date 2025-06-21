import { describe, it, expect } from '@jest/globals';

describe('AlertItem Component Logic', () => {
  describe('Priority Display', () => {
    const getPriorityConfig = (priority: 'low' | 'medium' | 'high' | 'critical') => {
      const configs = {
        low: {
          color: 'text-green-600',
          backgroundColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: 'info-circle',
          label: 'Low Priority',
          order: 4,
        },
        medium: {
          color: 'text-yellow-600',
          backgroundColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: 'exclamation-circle',
          label: 'Medium Priority',
          order: 3,
        },
        high: {
          color: 'text-orange-600',
          backgroundColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          icon: 'exclamation-triangle',
          label: 'High Priority',
          order: 2,
        },
        critical: {
          color: 'text-red-600',
          backgroundColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: 'alert-octagon',
          label: 'Critical',
          order: 1,
          pulse: true,
        },
      };

      return configs[priority];
    };

    it('assigns correct colors for each priority', () => {
      expect(getPriorityConfig('low').color).toBe('text-green-600');
      expect(getPriorityConfig('medium').color).toBe('text-yellow-600');
      expect(getPriorityConfig('high').color).toBe('text-orange-600');
      expect(getPriorityConfig('critical').color).toBe('text-red-600');
    });

    it('assigns appropriate icons', () => {
      expect(getPriorityConfig('low').icon).toBe('info-circle');
      expect(getPriorityConfig('medium').icon).toBe('exclamation-circle');
      expect(getPriorityConfig('high').icon).toBe('exclamation-triangle');
      expect(getPriorityConfig('critical').icon).toBe('alert-octagon');
    });

    it('critical alerts have pulse animation', () => {
      expect(getPriorityConfig('critical').pulse).toBe(true);
      expect(getPriorityConfig('high').pulse).toBeUndefined();
    });

    it('priorities have correct sort order', () => {
      expect(getPriorityConfig('critical').order).toBe(1);
      expect(getPriorityConfig('high').order).toBe(2);
      expect(getPriorityConfig('medium').order).toBe(3);
      expect(getPriorityConfig('low').order).toBe(4);
    });
  });

  describe('Alert Status', () => {
    interface AlertStatus {
      status: 'pending' | 'acknowledged' | 'resolved' | 'escalated';
      acknowledgedBy?: string;
      acknowledgedAt?: Date;
      resolvedAt?: Date;
    }

    const getStatusDisplay = (alert: AlertStatus) => {
      const statusConfigs = {
        pending: {
          label: 'Pending',
          color: 'text-gray-600',
          icon: 'clock',
          showTimer: true,
        },
        acknowledged: {
          label: `Acknowledged by ${alert.acknowledgedBy || 'Staff'}`,
          color: 'text-blue-600',
          icon: 'check',
          showTimer: false,
        },
        resolved: {
          label: 'Resolved',
          color: 'text-green-600',
          icon: 'check-circle',
          showTimer: false,
        },
        escalated: {
          label: 'Escalated',
          color: 'text-red-600',
          icon: 'arrow-up-circle',
          showTimer: true,
          urgent: true,
        },
      };

      return statusConfigs[alert.status];
    };

    it('displays correct status labels', () => {
      expect(getStatusDisplay({ status: 'pending' }).label).toBe('Pending');
      expect(getStatusDisplay({ status: 'resolved' }).label).toBe('Resolved');
      expect(getStatusDisplay({ status: 'escalated' }).label).toBe('Escalated');
    });

    it('includes acknowledger name when acknowledged', () => {
      const display = getStatusDisplay({
        status: 'acknowledged',
        acknowledgedBy: 'Dr. Smith',
      });
      expect(display.label).toBe('Acknowledged by Dr. Smith');
    });

    it('shows timer for pending and escalated alerts', () => {
      expect(getStatusDisplay({ status: 'pending' }).showTimer).toBe(true);
      expect(getStatusDisplay({ status: 'escalated' }).showTimer).toBe(true);
      expect(getStatusDisplay({ status: 'acknowledged' }).showTimer).toBe(false);
      expect(getStatusDisplay({ status: 'resolved' }).showTimer).toBe(false);
    });

    it('marks escalated alerts as urgent', () => {
      expect(getStatusDisplay({ status: 'escalated' }).urgent).toBe(true);
      expect(getStatusDisplay({ status: 'pending' }).urgent).toBeUndefined();
    });
  });

  describe('Alert Actions', () => {
    interface AlertAction {
      id: string;
      label: string;
      icon?: string;
      variant?: 'primary' | 'secondary' | 'danger';
      requiresConfirmation?: boolean;
      disabledReason?: string;
    }

    const getAvailableActions = (alert: {
      status: string;
      priority: string;
      userRole: string;
    }): AlertAction[] => {
      const actions: AlertAction[] = [];

      if (alert.status === 'pending') {
        actions.push({
          id: 'acknowledge',
          label: 'Acknowledge',
          icon: 'check',
          variant: 'primary',
        });

        if (alert.userRole === 'doctor' || alert.userRole === 'nurse') {
          actions.push({
            id: 'assign',
            label: 'Assign to Me',
            icon: 'user-plus',
            variant: 'secondary',
          });
        }

        if (alert.priority === 'critical' || alert.priority === 'high') {
          actions.push({
            id: 'escalate',
            label: 'Escalate',
            icon: 'arrow-up',
            variant: 'danger',
            requiresConfirmation: true,
          });
        }
      }

      if (alert.status === 'acknowledged') {
        actions.push({
          id: 'resolve',
          label: 'Mark Resolved',
          icon: 'check-circle',
          variant: 'primary',
        });

        actions.push({
          id: 'reassign',
          label: 'Reassign',
          icon: 'refresh',
          variant: 'secondary',
        });
      }

      if (alert.status !== 'resolved') {
        actions.push({
          id: 'view-details',
          label: 'View Details',
          icon: 'eye',
          variant: 'secondary',
        });
      }

      return actions;
    };

    it('pending alerts can be acknowledged', () => {
      const actions = getAvailableActions({
        status: 'pending',
        priority: 'medium',
        userRole: 'nurse',
      });

      const acknowledge = actions.find(a => a.id === 'acknowledge');
      expect(acknowledge).toBeDefined();
      expect(acknowledge?.variant).toBe('primary');
    });

    it('medical staff can assign alerts to themselves', () => {
      const nurseActions = getAvailableActions({
        status: 'pending',
        priority: 'medium',
        userRole: 'nurse',
      });

      expect(nurseActions.find(a => a.id === 'assign')).toBeDefined();

      const adminActions = getAvailableActions({
        status: 'pending',
        priority: 'medium',
        userRole: 'admin',
      });

      expect(adminActions.find(a => a.id === 'assign')).toBeUndefined();
    });

    it('high priority alerts can be escalated', () => {
      const highPriority = getAvailableActions({
        status: 'pending',
        priority: 'high',
        userRole: 'nurse',
      });

      const escalate = highPriority.find(a => a.id === 'escalate');
      expect(escalate).toBeDefined();
      expect(escalate?.requiresConfirmation).toBe(true);
      expect(escalate?.variant).toBe('danger');
    });

    it('acknowledged alerts can be resolved', () => {
      const actions = getAvailableActions({
        status: 'acknowledged',
        priority: 'medium',
        userRole: 'nurse',
      });

      expect(actions.find(a => a.id === 'resolve')).toBeDefined();
      expect(actions.find(a => a.id === 'reassign')).toBeDefined();
    });
  });

  describe('Alert Timer', () => {
    const calculateAlertAge = (createdAt: Date, now: Date = new Date()) => {
      const ageMs = now.getTime() - createdAt.getTime();
      const minutes = Math.floor(ageMs / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        return { value: days, unit: 'day', display: `${days}d` };
      } else if (hours > 0) {
        return { value: hours, unit: 'hour', display: `${hours}h` };
      } else {
        return { value: minutes, unit: 'minute', display: `${minutes}m` };
      }
    };

    const getTimerUrgency = (age: { value: number; unit: string }, priority: string) => {
      const thresholds = {
        critical: { minute: 15, hour: 1, day: 0 },
        high: { minute: 30, hour: 2, day: 0 },
        medium: { minute: 60, hour: 4, day: 1 },
        low: { minute: 120, hour: 8, day: 2 },
      };

      const threshold = thresholds[priority as keyof typeof thresholds];
      
      if (age.unit === 'day' && age.value > threshold.day) {
        return 'overdue';
      } else if (age.unit === 'hour' && age.value > threshold.hour) {
        return 'warning';
      } else if (age.unit === 'minute' && age.value > threshold.minute) {
        return 'approaching';
      }
      
      return 'normal';
    };

    it('calculates alert age correctly', () => {
      const now = new Date('2024-01-01T12:00:00');
      
      const fiveMinutesAgo = new Date('2024-01-01T11:55:00');
      expect(calculateAlertAge(fiveMinutesAgo, now)).toEqual({
        value: 5,
        unit: 'minute',
        display: '5m',
      });

      const twoHoursAgo = new Date('2024-01-01T10:00:00');
      expect(calculateAlertAge(twoHoursAgo, now)).toEqual({
        value: 2,
        unit: 'hour',
        display: '2h',
      });

      const threeDaysAgo = new Date('2023-12-29T12:00:00');
      expect(calculateAlertAge(threeDaysAgo, now)).toEqual({
        value: 3,
        unit: 'day',
        display: '3d',
      });
    });

    it('determines urgency based on priority and age', () => {
      expect(getTimerUrgency({ value: 20, unit: 'minute' }, 'critical')).toBe('approaching');
      expect(getTimerUrgency({ value: 2, unit: 'hour' }, 'critical')).toBe('warning');
      expect(getTimerUrgency({ value: 1, unit: 'day' }, 'high')).toBe('overdue');
    });
  });

  describe('Alert Metadata', () => {
    interface AlertMetadata {
      patientRoom?: string;
      patientBed?: string;
      department?: string;
      assignedTo?: string[];
      tags?: string[];
      attachments?: number;
    }

    const formatMetadata = (metadata: AlertMetadata) => {
      const items = [];

      if (metadata.patientRoom) {
        items.push({
          icon: 'door',
          label: `Room ${metadata.patientRoom}`,
          type: 'location',
        });
      }

      if (metadata.patientBed) {
        items.push({
          icon: 'bed',
          label: `Bed ${metadata.patientBed}`,
          type: 'location',
        });
      }

      if (metadata.department) {
        items.push({
          icon: 'building',
          label: metadata.department,
          type: 'department',
        });
      }

      if (metadata.assignedTo && metadata.assignedTo.length > 0) {
        items.push({
          icon: 'users',
          label: `${metadata.assignedTo.length} assigned`,
          type: 'assignment',
        });
      }

      if (metadata.attachments && metadata.attachments > 0) {
        items.push({
          icon: 'paperclip',
          label: `${metadata.attachments} files`,
          type: 'attachment',
        });
      }

      return items;
    };

    it('formats location metadata', () => {
      const metadata = formatMetadata({
        patientRoom: '301',
        patientBed: 'A',
        department: 'Emergency',
      });

      expect(metadata).toHaveLength(3);
      expect(metadata[0]).toEqual({
        icon: 'door',
        label: 'Room 301',
        type: 'location',
      });
      expect(metadata[1]).toEqual({
        icon: 'bed',
        label: 'Bed A',
        type: 'location',
      });
    });

    it('shows assignment count', () => {
      const metadata = formatMetadata({
        assignedTo: ['Dr. Smith', 'Nurse Johnson'],
      });

      expect(metadata[0]).toEqual({
        icon: 'users',
        label: '2 assigned',
        type: 'assignment',
      });
    });

    it('shows attachment count', () => {
      const metadata = formatMetadata({
        attachments: 3,
      });

      expect(metadata[0]).toEqual({
        icon: 'paperclip',
        label: '3 files',
        type: 'attachment',
      });
    });
  });

  describe('Alert Interaction States', () => {
    const getInteractionStyles = (state: {
      isHovered?: boolean;
      isPressed?: boolean;
      isFocused?: boolean;
      isSelected?: boolean;
      priority: string;
    }) => {
      const baseStyles = ['transition-all', 'duration-200'];
      const styles = [...baseStyles];

      if (state.isSelected) {
        styles.push('ring-2', 'ring-primary', 'bg-primary/5');
      } else if (state.isPressed) {
        styles.push('scale-98', 'opacity-90');
      } else if (state.isHovered) {
        styles.push('shadow-md', 'translate-y-[-2px]');
        if (state.priority === 'critical') {
          styles.push('shadow-red-200');
        }
      }

      if (state.isFocused) {
        styles.push('outline-none', 'ring-2', 'ring-offset-2', 'ring-primary');
      }

      return styles.join(' ');
    };

    it('applies hover effects', () => {
      const styles = getInteractionStyles({
        isHovered: true,
        priority: 'medium',
      });

      expect(styles).toContain('shadow-md');
      expect(styles).toContain('translate-y-[-2px]');
    });

    it('critical alerts have colored shadow on hover', () => {
      const styles = getInteractionStyles({
        isHovered: true,
        priority: 'critical',
      });

      expect(styles).toContain('shadow-red-200');
    });

    it('applies selection styles', () => {
      const styles = getInteractionStyles({
        isSelected: true,
        priority: 'medium',
      });

      expect(styles).toContain('ring-2');
      expect(styles).toContain('ring-primary');
      expect(styles).toContain('bg-primary/5');
    });

    it('applies press animation', () => {
      const styles = getInteractionStyles({
        isPressed: true,
        priority: 'medium',
      });

      expect(styles).toContain('scale-98');
      expect(styles).toContain('opacity-90');
    });
  });
});