-- Create department enum type
CREATE TYPE department_type AS ENUM (
  -- Healthcare departments
  'emergency',
  'icu',
  'cardiology',
  'pediatrics',
  'surgery',
  'radiology',
  'pharmacy',
  'laboratory',
  'maternity',
  'oncology',
  'neurology',
  'orthopedics',
  'psychiatry',
  'general_medicine',
  
  -- Emergency/Dispatch departments
  'dispatch_center',
  'emergency_response',
  'fire_dispatch',
  'police_dispatch',
  'medical_dispatch',
  
  -- Administrative departments
  'administration',
  'human_resources',
  'finance',
  'it_support',
  'facilities',
  
  -- General departments
  'engineering',
  'marketing',
  'sales',
  'customer_service',
  'operations',
  'product',
  'research'
);

-- Update the users table to use the enum (if department column exists)
-- First, we need to temporarily rename the column to migrate the data
ALTER TABLE users 
  ALTER COLUMN department TYPE department_type 
  USING department::department_type;

-- Add index for better query performance
CREATE INDEX idx_users_department ON users(department);

-- Add department to healthcare_alerts table for better routing
ALTER TABLE healthcare_alerts 
  ADD COLUMN IF NOT EXISTS target_department department_type;

-- Add index for alert routing
CREATE INDEX idx_healthcare_alerts_target_department ON healthcare_alerts(target_department);

-- Update existing data (optional - map free text to enum values)
-- This is just an example, adjust based on your actual data
UPDATE users 
SET department = CASE 
  WHEN LOWER(department) LIKE '%emergency%' THEN 'emergency'::department_type
  WHEN LOWER(department) LIKE '%icu%' OR LOWER(department) LIKE '%intensive%' THEN 'icu'::department_type
  WHEN LOWER(department) LIKE '%cardio%' THEN 'cardiology'::department_type
  -- Add more mappings as needed
  ELSE department::department_type
END
WHERE department IS NOT NULL;