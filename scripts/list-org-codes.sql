-- List All Active Organization Codes for Testing
-- Run this in Docker PostgreSQL to see available codes

-- Show all active codes with clear formatting
SELECT 
    '=== ACTIVE ORGANIZATION CODES ===' as title
UNION ALL
SELECT 
    ''
UNION ALL
SELECT 
    'Organization: ' || o.name || ' (' || o.type || ')' || CHR(10) ||
    'Code: ' || oc.code || CHR(10) ||
    'Type: ' || oc.type || ' access' || CHR(10) ||
    'Usage: ' || oc.current_uses || '/' || COALESCE(oc.max_uses::text, 'unlimited') || CHR(10) ||
    CASE 
        WHEN oc.expires_at IS NULL THEN 'Expires: Never'
        WHEN oc.expires_at < NOW() THEN 'Expires: EXPIRED ❌'
        ELSE 'Expires: ' || TO_CHAR(oc.expires_at, 'Mon DD, YYYY')
    END || CHR(10) ||
    '---'
FROM organization_code oc
JOIN organization o ON oc.organization_id = o.id
WHERE oc.is_active = true
ORDER BY o.name, oc.created_at DESC;

-- Quick copy-paste codes only
SELECT 
    CHR(10) || '=== QUICK COPY CODES ===' || CHR(10)
UNION ALL
SELECT 
    oc.code || ' - ' || o.name || ' (' || oc.type || ')'
FROM organization_code oc
JOIN organization o ON oc.organization_id = o.id
WHERE oc.is_active = true 
  AND (oc.expires_at IS NULL OR oc.expires_at > NOW())
  AND (oc.max_uses IS NULL OR oc.current_uses < oc.max_uses)
ORDER BY o.name;

-- Test users who need organizations
SELECT 
    CHR(10) || '=== TEST USERS NEEDING ORGANIZATIONS ===' || CHR(10)
UNION ALL
SELECT 
    'Email: ' || email || CHR(10) ||
    'Role: ' || role || CHR(10) ||
    'Name: ' || COALESCE(name, 'Not set') || CHR(10) ||
    '---'
FROM users
WHERE role IN ('admin', 'doctor', 'nurse', 'operator', 'head_doctor')
  AND organization_id IS NULL
ORDER BY role, email;