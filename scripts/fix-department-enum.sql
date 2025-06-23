-- Fix department enum issue
-- First, update any existing "System" values to use a valid enum value
UPDATE users SET department = 'it_support' WHERE department = 'System';

-- If there are other tables with department fields, update them too
UPDATE audit_log SET department = 'it_support' WHERE department = 'System';

-- Now the migration should work