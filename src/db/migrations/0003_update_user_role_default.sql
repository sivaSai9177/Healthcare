-- Update the default role for new users to 'guest'
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'guest';

-- Update existing users who have 'user' role and needsProfileCompletion = true
-- These are likely OAuth users who need to complete their profile
UPDATE "user" 
SET role = 'guest' 
WHERE role = 'user' 
  AND needs_profile_completion = true
  AND organization_id IS NULL;