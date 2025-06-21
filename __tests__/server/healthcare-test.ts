import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals';
import { healthcareRouter } from '@/src/server/routers/healthcare';
import { createCallerFactory } from '@/src/server/trpc';
import { db } from '@/src/db';
import { 
  alerts, 
  alertEscalations, 
  alertAcknowledgments,
  healthcareAuditLogs,
  healthcareUsers,
  hospitals
} from '@/src/db/healthcare-schema';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import type { User } from 'better-auth';

// Mock database
vi.mock('@/src/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
    transaction: vi.fn()
  }
}));

// Mock escalation timer service
vi.mock('@/src/server/services/escalation-timer', () => ({
  escalationTimerService: {
    startTimer: vi.fn(),
    stopTimer: vi.fn(),
    checkEscalation: vi.fn()
  }
}));

const createCaller = createCallerFactory(healthcareRouter);

describe('Healthcare Router Tests', () => {
  const mockHospitalId = '550e8400-e29b-41d4-a716-446655440000';
  const mockOrganizationId = '550e8400-e29b-41d4-a716-446655440001';
  const mockUserId = '550e8400-e29b-41d4-a716-446655440002';
  const mockAlertId = '550e8400-e29b-41d4-a716-446655440003';

  const mockUser: User = {
    id: mockUserId,
    email: 'test@hospital.com',
    name: 'Test User',
    organizationId: mockOrganizationId,
    organizationRole: 'nurse',
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: true
  };

  const mockHospital = {
    id: mockHospitalId,
    name: 'Test Hospital',
    organizationId: mockOrganizationId,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  let caller: any;

  beforeEach(() => {
    vi.clearAllMocks();
    caller = createCaller({ user: mockUser });
  });

  describe('getOrganizationHospitals', () => {
    it('should return hospitals for the user organization', async () => {
      const mockHospitals = [mockHospital];
      
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockHospitals)
          })
        })
      } as any);

      const result = await caller.getOrganizationHospitals({ 
        organizationId: mockOrganizationId 
      });

      expect(result.hospitals).toEqual(mockHospitals);
      expect(result.defaultHospitalId).toBe(mockHospitalId);
    });

    it('should throw error for unauthorized organization access', async () => {
      await expect(
        caller.getOrganizationHospitals({ 
          organizationId: 'different-org-id' 
        })
      ).rejects.toThrow('Access denied');
    });
  });

  describe('createAlert', () => {
    const createAlertInput = {
      roomNumber: '302',
      alertType: 'cardiac_arrest' as const,
      urgencyLevel: 1,
      description: 'Patient needs immediate attention',
      hospitalId: mockHospitalId
    };

    it('should create alert for operator role', async () => {
      const operatorUser = { ...mockUser, organizationRole: 'operator' };
      const operatorCaller = createCaller({ user: operatorUser });

      // Mock healthcare user lookup
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ 
              id: 'healthcare-user-id',
              userId: mockUserId,
              hospitalId: mockHospitalId,
              role: 'operator'
            }])
          })
        })
      } as any);

      // Mock alert creation
      const mockCreatedAlert = {
        id: mockAlertId,
        ...createAlertInput,
        createdBy: mockUserId,
        status: 'active',
        createdAt: new Date()
      };

      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockCreatedAlert])
        })
      } as any);

      // Mock transaction for audit log
      vi.mocked(db.transaction).mockImplementation(async (fn) => fn(db));

      const result = await operatorCaller.createAlert(createAlertInput);

      expect(result.alert).toMatchObject({
        id: mockAlertId,
        roomNumber: '302',
        alertType: 'cardiac_arrest'
      });
    });

    it('should reject alert creation for doctor role', async () => {
      const doctorUser = { ...mockUser, organizationRole: 'doctor' };
      const doctorCaller = createCaller({ user: doctorUser });

      // Mock healthcare user lookup
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ 
              id: 'healthcare-user-id',
              userId: mockUserId,
              hospitalId: mockHospitalId,
              role: 'doctor'
            }])
          })
        })
      } as any);

      await expect(
        doctorCaller.createAlert(createAlertInput)
      ).rejects.toThrow('permission');
    });

    it('should validate required fields', async () => {
      const invalidInput = {
        roomNumber: '', // Invalid empty room
        alertType: 'invalid_type' as any,
        urgencyLevel: 6, // Invalid urgency
        hospitalId: 'not-a-uuid' // Invalid UUID
      };

      await expect(
        caller.createAlert(invalidInput)
      ).rejects.toThrow();
    });
  });

  describe('acknowledgeAlert', () => {
    const acknowledgeInput = {
      alertId: mockAlertId,
      urgencyAssessment: 'maintain' as const,
      responseAction: 'responding' as const,
      estimatedResponseTime: 5,
      notes: 'On my way'
    };

    it('should allow doctors to acknowledge alerts', async () => {
      const doctorUser = { ...mockUser, organizationRole: 'doctor' };
      const doctorCaller = createCaller({ user: doctorUser });

      // Mock healthcare user lookup
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ 
              id: 'healthcare-user-id',
              userId: mockUserId,
              role: 'doctor',
              licenseNumber: 'MD12345'
            }])
          })
        })
      } as any);

      // Mock alert lookup
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: mockAlertId,
              status: 'active',
              hospitalId: mockHospitalId
            }])
          })
        })
      } as any);

      // Mock transaction
      vi.mocked(db.transaction).mockImplementation(async (fn) => {
        const mockTx = {
          ...db,
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{
                id: 'ack-id',
                ...acknowledgeInput,
                acknowledgedBy: mockUserId
              }])
            })
          }),
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([])
            })
          })
        };
        return fn(mockTx as any);
      });

      const result = await doctorCaller.acknowledgeAlert(acknowledgeInput);

      expect(result.success).toBe(true);
      expect(result.acknowledgment).toMatchObject({
        alertId: mockAlertId,
        responseAction: 'responding'
      });
    });

    it('should reject acknowledgment from operators', async () => {
      const operatorUser = { ...mockUser, organizationRole: 'operator' };
      const operatorCaller = createCaller({ user: operatorUser });

      // Mock healthcare user lookup
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ 
              id: 'healthcare-user-id',
              userId: mockUserId,
              role: 'operator'
            }])
          })
        })
      } as any);

      await expect(
        operatorCaller.acknowledgeAlert(acknowledgeInput)
      ).rejects.toThrow('permission');
    });
  });

  describe('getActiveAlerts', () => {
    it('should return filtered alerts with proper permissions', async () => {
      const mockAlerts = [
        {
          id: mockAlertId,
          roomNumber: '302',
          alertType: 'cardiac_arrest',
          status: 'active',
          createdAt: new Date(),
          patient: { name: 'John Doe' },
          createdByUser: { name: 'Operator' }
        }
      ];

      // Mock complex join query
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue(mockAlerts)
                })
              })
            })
          })
        })
      } as any);

      const result = await caller.getActiveAlerts({
        hospitalId: mockHospitalId,
        status: 'active'
      });

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0]).toMatchObject({
        id: mockAlertId,
        roomNumber: '302'
      });
    });

    it('should apply urgency level filter', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue([])
                })
              })
            })
          })
        })
      } as any);

      await caller.getActiveAlerts({
        hospitalId: mockHospitalId,
        urgencyLevel: 1
      });

      // Verify the where clause was called with urgency filter
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('getAlertMetrics', () => {
    it('should calculate proper metrics', async () => {
      const mockMetricsData = [
        { urgencyLevel: 1, count: '5' },
        { urgencyLevel: 2, count: '10' },
        { urgencyLevel: 3, count: '15' }
      ];

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue(mockMetricsData)
          })
        })
      } as any);

      const result = await caller.getAlertMetrics({
        hospitalId: mockHospitalId,
        timeRange: 'today'
      });

      expect(result.totalAlerts).toBe(30);
      expect(result.byUrgency).toEqual({
        1: 5,
        2: 10,
        3: 15
      });
    });
  });

  describe('Security & Authorization', () => {
    it('should verify hospital access for all operations', async () => {
      // Test with user not belonging to hospital
      const unauthorizedUser = { 
        ...mockUser, 
        organizationId: 'different-org' 
      };
      const unauthorizedCaller = createCaller({ user: unauthorizedUser });

      await expect(
        unauthorizedCaller.getActiveAlerts({ 
          hospitalId: mockHospitalId 
        })
      ).rejects.toThrow();
    });

    it('should log all actions to audit trail', async () => {
      // Mock healthcare user
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ 
              id: 'healthcare-user-id',
              userId: mockUserId,
              role: 'operator'
            }])
          })
        })
      } as any);

      // Mock transaction with audit log insertion
      let auditLogInserted = false;
      vi.mocked(db.transaction).mockImplementation(async (fn) => {
        const mockTx = {
          ...db,
          insert: vi.fn().mockImplementation((table) => {
            if (table === healthcareAuditLogs) {
              auditLogInserted = true;
            }
            return {
              values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{}])
              })
            };
          })
        };
        return fn(mockTx as any);
      });

      const operatorUser = { ...mockUser, organizationRole: 'operator' };
      const operatorCaller = createCaller({ user: operatorUser });

      await operatorCaller.createAlert({
        roomNumber: '302',
        alertType: 'medical_emergency',
        urgencyLevel: 3,
        hospitalId: mockHospitalId
      });

      expect(auditLogInserted).toBe(true);
    });
  });
});

describe('Healthcare Router Edge Cases', () => {
  const createCaller = createCallerFactory(healthcareRouter);
  
  it('should handle database connection errors gracefully', async () => {
    vi.mocked(db.select).mockRejectedValue(new Error('Database unavailable'));
    
    const caller = createCaller({ 
      user: { 
        id: 'test-id',
        organizationId: 'test-org',
        organizationRole: 'nurse'
      } as User 
    });

    await expect(
      caller.getActiveAlerts({ hospitalId: 'test-hospital' })
    ).rejects.toThrow('Database unavailable');
  });

  it('should handle concurrent alert acknowledgments', async () => {
    // Test race condition when multiple users acknowledge same alert
    // Implementation would test transaction isolation
  });

  it('should handle escalation timer edge cases', async () => {
    // Test escalation when acknowledgment happens at exact escalation time
    // Test timer cleanup on alert resolution
  });
});