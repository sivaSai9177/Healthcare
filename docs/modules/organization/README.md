# Organization Module

The multi-tenant organization management module supporting healthcare facilities, departments, and team structures with role-based access control.

## Overview

The Organization module provides comprehensive multi-tenant support, allowing healthcare facilities to manage multiple hospitals, departments, teams, and user permissions within a single platform.

### Key Features
- 🏢 **Multi-Organization Support**: Manage multiple healthcare organizations
- 🏥 **Hospital Management**: Multiple hospitals per organization
- 👥 **Team Structure**: Departments, teams, and hierarchies
- 🎭 **Role Management**: Flexible role-based permissions
- 📧 **Invitation System**: Email-based user onboarding
- 💳 **Billing Integration**: Subscription and usage tracking
- 📊 **Analytics Dashboard**: Organization-wide insights
- 🔄 **Member Management**: Add, remove, update team members

## Architecture

```
organization/
├── components/          # UI components
│   ├── OrganizationSwitcher.tsx
│   ├── MemberList.tsx
│   ├── InviteModal.tsx
│   ├── BillingSettings.tsx
│   └── OrganizationSettings.tsx
├── hooks/              # Business logic
│   ├── useOrganization.ts
│   ├── useMembers.ts
│   ├── useBilling.ts
│   └── useOrganizationPermissions.ts
├── services/           # Backend services
│   ├── organizationService.ts
│   ├── invitationService.ts
│   └── billingService.ts
└── types/              # TypeScript types
    └── organization.ts
```

## API Reference

### Organization Management

#### Create Organization
```ts
api.organization.create.mutate({
  name: 'City General Hospital',
  type: 'healthcare_provider',
  settings: {
    timezone: 'America/New_York',
    primaryContact: 'admin@citygeneral.com',
  },
});
```

#### Update Organization
```ts
api.organization.update.mutate({
  id: 'org-123',
  name: 'City General Medical Center',
  settings: {
    alertEscalationEnabled: true,
    maxAlertDuration: 3600, // 1 hour
  },
});
```

#### List User Organizations
```ts
const { data: organizations } = api.organization.getUserOrganizations.useQuery();

// Switch active organization
api.organization.setActive.mutate({
  organizationId: 'org-456',
});
```

### Hospital Management

#### Add Hospital
```ts
api.organization.addHospital.mutate({
  organizationId: 'org-123',
  name: 'North Campus',
  address: '123 Medical Drive',
  departments: [
    'emergency',
    'cardiology',
    'pediatrics',
  ],
});
```

#### List Hospitals
```ts
const { data: hospitals } = api.organization.getHospitals.useQuery({
  organizationId: 'org-123',
});
```

### Member Management

#### Invite Member
```ts
api.organization.inviteMember.mutate({
  email: 'doctor@example.com',
  role: 'doctor',
  hospitalId: 'hosp-123',
  department: 'cardiology',
  permissions: ['alerts:acknowledge', 'patients:view'],
});
```

#### Update Member Role
```ts
api.organization.updateMemberRole.mutate({
  memberId: 'member-123',
  role: 'manager',
  permissions: ['team:manage', 'analytics:view'],
});
```

#### Remove Member
```ts
api.organization.removeMember.mutate({
  memberId: 'member-123',
  transferTasksTo: 'member-456', // Optional
});
```

## Usage Examples

### Organization Switcher
```tsx
import { OrganizationSwitcher } from '@/components/blocks/organization';

export function Header() {
  return (
    <View className="flex-row items-center p-4">
      <OrganizationSwitcher />
      <UserMenu />
    </View>
  );
}
```

### Member Management
```tsx
import { useMemberManagement } from '@/hooks/organization';

export function TeamPage() {
  const { 
    members, 
    inviteMember, 
    updateRole, 
    removeMember 
  } = useMemberManagement();

  return (
    <MemberList
      members={members}
      onInvite={inviteMember}
      onRoleChange={updateRole}
      onRemove={removeMember}
    />
  );
}
```

### Hospital Context
```tsx
import { useHospitalContext } from '@/hooks/organization';

export function HospitalDashboard() {
  const { 
    currentHospital, 
    hospitals, 
    switchHospital 
  } = useHospitalContext();

  return (
    <View>
      <Picker
        selectedValue={currentHospital.id}
        onValueChange={switchHospital}
      >
        {hospitals.map(hospital => (
          <Picker.Item 
            key={hospital.id}
            label={hospital.name} 
            value={hospital.id} 
          />
        ))}
      </Picker>
      <HospitalMetrics hospitalId={currentHospital.id} />
    </View>
  );
}
```

## Organization Structure

### Hierarchy
```
Organization
├── Hospitals
│   ├── Departments
│   │   ├── Teams
│   │   └── Staff Members
│   └── Direct Staff
└── Organization Admins
```

### Role Hierarchy
1. **Organization Admin**: Full access
2. **Hospital Admin**: Hospital-wide access
3. **Department Manager**: Department access
4. **Team Lead**: Team management
5. **Staff Member**: Basic access

## Permissions System

### Permission Categories
```ts
const permissionCategories = {
  organization: [
    'organization:manage',
    'organization:billing',
    'organization:settings',
  ],
  hospital: [
    'hospital:manage',
    'hospital:view_analytics',
    'hospital:manage_staff',
  ],
  team: [
    'team:manage',
    'team:view_metrics',
    'team:assign_tasks',
  ],
  member: [
    'member:invite',
    'member:remove',
    'member:update_role',
  ],
};
```

