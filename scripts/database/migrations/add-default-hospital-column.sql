-- Add default_hospital_id column to user table if it doesn't exist
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS "default_hospital_id" text;

-- Add foreign key constraint
ALTER TABLE "user"
ADD CONSTRAINT "user_default_hospital_id_fkey" 
FOREIGN KEY ("default_hospital_id") 
REFERENCES "hospitals"("id") 
ON DELETE SET NULL;