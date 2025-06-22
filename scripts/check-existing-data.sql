-- Check Existing Data in Database
-- Run these queries in your Docker PostgreSQL

-- 1. Check all users grouped by role
SELECT 
    role,
    COUNT(*) as count,
    COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as with_org,
    COUNT(CASE WHEN needs_profile_completion = true THEN 1 END) as incomplete
FROM users
GROUP BY role
ORDER BY role;

-- 2. List users who need organizations (healthcare/admin without org)
SELECT 
    email,
    name,
    role,
    CASE 
        WHEN organization_id IS NOT NULL THEN 'Has Org ✅'
        ELSE 'NEEDS ORG ❌'
    END as org_status,
    CASE 
        WHEN needs_profile_completion THEN 'Incomplete ⚠️'
        ELSE 'Complete ✅'
    END as profile_status
FROM users
WHERE role IN ('admin', 'doctor', 'nurse', 'operator', 'head_doctor')
ORDER BY role, organization_id NULLS FIRST;

-- 3. Show all organizations with member counts
SELECT 
    o.name as organization,
    o.type,
    o.status,
    COUNT(DISTINCT om.user_id) as member_count,
    COUNT(DISTINCT oc.id) FILTER (WHERE oc.is_active = true) as active_codes,
    COUNT(DISTINCT h.id) as hospital_count
FROM organization o
LEFT JOIN organization_member om ON o.id = om.organization_id
LEFT JOIN organization_code oc ON o.id = oc.organization_id
LEFT JOIN hospitals h ON o.id = h.organization_id
GROUP BY o.id, o.name, o.type, o.status
ORDER BY o.created_at DESC;

-- 4. Show all active organization codes
SELECT 
    o.name as organization,
    oc.code,
    oc.type as code_type,
    oc.current_uses || '/' || COALESCE(oc.max_uses::text, '∞') as usage,
    CASE 
        WHEN oc.expires_at IS NULL THEN 'No expiration'
        WHEN oc.expires_at < NOW() THEN '❌ EXPIRED'
        ELSE 'Expires: ' || TO_CHAR(oc.expires_at, 'YYYY-MM-DD')
    END as expiration
FROM organization_code oc
JOIN organization o ON oc.organization_id = o.id
WHERE oc.is_active = true
ORDER BY o.name, oc.created_at DESC;

-- 5. Show hospitals by organization
SELECT 
    o.name as organization,
    h.name as hospital,
    h.code as hospital_code,
    CASE WHEN h.is_default THEN '⭐ DEFAULT' ELSE '' END as is_default,
    CASE WHEN h.is_active THEN '✅ Active' ELSE '❌ Inactive' END as status
FROM hospitals h
JOIN organization o ON h.organization_id = o.id
ORDER BY o.name, h.is_default DESC, h.name;

-- 6. Quick summary
SELECT 
    'Total Users' as metric, COUNT(*)::text as value FROM users
UNION ALL
SELECT 'Users with Organizations', COUNT(*)::text FROM users WHERE organization_id IS NOT NULL
UNION ALL
SELECT 'Healthcare Users without Org', COUNT(*)::text FROM users WHERE role IN ('doctor', 'nurse', 'operator', 'head_doctor') AND organization_id IS NULL
UNION ALL
SELECT 'Total Organizations', COUNT(*)::text FROM organization
UNION ALL
SELECT 'Healthcare Organizations', COUNT(*)::text FROM organization WHERE type = 'healthcare'
UNION ALL
SELECT 'Active Org Codes', COUNT(*)::text FROM organization_code WHERE is_active = true
UNION ALL
SELECT 'Total Hospitals', COUNT(*)::text FROM hospitals WHERE is_active = true;