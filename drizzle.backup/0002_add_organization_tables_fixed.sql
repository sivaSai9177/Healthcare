-- Add organization tables (Fixed for text user IDs)

-- Organizations table
CREATE TABLE organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  type VARCHAR(50) NOT NULL,
  size VARCHAR(50) NOT NULL,
  industry VARCHAR(100),
  website VARCHAR(255),
  description TEXT,
  logo TEXT,
  
  -- Contact information
  email VARCHAR(254),
  phone VARCHAR(50),
  address TEXT,
  
  -- Localization
  timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  country VARCHAR(2),
  
  -- Subscription/Plan information
  plan VARCHAR(50) NOT NULL DEFAULT 'free',
  plan_expires_at TIMESTAMP,
  trial_ends_at TIMESTAMP,
  
  -- Status and metadata
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  
  -- Audit fields (using TEXT to match user table)
  created_by TEXT REFERENCES "user"(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Organization members
CREATE TABLE organization_member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  
  -- Role within organization
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '[]',
  
  -- Member status
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  
  -- Invitation tracking
  invited_by TEXT REFERENCES "user"(id),
  invited_at TIMESTAMP,
  invite_token TEXT,
  invite_expires_at TIMESTAMP,
  
  -- Activity tracking
  joined_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP,
  
  -- Member preferences
  notification_preferences JSONB DEFAULT '{}',
  
  -- Audit
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Organization invitation codes
CREATE TABLE organization_code (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  
  code VARCHAR(12) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL DEFAULT 'general',
  
  -- Usage limits
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  
  -- Validity
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMP,
  
  -- Metadata
  created_by TEXT REFERENCES "user"(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Organization settings
CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organization(id) ON DELETE CASCADE,
  
  -- Security settings
  allow_guest_access BOOLEAN NOT NULL DEFAULT FALSE,
  require_2fa BOOLEAN NOT NULL DEFAULT FALSE,
  allowed_domains JSONB DEFAULT '[]',
  password_policy JSONB DEFAULT '{}',
  session_timeout INTEGER DEFAULT 30,
  
  -- Member management
  max_members INTEGER,
  auto_approve_members BOOLEAN NOT NULL DEFAULT FALSE,
  default_member_role VARCHAR(50) NOT NULL DEFAULT 'member',
  
  -- Feature flags
  features JSONB DEFAULT '{}',
  modules JSONB DEFAULT '{}',
  
  -- Notification preferences
  notification_email VARCHAR(254),
  notification_settings JSONB DEFAULT '{}',
  
  -- Branding
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  custom_css TEXT,
  
  -- Integrations
  integrations JSONB DEFAULT '{}',
  webhooks JSONB DEFAULT '[]',
  
  -- Audit
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by TEXT REFERENCES "user"(id)
);

-- Organization activity log
CREATE TABLE organization_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  
  -- Actor information
  actor_id TEXT REFERENCES "user"(id),
  actor_name VARCHAR(100),
  actor_email VARCHAR(254),
  actor_role VARCHAR(50),
  
  -- Action details
  action VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'info',
  
  -- Target information
  entity_type VARCHAR(50),
  entity_id UUID,
  entity_name VARCHAR(255),
  
  -- Change tracking
  changes JSONB DEFAULT '{}',
  previous_state JSONB,
  new_state JSONB,
  
  -- Additional context
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Organization invitations
CREATE TABLE organization_invitation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  
  -- Invitation details
  email VARCHAR(254) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  
  -- Metadata
  invited_by TEXT REFERENCES "user"(id),
  message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  accepted_by TEXT REFERENCES "user"(id)
);

-- Create indexes for performance
CREATE INDEX idx_organization_name ON organization(name);
CREATE UNIQUE INDEX idx_organization_slug ON organization(slug);
CREATE INDEX idx_organization_status ON organization(status);
CREATE INDEX idx_organization_created_at ON organization(created_at);

CREATE UNIQUE INDEX idx_unique_org_member ON organization_member(organization_id, user_id);
CREATE INDEX idx_member_org_id ON organization_member(organization_id);
CREATE INDEX idx_member_user_id ON organization_member(user_id);
CREATE INDEX idx_member_role ON organization_member(role);
CREATE INDEX idx_member_status ON organization_member(status);

CREATE UNIQUE INDEX idx_org_code ON organization_code(code);
CREATE INDEX idx_code_org_id ON organization_code(organization_id);
CREATE INDEX idx_code_active ON organization_code(is_active);

CREATE UNIQUE INDEX idx_settings_org_id ON organization_settings(organization_id);

CREATE INDEX idx_activity_org_id ON organization_activity_log(organization_id);
CREATE INDEX idx_activity_actor_id ON organization_activity_log(actor_id);
CREATE INDEX idx_activity_action ON organization_activity_log(action);
CREATE INDEX idx_activity_category ON organization_activity_log(category);
CREATE INDEX idx_activity_created_at ON organization_activity_log(created_at DESC);
CREATE INDEX idx_activity_org_created ON organization_activity_log(organization_id, created_at DESC);

CREATE UNIQUE INDEX idx_invitation_token ON organization_invitation(token);
CREATE INDEX idx_invitation_email ON organization_invitation(email);
CREATE INDEX idx_invitation_org_id ON organization_invitation(organization_id);
CREATE INDEX idx_invitation_status ON organization_invitation(status);