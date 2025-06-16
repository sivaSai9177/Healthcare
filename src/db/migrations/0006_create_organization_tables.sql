-- Create organization tables
CREATE TABLE IF NOT EXISTS "organization" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" varchar(255) NOT NULL,
    "slug" varchar(255) UNIQUE,
    "type" varchar(50) NOT NULL,
    "size" varchar(50) NOT NULL,
    "industry" varchar(100),
    "website" varchar(255),
    "description" text,
    "logo" text,
    "email" varchar(254),
    "phone" varchar(50),
    "address" text,
    "timezone" varchar(100) NOT NULL DEFAULT 'UTC',
    "language" varchar(10) NOT NULL DEFAULT 'en',
    "currency" varchar(10) NOT NULL DEFAULT 'USD',
    "country" varchar(2),
    "plan" varchar(50) NOT NULL DEFAULT 'free',
    "plan_expires_at" timestamp,
    "trial_ends_at" timestamp,
    "status" varchar(50) NOT NULL DEFAULT 'active',
    "metadata" jsonb DEFAULT '{}',
    "created_by" text REFERENCES "user"("id"),
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    "deleted_at" timestamp
);

-- Create indexes for organization
CREATE INDEX IF NOT EXISTS "idx_organization_name" ON "organization"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_organization_slug" ON "organization"("slug");
CREATE INDEX IF NOT EXISTS "idx_organization_status" ON "organization"("status");
CREATE INDEX IF NOT EXISTS "idx_organization_created_at" ON "organization"("created_at");

-- Create organization members table
CREATE TABLE IF NOT EXISTS "organization_member" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "role" varchar(50) NOT NULL DEFAULT 'member',
    "permissions" jsonb DEFAULT '[]',
    "status" varchar(50) NOT NULL DEFAULT 'active',
    "invited_by" text REFERENCES "user"("id"),
    "invited_at" timestamp,
    "invite_token" text,
    "invite_expires_at" timestamp,
    "joined_at" timestamp DEFAULT now(),
    "last_active_at" timestamp,
    "notification_preferences" jsonb DEFAULT '{}',
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create indexes for organization_member
CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique_org_member" ON "organization_member"("organization_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_member_org_id" ON "organization_member"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_member_user_id" ON "organization_member"("user_id");
CREATE INDEX IF NOT EXISTS "idx_member_role" ON "organization_member"("role");
CREATE INDEX IF NOT EXISTS "idx_member_status" ON "organization_member"("status");

-- Create organization code table
CREATE TABLE IF NOT EXISTS "organization_code" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
    "code" varchar(12) NOT NULL UNIQUE,
    "type" varchar(50) NOT NULL DEFAULT 'general',
    "max_uses" integer,
    "current_uses" integer NOT NULL DEFAULT 0,
    "is_active" boolean NOT NULL DEFAULT true,
    "expires_at" timestamp,
    "created_by" text REFERENCES "user"("id"),
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create indexes for organization_code
CREATE UNIQUE INDEX IF NOT EXISTS "idx_org_code" ON "organization_code"("code");
CREATE INDEX IF NOT EXISTS "idx_code_org_id" ON "organization_code"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_code_active" ON "organization_code"("is_active");

-- Create organization settings table
CREATE TABLE IF NOT EXISTS "organization_settings" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL UNIQUE REFERENCES "organization"("id") ON DELETE CASCADE,
    "allow_guest_access" boolean NOT NULL DEFAULT false,
    "require_2fa" boolean NOT NULL DEFAULT false,
    "allowed_domains" jsonb DEFAULT '[]',
    "password_policy" jsonb DEFAULT '{}',
    "session_timeout" integer DEFAULT 30,
    "max_members" integer,
    "auto_approve_members" boolean NOT NULL DEFAULT false,
    "default_member_role" varchar(50) NOT NULL DEFAULT 'member',
    "features" jsonb DEFAULT '{}',
    "modules" jsonb DEFAULT '{}',
    "notification_email" varchar(254),
    "notification_settings" jsonb DEFAULT '{}',
    "primary_color" varchar(7),
    "secondary_color" varchar(7),
    "custom_css" text,
    "integrations" jsonb DEFAULT '{}',
    "webhooks" jsonb DEFAULT '[]',
    "updated_at" timestamp NOT NULL DEFAULT now(),
    "updated_by" text REFERENCES "user"("id")
);

-- Create index for organization_settings
CREATE UNIQUE INDEX IF NOT EXISTS "idx_settings_org_id" ON "organization_settings"("organization_id");

-- Create organization activity log table
CREATE TABLE IF NOT EXISTS "organization_activity_log" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
    "actor_id" text REFERENCES "user"("id"),
    "actor_name" varchar(100),
    "actor_email" varchar(254),
    "actor_role" varchar(50),
    "action" varchar(100) NOT NULL,
    "category" varchar(50) NOT NULL,
    "severity" varchar(20) NOT NULL DEFAULT 'info',
    "entity_type" varchar(50),
    "entity_id" uuid,
    "entity_name" varchar(255),
    "changes" jsonb DEFAULT '{}',
    "previous_state" jsonb,
    "new_state" jsonb,
    "metadata" jsonb DEFAULT '{}',
    "ip_address" varchar(45),
    "user_agent" text,
    "created_at" timestamp NOT NULL DEFAULT now()
);

-- Create indexes for organization_activity_log
CREATE INDEX IF NOT EXISTS "idx_activity_org_id" ON "organization_activity_log"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_activity_actor_id" ON "organization_activity_log"("actor_id");
CREATE INDEX IF NOT EXISTS "idx_activity_action" ON "organization_activity_log"("action");
CREATE INDEX IF NOT EXISTS "idx_activity_category" ON "organization_activity_log"("category");
CREATE INDEX IF NOT EXISTS "idx_activity_created_at" ON "organization_activity_log"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_activity_org_created" ON "organization_activity_log"("organization_id", "created_at" DESC);

-- Create organization invitation table
CREATE TABLE IF NOT EXISTS "organization_invitation" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
    "email" varchar(254) NOT NULL,
    "role" varchar(50) NOT NULL DEFAULT 'member',
    "token" text NOT NULL UNIQUE,
    "status" varchar(50) NOT NULL DEFAULT 'pending',
    "invited_by" text REFERENCES "user"("id"),
    "message" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "expires_at" timestamp NOT NULL,
    "accepted_at" timestamp,
    "accepted_by" text REFERENCES "user"("id")
);

-- Create indexes for organization_invitation
CREATE UNIQUE INDEX IF NOT EXISTS "idx_invitation_token" ON "organization_invitation"("token");
CREATE INDEX IF NOT EXISTS "idx_invitation_email" ON "organization_invitation"("email");
CREATE INDEX IF NOT EXISTS "idx_invitation_org_id" ON "organization_invitation"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_invitation_status" ON "organization_invitation"("status");