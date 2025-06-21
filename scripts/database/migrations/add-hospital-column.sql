-- Add default_hospital_id column to user table if it doesn't exist
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS default_hospital_id UUID;

-- Add comment to the column
COMMENT ON COLUMN "user".default_hospital_id IS 'Default hospital within the organization';