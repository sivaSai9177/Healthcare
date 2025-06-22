-- Organization Database Queries
-- Run these in your Docker PostgreSQL to check organization structure

-- 1. View all organizations
SELECT 
    o.id,
    o.name,
    o.type,
    o.size,
    o.status,
    o.created_at,
    o.created_by
FROM organization o
ORDER BY o.created_at DESC;

-- 2. View organization codes (for joining)
SELECT 
    oc.code,
    oc.type,
    oc.max_uses,
    oc.current_uses,
    oc.expires_at,
    oc.is_active,
    o.name as organization_name
FROM organization_code oc
JOIN organization o ON oc.organization_id = o.id
ORDER BY oc.created_at DESC;

-- 3. View organization members with their roles
SELECT 
    o.name as organization_name,
    u.email as member_email,
    u.name as member_name,
    om.role as member_role,
    om.status as member_status,
    om.joined_at
FROM organization_member om
JOIN organization o ON om.organization_id = o.id
JOIN users u ON om.user_id = u.id
ORDER BY o.name, om.role;

-- 4. Count members by organization and role
SELECT 
    o.name as organization_name,
    om.role,
    COUNT(*) as member_count
FROM organization_member om
JOIN organization o ON om.organization_id = o.id
GROUP BY o.name, om.role
ORDER BY o.name, om.role;

-- 5. View hospitals linked to organizations
SELECT 
    o.name as organization_name,
    h.name as hospital_name,
    h.code as hospital_code,
    h.is_default,
    h.is_active
FROM hospitals h
JOIN organization o ON h.organization_id = o.id
ORDER BY o.name, h.is_default DESC, h.name;

-- 6. Healthcare users and their organization/hospital assignments
SELECT 
    u.email,
    u.name,
    u.role,
    o.name as organization_name,
    h.name as hospital_name,
    hu.department,
    hu.is_on_duty
FROM healthcare_users hu
JOIN users u ON hu.user_id = u.id
LEFT JOIN hospitals h ON hu.hospital_id = h.id
LEFT JOIN organization o ON u.organization_id = o.id
ORDER BY o.name, h.name, u.name;

-- 7. Check which organizations have active codes
SELECT 
    o.name,
    o.type,
    COUNT(CASE WHEN oc.is_active = true THEN 1 END) as active_codes,
    COUNT(oc.id) as total_codes
FROM organization o
LEFT JOIN organization_code oc ON o.id = oc.organization_id
GROUP BY o.id, o.name, o.type
ORDER BY o.name;

-- 8. Find organizations without any members
SELECT 
    o.id,
    o.name,
    o.type,
    o.created_at
FROM organization o
LEFT JOIN organization_member om ON o.id = om.organization_id
WHERE om.id IS NULL;

-- 9. View active organization codes with usage stats
SELECT 
    oc.code,
    o.name as organization_name,
    oc.type as code_type,
    oc.current_uses || '/' || COALESCE(oc.max_uses::text, 'unlimited') as usage,
    CASE 
        WHEN oc.expires_at IS NULL THEN 'No expiration'
        WHEN oc.expires_at < NOW() THEN 'EXPIRED'
        ELSE 'Expires: ' || oc.expires_at::date
    END as expiration_status
FROM organization_code oc
JOIN organization o ON oc.organization_id = o.id
WHERE oc.is_active = true
ORDER BY o.name, oc.created_at DESC;

-- 10. Summary statistics
SELECT 
    'Total Organizations' as metric,
    COUNT(*)::text as value
FROM organization
UNION ALL
SELECT 
    'Healthcare Organizations',
    COUNT(*)::text
FROM organization
WHERE type = 'healthcare'
UNION ALL
SELECT 
    'Active Organization Codes',
    COUNT(*)::text
FROM organization_code
WHERE is_active = true
UNION ALL
SELECT 
    'Total Organization Members',
    COUNT(*)::text
FROM organization_member
WHERE status = 'active'
UNION ALL
SELECT 
    'Total Hospitals',
    COUNT(*)::text
FROM hospitals
WHERE is_active = true;