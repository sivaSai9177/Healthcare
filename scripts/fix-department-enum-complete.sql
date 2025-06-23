-- Fix department enum migration issue
-- This script temporarily converts enum columns to text, fixes values, then converts back

BEGIN;

-- 1. Convert enum columns to text temporarily
ALTER TABLE "user" ALTER COLUMN department TYPE text;
ALTER TABLE alerts ALTER COLUMN target_department TYPE text;

-- 2. Fix all capitalized and invalid department values in user table
UPDATE "user" SET department = LOWER(department) WHERE department IS NOT NULL;
UPDATE "user" SET department = 'it_support' WHERE department = 'system';
UPDATE "user" SET department = 'emergency' WHERE department = 'emergency medicine';

-- 3. Fix all capitalized and invalid department values in alerts table
UPDATE alerts SET target_department = LOWER(target_department) WHERE target_department IS NOT NULL;
UPDATE alerts SET target_department = 'it_support' WHERE target_department = 'system';
UPDATE alerts SET target_department = 'emergency' WHERE target_department = 'emergency medicine';

-- 4. Add 'system' to the department_type enum if needed
-- First drop the old enum type and recreate with all values
DROP TYPE IF EXISTS department_type CASCADE;

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
  'system',
  
  -- General departments
  'engineering',
  'marketing',
  'sales',
  'customer_service',
  'operations',
  'product',
  'research'
);

-- 5. Convert columns back to enum type
ALTER TABLE "user" ALTER COLUMN department TYPE department_type USING department::department_type;
ALTER TABLE alerts ALTER COLUMN target_department TYPE department_type USING target_department::department_type;

COMMIT;

-- Verify the fix
SELECT 'user table departments:' as info;
SELECT DISTINCT department FROM "user" WHERE department IS NOT NULL ORDER BY department;

SELECT 'alerts target departments:' as info;
SELECT DISTINCT target_department FROM alerts WHERE target_department IS NOT NULL ORDER BY target_department;