# Organization Management API Plan

## Overview
This document outlines the backend API endpoints needed for the organization management system. All endpoints will be implemented using tRPC for type-safe API calls.

## API Structure

### 1. Organization CRUD Operations

#### Create Organization
```typescript
// tRPC procedure: organization.create
input: {
  name: string;
  type: 'business' | 'nonprofit' | 'education' | 'personal';
  size: 'solo' | 'small' | 'medium' | 'large' | 'enterprise';
  industry: string;
  website?: string;
  timezone: string;
  language: string;
  currency: string;
  inviteEmails?: string[];
}
output: {
  organization: Organization;
  invitationsSent: number;
}
```

#### Get Organization
```typescript
// tRPC procedure: organization.get
input: {
  organizationId: string;
}
output: Organization;
```

#### Update Organization
```typescript
// tRPC procedure: organization.update
input: {
  organizationId: string;
  data: Partial<{
    name: string;
    industry: string;
    website: string;
    timezone: string;
    language: string;
    currency: string;
  }>;
}
output: Organization;
```

#### Delete Organization
```typescript
// tRPC procedure: organization.delete
input: {
  organizationId: string;
}
output: { success: boolean };
```

#### List User Organizations
```typescript
// tRPC procedure: organization.listUserOrganizations
input: {} // Uses session user ID
output: {
  organizations: Organization[];
  activeOrganizationId?: string;
}
```

### 2. Member Management

#### Get Organization Members
```typescript
// tRPC procedure: organization.getMembers
input: {
  organizationId: string;
  search?: string;
  role?: 'admin' | 'manager' | 'member' | 'guest';
  status?: 'active' | 'inactive' | 'pending';
  limit?: number;
  offset?: number;
}
output: {
  members: OrganizationMember[];
  total: number;
}
```

#### Invite Members
```typescript
// tRPC procedure: organization.inviteMembers
input: {
  organizationId: string;
  invitations: Array<{
    email: string;
    role: 'admin' | 'manager' | 'member' | 'guest';
  }>;
}
output: {
  sent: number;
  failed: Array<{ email: string; reason: string }>;
}
```

#### Update Member Role
```typescript
// tRPC procedure: organization.updateMemberRole
input: {
  organizationId: string;
  userId: string;
  role: 'admin' | 'manager' | 'member' | 'guest';
}
output: OrganizationMember;
```

#### Remove Member
```typescript
// tRPC procedure: organization.removeMember
input: {
  organizationId: string;
  userId: string;
}
output: { success: boolean };
```

### 3. Organization Settings

#### Get Settings
```typescript
// tRPC procedure: organization.getSettings
input: {
  organizationId: string;
}
output: OrganizationSettings;
```

#### Update Settings
```typescript
// tRPC procedure: organization.updateSettings
input: {
  organizationId: string;
  settings: Partial<OrganizationSettings>;
}
output: OrganizationSettings;
```

### 4. Organization Metrics & Analytics

#### Get Metrics
```typescript
// tRPC procedure: organization.getMetrics
input: {
  organizationId: string;
  metric: 'activity' | 'growth' | 'performance' | 'engagement';
  period?: 'day' | 'week' | 'month' | 'year';
}
output: {
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  unit?: string;
  history: Array<{ date: string; value: number }>;
}
```

#### Get Activity Log
```typescript
// tRPC procedure: organization.getActivityLog
input: {
  organizationId: string;
  limit?: number;
  offset?: number;
  actorId?: string;
  actionType?: string;
}
output: {
  activities: ActivityLogEntry[];
  total: number;
}
```

### 5. Organization Code System

#### Generate Organization Code
```typescript
// tRPC procedure: organization.generateCode
input: {
  organizationId: string;
}
output: {
  code: string;
  expiresAt?: Date;
}
```

#### Join by Code
```typescript
// tRPC procedure: organization.joinByCode
input: {
  code: string;
}
output: {
  organizationId: string;
  organization: Organization;
}
```

## Database Schema Updates

```sql
-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  size VARCHAR(50) NOT NULL,
  industry VARCHAR(100),
  website VARCHAR(255),
  timezone VARCHAR(100) NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Organization members table
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Organization codes table
CREATE TABLE organization_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR(12) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Organization settings table
CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  allow_guest_access BOOLEAN DEFAULT false,
  require_2fa BOOLEAN DEFAULT false,
  allowed_domains TEXT[],
  max_members INTEGER,
  features JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity log table
CREATE TABLE organization_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_codes_code ON organization_codes(code) WHERE is_active = true;
CREATE INDEX idx_org_activity_org_id ON organization_activity_log(organization_id);
CREATE INDEX idx_org_activity_created_at ON organization_activity_log(created_at DESC);
```

## Security Considerations

1. **Authorization**: All endpoints must check user's role within the organization
2. **Rate Limiting**: Implement rate limiting for creation and invitation endpoints
3. **Input Validation**: Use Zod schemas for all input validation
4. **Audit Logging**: Log all organization-level changes
5. **Data Isolation**: Ensure proper data isolation between organizations

## Implementation Order

1. **Phase 1**: Basic CRUD operations
   - Create, get, update organization
   - List user organizations

2. **Phase 2**: Member management
   - Get members, invite, update roles
   - Organization codes

3. **Phase 3**: Settings and configuration
   - Organization settings
   - Feature flags

4. **Phase 4**: Analytics and monitoring
   - Metrics endpoints
   - Activity logging

## Testing Strategy

1. Unit tests for each tRPC procedure
2. Integration tests for workflows
3. Authorization tests for role-based access
4. Performance tests for list endpoints
5. Security tests for data isolation