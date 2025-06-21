import { describe, it, expect } from '@jest/globals';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasFeatureAccess,
  isHealthcareRole,
  isAdminRole,
  isManagementRole,
  isMedicalStaff,
  canAccessHospital,
  canManageHospital,
  canAccessPatientInHospital,
  canCreateAlertInHospital,
  canResolveAlertInHospital,
} from '../../lib/auth/permissions';
import type { Permission, Role, User } from '../../types/auth';

describe('Permission Utilities', () => {
  // Mock users for testing
  const adminUser: User = {
    id: '1',
    email: 'admin@hospital.com',
    name: 'Admin User',
    role: 'admin' as Role,
    hospitalId: 'hospital-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const doctorUser: User = {
    id: '2',
    email: 'doctor@hospital.com',
    name: 'Doctor User',
    role: 'doctor' as Role,
    hospitalId: 'hospital-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const nurseUser: User = {
    id: '3',
    email: 'nurse@hospital.com',
    name: 'Nurse User',
    role: 'nurse' as Role,
    hospitalId: 'hospital-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const operatorUser: User = {
    id: '4',
    email: 'operator@hospital.com',
    name: 'Operator User',
    role: 'operator' as Role,
    hospitalId: 'hospital-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('hasPermission', () => {
    it('should return true for admin with any permission', () => {
      expect(hasPermission('admin', 'alerts.create')).toBe(true);
      expect(hasPermission('admin', 'patients.view')).toBe(true);
      expect(hasPermission('admin', 'system.manage')).toBe(true);
    });

    it('should check specific permissions for roles', () => {
      expect(hasPermission('doctor', 'alerts.create')).toBe(true);
      expect(hasPermission('doctor', 'system.manage')).toBe(false);
      
      expect(hasPermission('nurse', 'alerts.create')).toBe(true);
      expect(hasPermission('nurse', 'patients.edit')).toBe(false);
      
      expect(hasPermission('operator', 'alerts.view')).toBe(true);
      expect(hasPermission('operator', 'alerts.create')).toBe(false);
    });

    it('should return false for invalid roles', () => {
      expect(hasPermission('invalid-role' as Role, 'alerts.create')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if role has any of the permissions', () => {
      expect(hasAnyPermission('doctor', ['alerts.create', 'system.manage'])).toBe(true);
      expect(hasAnyPermission('nurse', ['alerts.create', 'alerts.view'])).toBe(true);
    });

    it('should return false if role has none of the permissions', () => {
      expect(hasAnyPermission('operator', ['patients.edit', 'system.manage'])).toBe(false);
    });

    it('should return true for admin with any permissions', () => {
      expect(hasAnyPermission('admin', ['any.permission', 'another.permission'])).toBe(true);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if role has all permissions', () => {
      expect(hasAllPermissions('doctor', ['alerts.create', 'patients.view'])).toBe(true);
      expect(hasAllPermissions('admin', ['any.permission', 'another.permission'])).toBe(true);
    });

    it('should return false if role lacks any permission', () => {
      expect(hasAllPermissions('nurse', ['alerts.create', 'patients.edit'])).toBe(false);
      expect(hasAllPermissions('operator', ['alerts.create', 'alerts.view'])).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should check if user has specific role', () => {
      expect(hasRole(adminUser, 'admin')).toBe(true);
      expect(hasRole(adminUser, 'doctor')).toBe(false);
      
      expect(hasRole(doctorUser, 'doctor')).toBe(true);
      expect(hasRole(doctorUser, 'nurse')).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasRole(null, 'admin')).toBe(false);
      expect(hasRole(undefined, 'admin')).toBe(false);
    });
  });

  describe('hasFeatureAccess', () => {
    it('should check feature access based on permissions', () => {
      expect(hasFeatureAccess('admin', 'alerts')).toBe(true);
      expect(hasFeatureAccess('doctor', 'alerts')).toBe(true);
      expect(hasFeatureAccess('operator', 'patients')).toBe(false);
    });
  });

  describe('Role Type Checks', () => {
    it('should identify healthcare roles', () => {
      expect(isHealthcareRole('doctor')).toBe(true);
      expect(isHealthcareRole('nurse')).toBe(true);
      expect(isHealthcareRole('operator')).toBe(true);
      expect(isHealthcareRole('admin')).toBe(false);
      expect(isHealthcareRole('manager')).toBe(false);
    });

    it('should identify admin roles', () => {
      expect(isAdminRole('admin')).toBe(true);
      expect(isAdminRole('doctor')).toBe(false);
      expect(isAdminRole('nurse')).toBe(false);
    });

    it('should identify management roles', () => {
      expect(isManagementRole('admin')).toBe(true);
      expect(isManagementRole('manager')).toBe(true);
      expect(isManagementRole('doctor')).toBe(false);
    });

    it('should identify medical staff', () => {
      expect(isMedicalStaff('doctor')).toBe(true);
      expect(isMedicalStaff('nurse')).toBe(true);
      expect(isMedicalStaff('operator')).toBe(false);
      expect(isMedicalStaff('admin')).toBe(false);
    });
  });

  describe('Hospital Access Permissions', () => {
    it('should check hospital access', () => {
      expect(canAccessHospital(adminUser, 'hospital-1')).toBe(true);
      expect(canAccessHospital(adminUser, 'hospital-2')).toBe(true); // Admin can access any
      
      expect(canAccessHospital(doctorUser, 'hospital-1')).toBe(true);
      expect(canAccessHospital(doctorUser, 'hospital-2')).toBe(false);
      
      expect(canAccessHospital(null, 'hospital-1')).toBe(false);
    });

    it('should check hospital management permissions', () => {
      expect(canManageHospital(adminUser, 'hospital-1')).toBe(true);
      expect(canManageHospital(adminUser, 'hospital-2')).toBe(true);
      
      expect(canManageHospital(doctorUser, 'hospital-1')).toBe(false);
      expect(canManageHospital(nurseUser, 'hospital-1')).toBe(false);
    });

    it('should check patient access in hospital', () => {
      expect(canAccessPatientInHospital(doctorUser, 'hospital-1')).toBe(true);
      expect(canAccessPatientInHospital(doctorUser, 'hospital-2')).toBe(false);
      
      expect(canAccessPatientInHospital(nurseUser, 'hospital-1')).toBe(true);
      expect(canAccessPatientInHospital(operatorUser, 'hospital-1')).toBe(false);
    });

    it('should check alert creation permissions', () => {
      expect(canCreateAlertInHospital(doctorUser, 'hospital-1')).toBe(true);
      expect(canCreateAlertInHospital(doctorUser, 'hospital-2')).toBe(false);
      
      expect(canCreateAlertInHospital(nurseUser, 'hospital-1')).toBe(true);
      expect(canCreateAlertInHospital(operatorUser, 'hospital-1')).toBe(false);
    });

    it('should check alert resolution permissions', () => {
      expect(canResolveAlertInHospital(doctorUser, 'hospital-1')).toBe(true);
      expect(canResolveAlertInHospital(doctorUser, 'hospital-2')).toBe(false);
      
      expect(canResolveAlertInHospital(nurseUser, 'hospital-1')).toBe(false);
      expect(canResolveAlertInHospital(operatorUser, 'hospital-1')).toBe(false);
      
      expect(canResolveAlertInHospital(adminUser, 'any-hospital')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined/null users gracefully', () => {
      expect(canAccessHospital(undefined, 'hospital-1')).toBe(false);
      expect(canManageHospital(null, 'hospital-1')).toBe(false);
      expect(canCreateAlertInHospital(undefined, 'hospital-1')).toBe(false);
    });

    it('should handle users without hospitalId', () => {
      const userWithoutHospital = { ...doctorUser, hospitalId: undefined };
      expect(canAccessHospital(userWithoutHospital, 'hospital-1')).toBe(false);
      expect(canCreateAlertInHospital(userWithoutHospital, 'hospital-1')).toBe(false);
    });

    it('should handle empty permission arrays', () => {
      expect(hasAnyPermission('doctor', [])).toBe(false);
      expect(hasAllPermissions('doctor', [])).toBe(true); // Vacuous truth
    });
  });
});