-- Add organization_id to hospitals table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'hospitals' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE hospitals ADD COLUMN organization_id UUID NOT NULL DEFAULT 'f155b026-01bd-4212-94f3-e7aedef2801d';
        ALTER TABLE hospitals ALTER COLUMN organization_id DROP DEFAULT;
    END IF;
END $$;

-- Create default organization if it doesn't exist
INSERT INTO organization (id, name, slug, type, size, email, plan, status)
VALUES (
    'f155b026-01bd-4212-94f3-e7aedef2801d',
    'Dubai Healthcare Network',
    'dubai-healthcare',
    'healthcare',
    'large',
    'admin@dubaihealthcare.ae',
    'enterprise',
    'active'
)
ON CONFLICT (id) DO NOTHING;

-- Update any hospitals that don't have organization_id
UPDATE hospitals 
SET organization_id = 'f155b026-01bd-4212-94f3-e7aedef2801d',
    code = COALESCE(code, 'DCH-001'),
    is_default = COALESCE(is_default, true)
WHERE organization_id IS NULL;

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'hospitals_organization_id_fkey'
    ) THEN
        ALTER TABLE hospitals 
        ADD CONSTRAINT hospitals_organization_id_fkey 
        FOREIGN KEY (organization_id) 
        REFERENCES organization(id);
    END IF;
END $$;