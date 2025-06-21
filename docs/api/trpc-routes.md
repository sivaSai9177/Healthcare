# tRPC API Routes Documentation

Complete reference for all tRPC routes in the Healthcare Alert System.

## Overview

The API is built using tRPC v11 with Zod validation, providing type-safe APIs through Expo's built-in API routes. There is no separate Node.js server - everything runs through Expo API routes.

### Base URL
- Development: `http://localhost:8081/api/trpc`
- Production: `https://your-app.com/api/trpc`

### Architecture
- **tRPC v11**: Type-safe API layer
- **Expo API Routes**: Built-in server functionality (no separate Node.js)
- **Better Auth v1.2.8**: Authentication system
- **Drizzle ORM**: Database access
- **WebSocket**: Real-time updates via Docker container

### Authentication
All protected routes require a valid session from Better Auth:
- Session cookies are automatically sent
- OAuth providers: Google, GitHub
- Email/password authentication

## Route Categories

1. [Authentication Routes](#authentication-routes)
2. [Healthcare Routes](#healthcare-routes)
3. [Organization Routes](#organization-routes)
4. [User Routes](#user-routes)
5. [Patient Routes](#patient-routes)
6. [Admin Routes](#admin-routes)
7. [Notification Routes](#notification-routes)
8. [System Routes](#system-routes)

---

## Authentication Routes

### `auth.session`
Get current user session with hospital context.

**Type**: Query  
**Auth**: Optional  
**Input**: None  

**Response**:
```ts
{
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  hospitalContext?: {
    userId: string;
    userRole: 'admin' | 'manager' | 'doctor' | 'nurse' | 'operator';
    userOrganizationId: string;
    userHospitalId?: string;
    currentHospitalId?: string;
    permissions: string[];
  };
}
```

### `auth.completeHealthcareProfile`
Complete healthcare-specific profile after OAuth registration.

**Type**: Mutation  
**Auth**: Required  
**Input**:
```ts
{
  role: 'doctor' | 'nurse' | 'operator';
  hospitalId: string;
  department?: string;
  licenseNumber?: string;
  phoneNumber?: string;
  specialization?: string;
}
```

**Response**:
```ts
{
  success: boolean;
  user: User;
  hospitalContext: HospitalContext;
}
```

### `auth.resendVerificationEmail`
Resend email verification link.

**Type**: Mutation  
**Auth**: Required  
**Input**: None  

**Response**:
```ts
{
  success: boolean;
  message: string;
}
```

### `auth.updateHospitalContext`
Update current hospital context for multi-hospital users.

**Type**: Mutation  
**Auth**: Required  
**Input**:
```ts
{
  hospitalId: string;
}
```

**Response**:
```ts
{
  success: boolean;
  hospitalContext: HospitalContext;
}
```

---

## Healthcare Routes

### `healthcare.createAlert`
Create a new healthcare alert. Requires operator or admin role.

**Type**: Mutation  
**Auth**: Required (Operator/Admin only)  
**Input**:
```ts
{
  roomNumber: string;
  alertType: 'medical_emergency' | 'assistance_needed' | 'medication_request' | 'fall_detected' | 'pain_management' | 'bathroom_assistance' | 'meal_assistance' | 'other';
  urgencyLevel: 1 | 2 | 3 | 4 | 5;
  description?: string;
  patientId?: string;
}
```

**Response**:
```ts
{
  id: string;
  hospitalId: string;
  roomNumber: string;
  alertType: string;
  urgencyLevel: number;
  description?: string;
  status: 'active';
  createdBy: string;
  createdAt: Date;
  escalationTier: number;
  nextEscalationAt: Date;
}
```

### `healthcare.getAlerts`
Get alerts for current hospital with filtering and pagination.

**Type**: Query  
**Auth**: Required  
**Input**:
```ts
{
  status?: 'active' | 'acknowledged' | 'resolved' | 'escalated';
  urgencyLevel?: number;
  assignedToMe?: boolean;
  limit?: number; // Default: 20
  offset?: number; // Default: 0
  sortBy?: 'createdAt' | 'urgencyLevel' | 'status';
  sortOrder?: 'asc' | 'desc';
}
```

**Response**:
```ts
{
  alerts: Array<{
    id: string;
    hospitalId: string;
    roomNumber: string;
    alertType: string;
    urgencyLevel: number;
    description?: string;
    status: string;
    createdBy: string;
    createdAt: Date;
    escalationTier: number;
    nextEscalationAt?: Date;
    creator?: {
      id: string;
      name: string;
      email: string;
    };
    acknowledgedBy?: {
      id: string;
      name: string;
      role: string;
    };
    acknowledgments: Array<{
      id: string;
      userId: string;
      notes?: string;
      acknowledgedAt: Date;
    }>;
  }>;
  total: number;
  hasMore: boolean;
}
```

### `healthcare.acknowledgeAlert`
Acknowledge an alert. Requires healthcare role (doctor/nurse/admin).

**Type**: Mutation  
**Auth**: Required (Doctor/Nurse/Admin only)  
**Input**:
```ts
{
  alertId: string;
  notes?: string;
}
```

**Response**:
```ts
{
  id: string; // Acknowledgment ID
  alertId: string;
  userId: string;
  notes?: string;
  acknowledgedAt: Date;
  alert: Alert; // Updated alert object
}
```

### `healthcare.resolveAlert`
Resolve/close an alert. Requires healthcare role.

**Type**: Mutation  
**Auth**: Required (Doctor/Nurse/Admin only)  
**Input**:
```ts
{
  alertId: string;
  resolution: string;
  followUpRequired?: boolean;
}
```

**Response**:
```ts
{
  success: boolean;
  alert: Alert;
}
```

### `healthcare.updateAlertStatus`
Update alert status (for admin).

**Type**: Mutation  
**Auth**: Required (Admin only)  
**Input**:
```ts
{
  alertId: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'escalated';
  notes?: string;
}
```

**Response**:
```ts
{
  success: boolean;
  alert: Alert;
}
```

### `healthcare.toggleOnDuty`
Toggle on/off duty status.

**Type**: Mutation  
**Auth**: Required  
**Input**:
```ts
{
  status: boolean;
}
```

**Response**:
```ts
{
  success: boolean;
  isOnDuty: boolean;
  shiftStartedAt?: Date;
}
```

### `healthcare.getOnDutyStaff`
Get currently on-duty staff for hospital.

**Type**: Query  
**Auth**: Required  
**Input**: None  

**Response**:
```ts
{
  staff: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    isOnDuty: boolean;
    shiftStartedAt?: Date;
  }>;
  byRole: {
    doctors: number;
    nurses: number;
    operators: number;
  };
}
```

### `healthcare.getShiftStatus`
Get current user's shift information.

**Type**: Query  
**Auth**: Required  
**Input**: None  

**Response**:
```ts
{
  isOnDuty: boolean;
  shiftStartedAt?: Date;
  alertsHandled: number;
  activeAlerts: number;
  avgResponseTime?: number;
}
```

### `healthcare.endShift`
End shift with handover notes.

**Type**: Mutation  
**Auth**: Required  
**Input**:
```ts
{
  handoverNotes?: string;
  criticalAlerts?: string[];
}
```

**Response**:
```ts
{
  success: boolean;
  shiftSummary: {
    duration: number; // Minutes
    alertsHandled: number;
    avgResponseTime: number; // Minutes
  };
}
```

### `healthcare.getMetrics`
Get healthcare metrics and analytics.

**Type**: Query  
**Auth**: Required  
**Input**:
```ts
{
  period?: 'today' | 'week' | 'month'; // Default: 'today'
  hospitalId?: string; // Admin only
}
```

**Response**:
```ts
{
  totalAlerts: number;
  activeAlerts: number;
  avgResponseTime: number; // Minutes
  avgResolutionTime: number; // Minutes
  alertsByType: Record<string, number>;
  alertsByUrgency: Record<number, number>;
  alertsByHour: Array<{ hour: number; count: number }>;
  topRooms: Array<{ room: string; count: number }>;
  escalationRate: number; // Percentage
}
```

### `healthcare.getHospitals`
Get hospitals for current organization.

**Type**: Query  
**Auth**: Required  
**Input**:
```ts
{
  organizationId: string;
}
```

**Response**:
```ts
{
  hospitals: Array<{
    id: string;
    name: string;
    organizationId: string;
    address?: string;
    phone?: string;
    isDefault: boolean;
    createdAt: Date;
  }>;
  defaultHospitalId?: string;
}
```

### `healthcare.subscribeToAlerts`
Subscribe to real-time alert updates (WebSocket).

**Type**: Subscription  
**Auth**: Required  
**Input**: None  

**Events**:
```ts
// New alert created
{
  type: 'alert:new';
  alert: Alert;
}

// Alert updated
{
  type: 'alert:updated';
  alert: Alert;
}

// Alert escalated
{
  type: 'alert:escalated';
  alertId: string;
  tier: number;
}
```

---

## Organization Routes

### `organization.create`
Create a new organization (admin only).

**Type**: Mutation  
**Auth**: Required (Admin)  
**Input**:
```ts
{
  name: string;
  type: 'healthcare' | 'clinic' | 'hospital_network';
  email?: string;
  phone?: string;
  address?: string;
  settings?: {
    timezone?: string;
    primaryLanguage?: string;
  };
}
```

**Response**:
```ts
{
  id: string;
  name: string;
  type: string;
  createdAt: Date;
}
```

### `organization.getUserOrganizations`
Get all organizations for current user.

**Type**: Query  
**Auth**: Required  
**Input**: None  

**Response**:
```ts
{
  organizations: Array<{
    id: string;
    name: string;
    type: string;
    userRole: string;
    isActive: boolean;
    memberCount: number;
    hospitalCount: number;
  }>;
  currentOrganizationId?: string;
}
```

### `organization.inviteMember`
Invite new member to organization.

**Type**: Mutation  
**Auth**: Required (Admin/Manager)  
**Input**:
```ts
{
  email: string;
  role: 'doctor' | 'nurse' | 'operator' | 'manager';
  hospitalId?: string;
  department?: string;
  message?: string;
}
```

**Response**:
```ts
{
  success: boolean;
  invitation: {
    id: string;
    email: string;
    role: string;
    expiresAt: Date;
  };
}
```

### `organization.getMembers`
Get organization members with pagination.

**Type**: Query  
**Auth**: Required  
**Input**:
```ts
{
  search?: string;
  role?: string;
  hospitalId?: string;
  isOnDuty?: boolean;
  limit?: number; // Default: 50
  offset?: number; // Default: 0
}
```

**Response**:
```ts
{
  members: Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    hospitalId?: string;
    department?: string;
    isOnDuty: boolean;
    joinedAt: Date;
    lastActiveAt?: Date;
  }>;
  total: number;
  hasMore: boolean;
}
```

### `organization.updateMember`
Update member details.

**Type**: Mutation  
**Auth**: Required (Admin/Manager)  
**Input**:
```ts
{
  userId: string;
  role?: string;
  hospitalId?: string;
  department?: string;
  isActive?: boolean;
}
```

**Response**:
```ts
{
  success: boolean;
  member: Member;
}
```

### `organization.removeMember`
Remove member from organization.

**Type**: Mutation  
**Auth**: Required (Admin)  
**Input**:
```ts
{
  userId: string;
  reassignAlertsTo?: string;
}
```

**Response**:
```ts
{
  success: boolean;
  reassignedAlerts?: number;
}
```

---

## User Routes

### `user.getProfile`
Get current user profile with healthcare details.

**Type**: Query  
**Auth**: Required  
**Input**: None  

**Response**:
```ts
{
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
    emailVerified: boolean;
  };
  healthcareProfile?: {
    role: string;
    hospitalId: string;
    department?: string;
    licenseNumber?: string;
    specialization?: string;
    phoneNumber?: string;
  };
  preferences: {
    notifications: boolean;
    emailAlerts: boolean;
    pushAlerts: boolean;
    theme: 'light' | 'dark' | 'system';
  };
}
```

### `user.updateProfile`
Update user profile.

**Type**: Mutation  
**Auth**: Required  
**Input**:
```ts
{
  name?: string;
  phoneNumber?: string;
  department?: string;
  specialization?: string;
}
```

**Response**:
```ts
{
  success: boolean;
  user: User;
}
```

### `user.updatePreferences`
Update user preferences.

**Type**: Mutation  
**Auth**: Required  
**Input**:
```ts
{
  notifications?: boolean;
  emailAlerts?: boolean;
  pushAlerts?: boolean;
  theme?: 'light' | 'dark' | 'system';
  alertSound?: boolean;
  vibration?: boolean;
}
```

**Response**:
```ts
{
  success: boolean;
  preferences: UserPreferences;
}
```

### `user.getActivityLog`
Get user activity log.

**Type**: Query  
**Auth**: Required  
**Input**:
```ts
{
  limit?: number; // Default: 50
  offset?: number; // Default: 0
  dateFrom?: Date;
  dateTo?: Date;
}
```

**Response**:
```ts
{
  activities: Array<{
    id: string;
    action: string;
    details?: any;
    timestamp: Date;
    ipAddress?: string;
  }>;
  total: number;
}
```

---

## Patient Routes

### `patient.create`
Create a new patient record.

**Type**: Mutation  
**Auth**: Required (Healthcare role)  
**Input**:
```ts
{
  name: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  roomNumber?: string;
  admissionDate?: Date;
  medicalRecordNumber?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}
```

**Response**:
```ts
{
  id: string;
  hospitalId: string;
  name: string;
  medicalRecordNumber: string;
  createdAt: Date;
}
```

### `patient.get`
Get patient details.

**Type**: Query  
**Auth**: Required (Healthcare role)  
**Input**:
```ts
{
  patientId: string;
}
```

**Response**:
```ts
{
  id: string;
  name: string;
  dateOfBirth: Date;
  gender: string;
  roomNumber?: string;
  admissionDate?: Date;
  medicalRecordNumber: string;
  emergencyContact?: EmergencyContact;
  alerts: Alert[]; // Recent alerts
  assignedDoctor?: User;
  assignedNurse?: User;
}
```

### `patient.update`
Update patient information.

**Type**: Mutation  
**Auth**: Required (Healthcare role)  
**Input**:
```ts
{
  patientId: string;
  roomNumber?: string;
  assignedDoctorId?: string;
  assignedNurseId?: string;
  dischargeDate?: Date;
  notes?: string;
}
```

**Response**:
```ts
{
  success: boolean;
  patient: Patient;
}
```

### `patient.search`
Search patients.

**Type**: Query  
**Auth**: Required (Healthcare role)  
**Input**:
```ts
{
  query: string; // Name or MRN
  roomNumber?: string;
  includeDischarge?: boolean;
  limit?: number;
}
```

**Response**:
```ts
{
  patients: Patient[];
  total: number;
}
```

---

## Admin Routes

### `admin.getDashboardStats`
Get admin dashboard statistics.

**Type**: Query  
**Auth**: Required (Admin)  
**Input**: None  

**Response**:
```ts
{
  organizations: {
    total: number;
    active: number;
  };
  users: {
    total: number;
    byRole: Record<string, number>;
    activeToday: number;
  };
  alerts: {
    totalToday: number;
    avgResponseTime: number;
    escalationRate: number;
  };
  system: {
    uptime: number;
    apiCalls: number;
    errorRate: number;
  };
}
```

### `admin.getSystemLogs`
Get system audit logs.

**Type**: Query  
**Auth**: Required (Admin)  
**Input**:
```ts
{
  level?: 'info' | 'warn' | 'error';
  category?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}
```

**Response**:
```ts
{
  logs: Array<{
    id: string;
    level: string;
    category: string;
    message: string;
    metadata?: any;
    userId?: string;
    timestamp: Date;
  }>;
  total: number;
}
```

### `admin.updateUserRole`
Update user role (admin only).

**Type**: Mutation  
**Auth**: Required (Admin)  
**Input**:
```ts
{
  userId: string;
  role: 'admin' | 'manager' | 'doctor' | 'nurse' | 'operator';
}
```

**Response**:
```ts
{
  success: boolean;
  user: User;
}
```

---

## Notification Routes

### `notification.getNotifications`
Get user notifications.

**Type**: Query  
**Auth**: Required  
**Input**:
```ts
{
  unreadOnly?: boolean;
  type?: 'alert' | 'system' | 'shift';
  limit?: number; // Default: 20
  offset?: number; // Default: 0
}
```

**Response**:
```ts
{
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    read: boolean;
    createdAt: Date;
  }>;
  unreadCount: number;
  total: number;
}
```

### `notification.markAsRead`
Mark notification as read.

**Type**: Mutation  
**Auth**: Required  
**Input**:
```ts
{
  notificationId: string;
}
```

**Response**:
```ts
{
  success: boolean;
}
```

### `notification.markAllAsRead`
Mark all notifications as read.

**Type**: Mutation  
**Auth**: Required  
**Input**: None  

**Response**:
```ts
{
  success: boolean;
  updatedCount: number;
}
```

### `notification.updatePushToken`
Update push notification token.

**Type**: Mutation  
**Auth**: Required  
**Input**:
```ts
{
  token: string;
  platform: 'ios' | 'android';
}
```

**Response**:
```ts
{
  success: boolean;
}
```

---

## System Routes

### `system.health`
Check API health status.

**Type**: Query  
**Auth**: None  
**Input**: None  

**Response**:
```ts
{
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: Date;
  services: {
    database: boolean;
    redis: boolean;
    websocket: boolean;
    email: boolean;
  };
}
```

### `system.config`
Get public system configuration.

**Type**: Query  
**Auth**: None  
**Input**: None  

**Response**:
```ts
{
  features: {
    registration: boolean;
    oauth: {
      google: boolean;
      github: boolean;
    };
    pushNotifications: boolean;
    emailNotifications: boolean;
  };
  version: string;
  environment: string;
  maintenanceMode: boolean;
}
```

## Error Handling

All routes follow consistent error handling with tRPC error codes:

```ts
// Error response format
TRPCError {
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'BAD_REQUEST' | 
        'INTERNAL_SERVER_ERROR' | 'PRECONDITION_FAILED' | 'TIMEOUT';
  message: string;
  cause?: any;
}
```

### Common Error Scenarios
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions for the operation
- `NOT_FOUND`: Resource not found
- `BAD_REQUEST`: Invalid input or validation error
- `PRECONDITION_FAILED`: Business logic validation failed

## Rate Limiting

API routes are rate limited per operation:
- Authentication endpoints: 5 requests per minute
- General API: 100 requests per minute per user
- Public endpoints: 20 requests per minute per IP

## WebSocket Connection

Real-time updates are available via WebSocket running in Docker:

```ts
// Connection URL
ws://localhost:3002

// Authentication
socket.auth = { token: sessionToken };

// Subscribe to hospital alerts
socket.emit('subscribe:hospital', hospitalId);

// Listen for events
socket.on('alert:new', (alert) => { });
socket.on('alert:updated', (alert) => { });
socket.on('alert:escalated', ({ alertId, tier }) => { });
socket.on('staff:duty_changed', ({ userId, isOnDuty }) => { });
```

## Type Safety

All routes are fully type-safe. Import types from:

```ts
import type { AppRouter } from '@/src/server/routers';
import { api } from '@/lib/api/trpc';

// Use with full type inference
const { data } = api.healthcare.getAlerts.useQuery({
  status: 'active',
  limit: 10
});
```

---

For implementation details, see:
- [Backend Architecture](../modules/BACKEND_ARCHITECTURE.md)
- [Authentication Guide](../guides/authentication.md)
- [WebSocket Guide](../guides/websocket.md)