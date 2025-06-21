# Database Scripts

Database management, migrations, and maintenance scripts.

## Subdirectories

### migrations/
SQL migration files and migration runners
- Schema updates
- Index creation
- Constraint modifications
- Data migrations

### management/
Database table management and utilities
- Table creation/deletion
- Column modifications
- Data integrity checks
- Hospital/organization management

## Key Scripts

### Migrations
- `run-migration.ts` - Execute pending migrations
- `complete-migration.ts` - Run all migrations
- `migrate-to-hospital-structure.ts` - Hospital schema migration
- `apply-indexes.ts` - Create database indexes

### Management
- `drop-all-tables.ts` - Remove all tables (use with caution!)
- `check-all-tables.ts` - Verify table integrity
- `update-hospitals-table.ts` - Update hospital schema
- `sync-organization-hospital.ts` - Sync org/hospital relationships

## Usage

```bash
# Run migrations
tsx scripts/database/migrations/run-migration.ts

# Check database status
tsx scripts/database/management/check-all-tables.ts

# Update hospital data
tsx scripts/database/management/update-hospitals-table.ts
```

## Safety Notes

⚠️ **CAUTION**: Some scripts like `drop-all-tables.ts` are destructive. Always backup your data before running management scripts in production.