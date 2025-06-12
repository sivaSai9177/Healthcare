-- Add default value 'user' to role column
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user';

-- Update existing null roles to 'user'
UPDATE "user" SET "role" = 'user' WHERE "role" IS NULL;