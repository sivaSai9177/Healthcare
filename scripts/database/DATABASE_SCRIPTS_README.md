# Database Management Scripts

This directory contains the consolidated database management tools for the application.

## Main Script: `manage-database.ts`

The unified database management script that consolidates all database operations:

```bash
bun run scripts/database/manage-database.ts [action] [options]
```

### Available Actions

- **reset** - Reset database (drop all tables and recreate)
- **migrate** - Run pending migrations
- **push** - Push schema changes (development only)
- **backup** - Create database backup
- **restore** - Restore from backup
- **health** - Check database health
- **info** - Show database information
- **tables** - List all tables
- **seed** - Seed demo data
- **check** - Comprehensive table and schema checks
- **fix** - Run specific fixes (hospital columns, user assignments, etc.)
- **index** - Apply or rebuild indexes
- **validate** - Validate schema integrity
- **clean** - Clean orphaned data

### Common Options

- `--help, -h` - Show help
- `--env` - Target environment (local, development, staging)
- `--force` - Skip confirmations
- `--dry-run` - Preview changes without applying them
- `--filter` - Filter tables by pattern (for check/tables actions)

### Fix Options

- `--fix-hospital-columns` - Fix hospital column types
- `--fix-user-assignments` - Fix user hospital assignments
- `--fix-organization-ids` - Fix organization ID references

### Examples

```bash
# Reset local database
bun run scripts/database/manage-database.ts reset --env=local

# Check database health
bun run scripts/database/manage-database.ts health

# Apply all indexes
bun run scripts/database/manage-database.ts index

# Fix hospital-related issues
bun run scripts/database/manage-database.ts fix --fix-hospital-columns

# Check healthcare tables only
bun run scripts/database/manage-database.ts check --filter=healthcare

# Seed with healthcare demo data
bun run scripts/database/manage-database.ts seed --healthcare

# Validate schema integrity
bun run scripts/database/manage-database.ts validate

# Clean orphaned data (dry run first)
bun run scripts/database/manage-database.ts clean --dry-run
```

## Legacy Scripts

The following scripts have been consolidated into `manage-database.ts`:

### Management Scripts
- `check-tables.ts` → `manage-database.ts check`
- `drop-all-tables.ts` → `manage-database.ts reset`
- `check-hospitals-table.ts` → `manage-database.ts check --filter=hospitals`
- `update-hospitals-table.ts` → `manage-database.ts fix --fix-hospital-columns`

### Reset Scripts
- `reset-database.ts` → `manage-database.ts reset`
- `reset-database-optimized.ts` → `manage-database.ts reset`

### Migration Scripts
- `migrations/run-migration.ts` → `manage-database.ts migrate`
- `migrations/apply-indexes.ts` → `manage-database.ts index`

### Fix Scripts
- Various `fix-*.ts` scripts → `manage-database.ts fix --fix-[option]`

## Configuration

The database management script uses the configuration from `scripts/config/database.ts` which handles:

- Connection pooling
- Environment-specific settings
- Database health checks
- Transaction management

## Best Practices

1. **Always use dry-run first** for destructive operations:
   ```bash
   bun run scripts/database/manage-database.ts reset --dry-run
   ```

2. **Check health before operations**:
   ```bash
   bun run scripts/database/manage-database.ts health
   ```

3. **Validate after migrations**:
   ```bash
   bun run scripts/database/manage-database.ts migrate
   bun run scripts/database/manage-database.ts validate
   ```

4. **Regular maintenance**:
   ```bash
   # Check for orphaned data
   bun run scripts/database/manage-database.ts validate
   
   # Clean if needed
   bun run scripts/database/manage-database.ts clean --dry-run
   ```

## Docker Support

The script automatically detects Docker environments and handles:
- Container management for local development
- Volume cleanup on reset
- Proper connection handling

## Production Safety

- Reset operations require explicit confirmation for staging/production
- Push operations are blocked in production (use migrations instead)
- All destructive operations support `--dry-run` mode
- Comprehensive logging for audit trails