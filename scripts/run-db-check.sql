-- Run these SQL queries to check database state
-- Execute in Docker PostgreSQL

-- 1. Quick Summary
\echo '==== DATABASE SUMMARY ===='
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM organization) as total_orgs,
    (SELECT COUNT(*) FROM organization_code WHERE is_active = true) as active_codes,
    (SELECT COUNT(*) FROM hospitals) as total_hospitals;

-- 2. Users by Role
\echo '\n==== USERS BY ROLE ===='
SELECT 
    role,
    COUNT(*) as count,
    COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as with_org,
    COUNT(CASE WHEN needs_profile_completion = true THEN 1 END) as needs_completion
FROM users
GROUP BY role
ORDER BY role;

-- 3. Organizations with Codes
\echo '\n==== ORGANIZATIONS & CODES ===='
SELECT 
    o.name,
    o.type,
    COUNT(DISTINCT oc.id) as code_count,
    COUNT(DISTINCT om.user_id) as member_count,
    COUNT(DISTINCT h.id) as hospital_count
FROM organization o
LEFT JOIN organization_code oc ON o.id = oc.organization_id AND oc.is_active = true
LEFT JOIN organization_member om ON o.id = om.organization_id
LEFT JOIN hospitals h ON o.id = h.organization_id
GROUP BY o.id, o.name, o.type
ORDER BY o.name;

-- 4. Active Organization Codes
\echo '\n==== ACTIVE ORGANIZATION CODES ===='
SELECT 
    oc.code,
    o.name as organization,
    oc.type,
    oc.current_uses || '/' || COALESCE(oc.max_uses::text, '∞') as usage,
    CASE 
        WHEN oc.expires_at < NOW() THEN 'EXPIRED'
        WHEN oc.expires_at IS NULL THEN 'No expiry'
        ELSE TO_CHAR(oc.expires_at, 'MM/DD/YYYY')
    END as expires
FROM organization_code oc
JOIN organization o ON oc.organization_id = o.id
WHERE oc.is_active = true
ORDER BY o.name, oc.code;

-- 5. Healthcare Users Without Organizations
\echo '\n==== HEALTHCARE USERS NEEDING ORGANIZATIONS ===='
SELECT 
    email,
    name,
    role,
    created_at::date as registered
FROM users
WHERE role IN ('doctor', 'nurse', 'operator', 'head_doctor')
  AND organization_id IS NULL
ORDER BY role, created_at;

-- 6. Hospitals by Organization
\echo '\n==== HOSPITALS BY ORGANIZATION ===='
SELECT 
    o.name as organization,
    h.name as hospital,
    h.code,
    CASE WHEN h.is_default THEN '⭐ DEFAULT' ELSE '' END as default_flag
FROM hospitals h
JOIN organization o ON h.organization_id = o.id
WHERE h.is_active = true
ORDER BY o.name, h.is_default DESC, h.name;