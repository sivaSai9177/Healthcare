# Setup Scripts

This directory contains all initialization and setup scripts for the project.

## Subdirectories

### database/
- `reset-database.ts` - Reset database to clean state
- `reset-database-complete.ts` - Complete database reset with all tables
- `setup-database-fresh.ts` - Fresh database setup with schema
- `setup-test-db.ts` - Setup test database environment

### healthcare/
- `setup-healthcare-complete.ts` - Complete healthcare module setup with all data
- `setup-healthcare-db.ts` - Database setup specific to healthcare
- `setup-healthcare-demo.ts` - Demo data for healthcare module
- `setup-healthcare-local.ts` - Local development healthcare setup

### users/
- `setup-demo-users.ts` - Create demo users for testing
- `setup-doremon-user.ts` - Setup specific test user "doremon"
- `setup-test-users.ts` - General test user creation
- `setup-test-users-api.ts` - API-based user creation
- `setup-test-users-mvp.ts` - MVP demo users

### environment/
- `generate-env-files.js` - Generate environment files from templates
- `generate-local-credentials.sh` - Generate local development credentials
- `setup-eas.sh` - Setup EAS for mobile builds
- `setup-environment.sh` - General environment setup
- `setup-ios-credentials.sh` - iOS specific credentials
- `setup-ngrok.sh` - Ngrok tunnel setup
- `setup-posthog.sh` - PostHog analytics setup

## Usage Examples

```bash
# Setup fresh database
tsx scripts/setup/database/setup-database-fresh.ts

# Setup healthcare with demo data
tsx scripts/setup/healthcare/setup-healthcare-complete.ts

# Create test users
tsx scripts/setup/users/setup-test-users.ts

# Setup development environment
./scripts/setup/environment/setup-environment.sh
```