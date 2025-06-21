# Auto-Generated API Documentation

Generated on: 2025-06-18T05:30:12.707Z

## Available Routers

### healthcare

| Route | Type | Auth Required | Description |
|-------|------|---------------|-------------|
| `healthcare.getOrganizationHospitals` | 🔍 query | ✅ protected | - |
| `healthcare.getHospital` | 🔍 query | ✅ protected | - |
| `healthcare.setDefaultHospital` | ✏️ mutation | ✅ protected | - |
| `healthcare.createAlert` | ✏️ mutation | ✅ healthcare | - |
| `healthcare.getActiveAlerts` | 🔍 query | ✅ healthcare | - |
| `healthcare.getAlertStats` | 🔍 query | ✅ healthcare | - |
| `healthcare.getDepartments` | 🔍 query | ✅ healthcare | - |
| `healthcare.getActivityLogs` | 🔍 query | ✅ healthcare | - |
| `healthcare.getResponseAnalytics` | 🔍 query | ✅ healthcare | - |
| `healthcare.updateHealthcareProfile` | ✏️ mutation | ✅ protected | - |
| `healthcare.updateUserRole` | ✏️ mutation | ✅ admin | - |
| `healthcare.getOnDutyStatus` | 🔍 query | ✅ protected | - |
| `healthcare.toggleOnDuty` | ✏️ mutation | ✅ protected | - |
| `healthcare.getOnDutyStaff` | 🔍 query | ✅ healthcare | - |
| `healthcare.triggerEscalation` | ✏️ mutation | ✅ admin | - |
| `healthcare.getMetrics` | 🔍 query | ✅ healthcare | - |
| `healthcare.getAvailableHospitals` | 🔍 query | ✅ protected | - |
| `healthcare.joinHospital` | ✏️ mutation | ✅ protected | - |

### admin

| Route | Type | Auth Required | Description |
|-------|------|---------------|-------------|
| `admin.listUsers` | 🔍 query | ✅ admin | - |
| `admin.updateUserRole` | ✏️ mutation | ✅ admin | - |
| `admin.getAnalytics` | 🔍 query | ✅ admin | - |
| `admin.getAuditLogs` | 🔍 query | ✅ admin | - |
| `admin.toggleUserStatus` | ✏️ mutation | ✅ admin | - |

### auth-extensions

| Route | Type | Auth Required | Description |
|-------|------|---------------|-------------|
| `auth-extensions.resetPassword` | ✏️ mutation | ❌ public | - |
| `auth-extensions.verifyEmail` | ✏️ mutation | ❌ public | - |
| `auth-extensions.resendVerificationEmail` | ✏️ mutation | ✅ protected | - |

### notification

| Route | Type | Auth Required | Description |
|-------|------|---------------|-------------|
| `notification.getUnread` | 🔍 query | ✅ protected | - |
| `notification.markAsRead` | ✏️ mutation | ✅ protected | - |
| `notification.markAllAsRead` | ✏️ mutation | ✅ protected | - |

### organization

| Route | Type | Auth Required | Description |
|-------|------|---------------|-------------|
| `organization.create` | ✏️ mutation | ✅ protected | - |
| `organization.delete` | ✏️ mutation | ✅ protected | - |
| `organization.listUserOrganizations` | 🔍 query | ✅ protected | - |
| `organization.getMembersWithHealthcare` | 🔍 query | ✅ protected | - |
| `organization.setActiveOrganization` | ✏️ mutation | ✅ protected | - |
| `organization.joinByCode` | ✏️ mutation | ❌ public | - |
| `organization.searchOrganizations` | 🔍 query | ❌ public | - |
| `organization.sendJoinRequest` | ✏️ mutation | ✅ protected | - |
| `organization.listUserJoinRequests` | 🔍 query | ✅ protected | - |
| `organization.cancelJoinRequest` | ✏️ mutation | ✅ protected | - |

### system

