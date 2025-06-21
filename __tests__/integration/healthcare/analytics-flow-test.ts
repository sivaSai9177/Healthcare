/**
 * Integration test for analytics flow
 * Tests: Generate metrics → Filter by date → Export report → Share insights
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createTestContext, createMockUser, cleanupDatabase } from '../../helpers/test-utils';
import type { AppRouter } from '@/src/server/routers';

// Mock file system for export
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

// Mock email service for sharing
jest.mock('@/src/server/services/email', () => ({
  emailService: {
    sendAnalyticsReport: jest.fn().mockResolvedValue({ success: true }),
  },
}));

describe('Analytics Flow Integration', () => {
  let appRouter: AppRouter;
  
  beforeEach(async () => {
    jest.clearAllMocks();
    await cleanupDatabase();
    const { appRouter: router } = await import('@/src/server/routers');
    appRouter = router;
  });
  
  afterEach(() => {
    jest.clearAllTimers();
  });
  
  describe('Complete Analytics Workflow', () => {
    it('should generate, filter, export, and share analytics reports', async () => {
      // Setup test data
      const manager = await createMockUser({
        email: 'manager@test.com',
        role: 'manager',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const nurse = await createMockUser({
        email: 'nurse@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const doctor = await createMockUser({
        email: 'doctor@test.com',
        role: 'doctor',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const operator = await createMockUser({
        email: 'operator@test.com',
        role: 'operator',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      // Create historical data
      const operatorCtx = await createTestContext(operator);
      const operatorCaller = appRouter.createCaller(operatorCtx);
      
      // Create alerts with different types and urgencies
      const alerts = await Promise.all([
        operatorCaller.healthcare.createAlert({
          roomNumber: 'A101',
          alertType: 'code_blue' as const,
          urgencyLevel: 5,
          hospitalId: 'test-hospital',
        }),
        operatorCaller.healthcare.createAlert({
          roomNumber: 'B202',
          alertType: 'medical_emergency' as const,
          urgencyLevel: 4,
          hospitalId: 'test-hospital',
        }),
        operatorCaller.healthcare.createAlert({
          roomNumber: 'C303',
          alertType: 'nurse_assistance' as const,
          urgencyLevel: 2,
          hospitalId: 'test-hospital',
        }),
      ]);
      
      // Nurse acknowledges some alerts
      const nurseCtx = await createTestContext(nurse);
      const nurseCaller = appRouter.createCaller(nurseCtx);
      
      await nurseCaller.healthcare.acknowledgeAlert({
        alertId: alerts[0].id,
        notes: 'Responding to code blue',
      });
      
      await nurseCaller.healthcare.acknowledgeAlert({
        alertId: alerts[1].id,
      });
      
      // Doctor resolves one alert
      const doctorCtx = await createTestContext(doctor);
      const doctorCaller = appRouter.createCaller(doctorCtx);
      
      await doctorCaller.healthcare.resolveAlert({
        alertId: alerts[0].id,
        resolution: 'Patient stabilized',
      });
      
      // Step 1: Generate comprehensive metrics
      const managerCtx = await createTestContext(manager);
      const managerCaller = appRouter.createCaller(managerCtx);
      
      const metrics = await managerCaller.healthcare.generateAnalytics({
        hospitalId: 'test-hospital',
        timeRange: '24h',
        includeAlerts: true,
        includeStaff: true,
        includePatients: true,
        includeResponseTimes: true,
      });
      
      expect(metrics).toMatchObject({
        period: {
          start: expect.any(Date),
          end: expect.any(Date),
          duration: '24h',
        },
        alerts: {
          total: 3,
          byType: {
            code_blue: 1,
            medical_emergency: 1,
            nurse_assistance: 1,
          },
          byUrgency: {
            '5': 1,
            '4': 1,
            '2': 1,
          },
          byStatus: {
            active: 1,
            acknowledged: 1,
            resolved: 1,
          },
        },
        responseMetrics: {
          averageAcknowledgmentTime: expect.any(Number),
          averageResolutionTime: expect.any(Number),
          acknowledgedWithinSLA: expect.any(Number),
        },
        staffMetrics: {
          totalStaff: 4,
          byRole: {
            nurse: 1,
            doctor: 1,
            manager: 1,
            operator: 1,
          },
          averageAlertsPerStaff: expect.any(Number),
        },
      });
      
      // Step 2: Filter analytics by custom date range
      const customMetrics = await managerCaller.healthcare.generateAnalytics({
        hospitalId: 'test-hospital',
        startDate: new Date(Date.now() - 12 * 60 * 60 * 1000), // Last 12 hours
        endDate: new Date(),
        includeAlerts: true,
        groupBy: 'hour',
      });
      
      expect(customMetrics.groupedData).toBeDefined();
      expect(customMetrics.groupedData.length).toBeGreaterThan(0);
      
      // Step 3: Export analytics report
      const exportResult = await managerCaller.healthcare.exportAnalytics({
        hospitalId: 'test-hospital',
        timeRange: '24h',
        format: 'pdf' as const,
        includeCharts: true,
        sections: ['alerts', 'response_times', 'staff_performance'],
      });
      
      expect(exportResult).toMatchObject({
        success: true,
        filename: expect.stringContaining('analytics-report'),
        format: 'pdf',
        size: expect.any(Number),
        path: expect.any(String),
      });
      
      // Verify file was created
      const fs = await import('fs/promises');
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('analytics-report'),
        expect.any(Buffer),
        expect.any(Object)
      );
      
      // Step 4: Share analytics insights
      const shareResult = await managerCaller.healthcare.shareAnalytics({
        reportPath: exportResult.path,
        recipients: ['ceo@test.com', 'board@test.com'],
        subject: 'Monthly Healthcare Analytics Report',
        message: 'Please find attached the analytics report for this month.',
        insights: [
          'Response times improved by 15% compared to last month',
          'Code blue alerts decreased by 20%',
          'Staff utilization at optimal levels',
        ],
      });
      
      expect(shareResult.success).toBe(true);
      expect(shareResult.emailsSent).toBe(2);
      
      // Verify email was sent
      const { emailService } = await import('@/src/server/services/email');
      expect(emailService.sendAnalyticsReport).toHaveBeenCalledWith({
        recipients: ['ceo@test.com', 'board@test.com'],
        subject: 'Monthly Healthcare Analytics Report',
        message: expect.any(String),
        attachments: [
          {
            filename: expect.stringContaining('analytics-report'),
            path: exportResult.path,
          },
        ],
      });
    });
    
    it('should generate comparative analytics between periods', async () => {
      const manager = await createMockUser({
        email: 'manager-compare@test.com',
        role: 'manager',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const ctx = await createTestContext(manager);
      const caller = appRouter.createCaller(ctx);
      
      // Generate comparative report
      const comparison = await caller.healthcare.compareAnalytics({
        hospitalId: 'test-hospital',
        currentPeriod: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        previousPeriod: {
          start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          end: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      });
      
      expect(comparison).toMatchObject({
        currentPeriod: expect.any(Object),
        previousPeriod: expect.any(Object),
        changes: {
          totalAlerts: {
            value: expect.any(Number),
            percentage: expect.any(Number),
            trend: expect.stringMatching(/^(up|down|stable)$/),
          },
          averageResponseTime: {
            value: expect.any(Number),
            percentage: expect.any(Number),
            trend: expect.stringMatching(/^(up|down|stable)$/),
          },
        },
        insights: expect.arrayContaining([
          expect.any(String),
        ]),
      });
    });
  });
  
  describe('Department-Specific Analytics', () => {
    it('should generate analytics filtered by department', async () => {
      const manager = await createMockUser({
        email: 'manager-dept@test.com',
        role: 'manager',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const operator = await createMockUser({
        email: 'operator-dept@test.com',
        role: 'operator',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      // Create alerts in different departments
      const operatorCtx = await createTestContext(operator);
      const operatorCaller = appRouter.createCaller(operatorCtx);
      
      await operatorCaller.healthcare.createAlert({
        roomNumber: 'ICU-01',
        alertType: 'code_blue' as const,
        urgencyLevel: 5,
        department: 'ICU',
        hospitalId: 'test-hospital',
      });
      
      await operatorCaller.healthcare.createAlert({
        roomNumber: 'ER-05',
        alertType: 'medical_emergency' as const,
        urgencyLevel: 4,
        department: 'Emergency',
        hospitalId: 'test-hospital',
      });
      
      await operatorCaller.healthcare.createAlert({
        roomNumber: 'MAT-02',
        alertType: 'nurse_assistance' as const,
        urgencyLevel: 2,
        department: 'Maternity',
        hospitalId: 'test-hospital',
      });
      
      // Get ICU-specific analytics
      const managerCtx = await createTestContext(manager);
      const managerCaller = appRouter.createCaller(managerCtx);
      
      const icuAnalytics = await managerCaller.healthcare.generateAnalytics({
        hospitalId: 'test-hospital',
        timeRange: '24h',
        department: 'ICU',
      });
      
      expect(icuAnalytics.alerts.total).toBe(1);
      expect(icuAnalytics.alerts.byType.code_blue).toBe(1);
      
      // Get all departments summary
      const departmentSummary = await managerCaller.healthcare.getDepartmentAnalytics({
        hospitalId: 'test-hospital',
        timeRange: '24h',
      });
      
      expect(departmentSummary).toMatchObject({
        ICU: {
          alerts: 1,
          avgUrgency: 5,
          criticalAlerts: 1,
        },
        Emergency: {
          alerts: 1,
          avgUrgency: 4,
          criticalAlerts: 1,
        },
        Maternity: {
          alerts: 1,
          avgUrgency: 2,
          criticalAlerts: 0,
        },
      });
    });
  });
  
  describe('Real-time Analytics Dashboard', () => {
    it('should provide real-time analytics updates', async () => {
      const manager = await createMockUser({
        email: 'manager-realtime@test.com',
        role: 'manager',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const operator = await createMockUser({
        email: 'operator-realtime@test.com',
        role: 'operator',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const managerCtx = await createTestContext(manager);
      const managerCaller = appRouter.createCaller(managerCtx);
      
      // Get initial metrics
      const initialMetrics = await managerCaller.healthcare.getRealtimeMetrics({
        hospitalId: 'test-hospital',
      });
      
      expect(initialMetrics).toMatchObject({
        activeAlerts: 0,
        onDutyStaff: 0,
        occupancyRate: 0,
        avgResponseTime: null,
        lastUpdated: expect.any(Date),
      });
      
      // Create new alert
      const operatorCtx = await createTestContext(operator);
      const operatorCaller = appRouter.createCaller(operatorCtx);
      
      await operatorCaller.healthcare.createAlert({
        roomNumber: 'RT-01',
        alertType: 'medical_emergency' as const,
        urgencyLevel: 4,
        hospitalId: 'test-hospital',
      });
      
      // Get updated metrics
      const updatedMetrics = await managerCaller.healthcare.getRealtimeMetrics({
        hospitalId: 'test-hospital',
      });
      
      expect(updatedMetrics.activeAlerts).toBe(1);
      expect(updatedMetrics.lastUpdated).not.toEqual(initialMetrics.lastUpdated);
    });
  });
  
  describe('Analytics Export Formats', () => {
    it('should export analytics in multiple formats', async () => {
      const manager = await createMockUser({
        email: 'manager-export@test.com',
        role: 'manager',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const ctx = await createTestContext(manager);
      const caller = appRouter.createCaller(ctx);
      
      // Test PDF export
      const pdfExport = await caller.healthcare.exportAnalytics({
        hospitalId: 'test-hospital',
        timeRange: '7d',
        format: 'pdf' as const,
      });
      
      expect(pdfExport.format).toBe('pdf');
      expect(pdfExport.filename).toMatch(/\.pdf$/);
      
      // Test CSV export
      const csvExport = await caller.healthcare.exportAnalytics({
        hospitalId: 'test-hospital',
        timeRange: '7d',
        format: 'csv' as const,
      });
      
      expect(csvExport.format).toBe('csv');
      expect(csvExport.filename).toMatch(/\.csv$/);
      
      // Test Excel export
      const excelExport = await caller.healthcare.exportAnalytics({
        hospitalId: 'test-hospital',
        timeRange: '7d',
        format: 'excel' as const,
      });
      
      expect(excelExport.format).toBe('excel');
      expect(excelExport.filename).toMatch(/\.xlsx$/);
    });
  });
  
  describe('Analytics Permissions', () => {
    it('should restrict analytics access based on role', async () => {
      const nurse = await createMockUser({
        email: 'nurse-analytics@test.com',
        role: 'nurse',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      const manager = await createMockUser({
        email: 'manager-analytics@test.com',
        role: 'manager',
        organizationId: 'test-org',
        defaultHospitalId: 'test-hospital',
      });
      
      // Nurse should only see basic metrics
      const nurseCtx = await createTestContext(nurse);
      const nurseCaller = appRouter.createCaller(nurseCtx);
      
      const nurseMetrics = await nurseCaller.healthcare.getBasicMetrics({
        hospitalId: 'test-hospital',
      });
      
      expect(nurseMetrics).toBeDefined();
      
      // Nurse should not access detailed analytics
      await expect(
        nurseCaller.healthcare.generateAnalytics({
          hospitalId: 'test-hospital',
          timeRange: '30d',
        })
      ).rejects.toThrow('Unauthorized');
      
      // Manager should access all analytics
      const managerCtx = await createTestContext(manager);
      const managerCaller = appRouter.createCaller(managerCtx);
      
      const managerAnalytics = await managerCaller.healthcare.generateAnalytics({
        hospitalId: 'test-hospital',
        timeRange: '30d',
      });
      
      expect(managerAnalytics).toBeDefined();
    });
  });
});