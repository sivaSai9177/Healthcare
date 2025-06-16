-- Add soft delete to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS "user_preferences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
  "email_preferences" text, -- JSON object with email preferences
  "notification_preferences" text, -- JSON object with push notification preferences
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "user_preferences_user_id_idx" ON "user_preferences"("user_id");