| Route | Type | Auth Required | Description |
|-------|------|---------------|-------------|
| `system.getConfig` | 🔍 query | ✅ admin | - |
| `system.updateGeneralSettings` | ✏️ mutation | ✅ admin | - |
| `system.updateEmailConfig` | ✏️ mutation | ✅ admin | - |
| `system.updateSecuritySettings` | ✏️ mutation | ✅ admin | - |
| `system.updateMaintenanceMode` | ✏️ mutation | ✅ admin | - |
| `system.updateFeatureFlags` | ✏️ mutation | ✅ admin | - |
| `system.updateSystemLimits` | ✏️ mutation | ✅ admin | - |
| `system.testEmailConfig` | ✏️ mutation | ✅ admin | - |
| `system.getSystemHealth` | 🔍 query | ✅ protected | - |
| `system.clearCache` | ✏️ mutation | ✅ admin | - |
| `system.exportSystemData` | ✏️ mutation | ✅ admin | - |

### user

| Route | Type | Auth Required | Description |
|-------|------|---------------|-------------|
| `user.debugUpdateOwnRole` | ✏️ mutation | ✅ protected | - |
| `user.getEmailPreferences` | 🔍 query | ✅ protected | - |
| `user.updateEmailPreferences` | ✏️ mutation | ✅ protected | - |
| `user.getNotificationPreferences` | 🔍 query | ✅ protected | - |
| `user.updateNotificationPreferences` | ✏️ mutation | ✅ protected | - |
| `user.registerPushToken` | ✏️ mutation | ✅ protected | - |
| `user.unregisterPushToken` | ✏️ mutation | ✅ protected | - |
| `user.getPushTokens` | 🔍 query | ✅ protected | - |
| `user.deleteAccount` | ✏️ mutation | ✅ protected | - |

### ssr

| Route | Type | Auth Required | Description |
|-------|------|---------------|-------------|
| `ssr.prefetchPage` | 🔍 query | ❌ public | - |
| `ssr.getHydrationState` | 🔍 query | ❌ public | - |

### auth

| Route | Type | Auth Required | Description |
|-------|------|---------------|-------------|
| `auth.signIn` | ✏️ mutation | ❌ public | - |
| `auth.signUp` | ✏️ mutation | ❌ public | - |
| `auth.getSession` | 🔍 query | ❌ public | - |
| `auth.getMe` | 🔍 query | ✅ protected | - |
| `auth.debugUserData` | 🔍 query | ✅ protected | - |
| `auth.socialSignIn` | ✏️ mutation | ❌ public | - |
| `auth.completeProfile` | ✏️ mutation | ✅ protected | - |
| `auth.updateProfile` | ✏️ mutation | ✅ protected | - |
| `auth.signOut` | ✏️ mutation | ✅ protected | - |
| `auth.checkEmail` | 🔍 query | ❌ public | - |
| `auth.enableTwoFactor` | ✏️ mutation | ✅ protected | - |
| `auth.verifyTwoFactor` | ✏️ mutation | ✅ protected | - |
| `auth.getAuditLogs` | 🔍 query | ✅ admin | - |
| `auth.forcePasswordReset` | ✏️ mutation | ✅ admin | - |
| `auth.getActiveSessions` | 🔍 query | ✅ protected | - |
| `auth.revokeSession` | ✏️ mutation | ✅ protected | - |
| `auth.updateUserRole` | ✏️ mutation | ✅ admin | - |
| `auth.checkEmailExists` | ✏️ mutation | ❌ public | - |
| `auth.changePassword` | ✏️ mutation | ✅ protected | - |
| `auth.getTwoFactorStatus` | 🔍 query | ✅ protected | - |
| `auth.sendMagicLink` | ✏️ mutation | ✅ protected | - |
| `auth.enableTwoFactor` | ✏️ mutation | ✅ protected | - |
| `auth.disableTwoFactor` | ✏️ mutation | ✅ protected | - |
| `auth.selectHospital` | ✏️ mutation | ✅ protected | - |


## Legend

- 🔍 Query: Read data
- ✏️ Mutation: Create/Update/Delete data
- 📡 Subscription: Real-time updates
- ✅ Auth Required
- ❌ Public Route

## Usage Example

```ts
import { api } from '@/lib/api/trpc';

// Query example
const { data } = api.healthcare.getAlerts.useQuery();

// Mutation example
const mutation = api.healthcare.createAlert.useMutation();
await mutation.mutateAsync({ 
  roomNumber: 'A301',
  urgencyLevel: 4 
});
```

For detailed route documentation, see [tRPC Routes Documentation](/docs/api/trpc-routes.md).
