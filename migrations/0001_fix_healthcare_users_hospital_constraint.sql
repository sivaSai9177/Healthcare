-- Migration: Fix healthcare_users hospital_id constraint
-- This migration removes the NOT NULL constraint on hospital_id to allow
-- healthcare users to be created before hospital assignment

-- Make hospital_id nullable in healthcare_users table
ALTER TABLE healthcare_users 
ALTER COLUMN hospital_id DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN healthcare_users.hospital_id IS 'Hospital assignment for healthcare user. Can be NULL during initial profile creation.';

-- Create an index to find healthcare users without hospital assignment
CREATE INDEX idx_healthcare_users_without_hospital 
ON healthcare_users(user_id) 
WHERE hospital_id IS NULL;