#!/bin/bash

echo "🔄 Organization Tables Migration Script"
echo "======================================="

# Database connection
DB_USER="myexpo"
DB_NAME="myexpo_dev"

echo "⚠️  This will:"
echo "1. Drop the old organization table (if exists)"
echo "2. Create new organization tables with proper schema"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 0
fi

echo "📦 Dropping old organization table..."
docker exec -i myexpo-postgres-local psql -U $DB_USER -d $DB_NAME << EOF
DROP TABLE IF EXISTS organization CASCADE;
EOF

echo "🔨 Creating new organization tables..."
docker exec -i myexpo-postgres-local psql -U $DB_USER -d $DB_NAME < drizzle/0002_add_organization_tables.sql

echo "✅ Verifying migration..."
docker exec -i myexpo-postgres-local psql -U $DB_USER -d $DB_NAME << EOF
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'organization%'
ORDER BY table_name;
EOF

echo ""
echo "🎉 Migration complete!"
echo "You can now test the organization system"