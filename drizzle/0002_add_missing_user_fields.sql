-- Add missing fields required by PRD
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "license_number" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "availability_status" text DEFAULT 'available';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "contact_preferences" jsonb DEFAULT '{"email": true, "push": true, "sms": false}';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "profile_photo_url" text;

-- Add index for license number lookup
CREATE INDEX IF NOT EXISTS "user_license_number_idx" ON "user" ("license_number");

-- Add index for availability status filtering
CREATE INDEX IF NOT EXISTS "user_availability_status_idx" ON "user" ("availability_status");