### Role Templates
```ts
const roleTemplates = {
  orgAdmin: {
    name: 'Organization Administrator',
    permissions: ['*'], // All permissions
  },
  hospitalAdmin: {
    name: 'Hospital Administrator',
    permissions: [
      'hospital:*',
      'team:*',
      'member:invite',
    ],
  },
  manager: {
    name: 'Department Manager',
    permissions: [
      'team:manage',
      'team:view_metrics',
      'alerts:manage',
    ],
  },
};
```

## Billing Integration

### Subscription Plans
```ts
const plans = {
  starter: {
    name: 'Starter',
    price: 299,
    limits: {
      hospitals: 1,
      members: 50,
      alertsPerMonth: 1000,
    },
  },
  professional: {
    name: 'Professional',
    price: 999,
    limits: {
      hospitals: 5,
      members: 200,
      alertsPerMonth: 10000,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 'custom',
    limits: {
      hospitals: 'unlimited',
      members: 'unlimited',
      alertsPerMonth: 'unlimited',
    },
  },
};
```

### Usage Tracking
```ts
const { data: usage } = api.organization.getUsage.useQuery({
  organizationId: 'org-123',
  period: 'current_month',
});

// Returns:
{
  members: 45,
  hospitals: 2,
  alertsCreated: 892,
  storageUsedGB: 12.5,
  apiCalls: 45000,
}
```

## Settings Management

### Organization Settings
```ts
interface OrganizationSettings {
  // General
  name: string;
  logo?: string;
  timezone: string;
  
  // Notifications
  alertChannels: ('email' | 'sms' | 'push')[];
  escalationEnabled: boolean;
  escalationTiers: number;
  
  // Security
  twoFactorRequired: boolean;
  sessionTimeout: number;
  ipWhitelist?: string[];
  
  // Integrations
  webhookUrl?: string;
  apiKeys: ApiKey[];
}
```

### Update Settings
```tsx
import { OrganizationSettings } from '@/components/blocks/organization';

export function SettingsPage() {
  return (
    <OrganizationSettings
      sections={[
        'general',
        'notifications',
        'security',
        'billing',
        'integrations',
      ]}
    />
  );
}
```

## Analytics & Reporting

### Organization Metrics
```ts
const { data: metrics } = api.organization.getMetrics.useQuery({
  organizationId: 'org-123',
  dateRange: 'last_30_days',
});

// Returns comprehensive metrics
{
  alerts: {
    total: 1250,
    resolved: 1180,
    avgResponseTime: 4.5, // minutes
  },
  members: {
    total: 85,
    active: 78,
    byRole: {
      doctor: 25,
      nurse: 40,
      operator: 10,
      admin: 10,
    },
  },
  performance: {
    uptime: 99.9,
    avgApiResponseTime: 120, // ms
  },
}
```

### Export Reports
```ts
api.organization.exportReport.mutate({
  type: 'monthly_summary',
  format: 'pdf',
  email: 'admin@hospital.com',
});
```

## Multi-Tenant Architecture

### Data Isolation
- Row-level security in PostgreSQL
- Organization ID required for all queries
- Automatic filtering based on user context

### Performance Optimization
- Organization-specific caching
- Lazy loading of related data
- Indexed queries on organization_id

## Testing

### Unit Tests
```bash
bun run test:organization:unit
```

### Integration Tests
```bash
bun run test:organization:integration
```

### Test Organization Setup
```ts
// Create test organization with data
const testOrg = await createTestOrganization({
  hospitals: 2,
  members: 10,
  mockData: true,
});
```

## Common Issues

### Member Can't Access Features
1. Check role permissions
2. Verify hospital assignment
3. Check organization active status

### Invitation Not Received
1. Check email service configuration
2. Verify email address
3. Check spam folder
4. Resend invitation

### Billing Issues
1. Verify payment method
2. Check subscription status
3. Review usage limits

## Migration Guide

### From Single-Tenant
```ts
// 1. Add organization_id to all tables
ALTER TABLE users ADD COLUMN organization_id TEXT;

// 2. Create default organization
INSERT INTO organizations (name, type) 
VALUES ('Default Organization', 'healthcare_provider');

// 3. Assign existing users
UPDATE users SET organization_id = 'default-org-id';
```

### Permission Migration
```ts
// Map old roles to new permissions
const roleMapping = {
  'admin': ['organization:*'],
  'manager': ['hospital:manage', 'team:*'],
  'user': ['alerts:view', 'patients:view'],
};
```

## Best Practices

### Organization Setup
1. Define clear role hierarchies
2. Set up departments before inviting users
3. Configure notification preferences
4. Enable 2FA for admins

### Member Management
1. Use bulk invitations for teams
2. Set expiration on invitations
3. Regularly audit permissions
4. Archive inactive members

### Performance
1. Limit organization switches
2. Cache organization data
3. Use pagination for member lists
4. Optimize permission checks

## Future Enhancements

1. **Federation**: Cross-organization collaboration
2. **Advanced RBAC**: Attribute-based access control
3. **Audit Logs**: Comprehensive activity tracking
4. **Custom Roles**: User-defined permission sets
5. **API Access**: Organization-level API keys

---

For more details, see:
- [API Documentation](../../api/organization-api.md)
- [Security Guide](../../guides/security.md)
- [Multi-Tenant Guide](../../guides/multi-tenant.md)