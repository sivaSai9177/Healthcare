# Scripts Organization

This directory contains all scripts for development, testing, deployment, and maintenance of the application.

## Directory Structure

### 📁 setup/
Configuration and initialization scripts for setting up the development environment.

- **database/** - Database initialization and setup scripts
- **healthcare/** - Healthcare-specific setup scripts
- **users/** - Test user creation and setup
- **environment/** - Environment configuration (env files, credentials, etc.)

### 📁 test/
All testing scripts organized by category.

- **auth/** - Authentication and authorization testing
- **healthcare/** - Healthcare module testing (alerts, shifts, etc.)
- **api/** - API endpoint and integration testing
- **integration/** - Full integration tests
- **unit/** - Unit testing scripts

### 📁 database/
Database management and migration scripts.

- **migrations/** - Database migration scripts and SQL files
- **management/** - Table management, checks, and maintenance

### 📁 users/
User management scripts.

- **creation/** - Scripts for creating users with different roles
- **management/** - User modification, role assignment, deletion
- **verification/** - User status checks and verification

### 📁 services/
Service startup and management scripts.

- **startup/** - Main service startup scripts (dev, prod, demo)
- **individual/** - Individual service starters (websocket, email, etc.)

### 📁 maintenance/
Maintenance, fixes, and code quality scripts.

- **typescript/** - TypeScript error fixes and analysis
- **imports/** - Import organization and fixes
- **fixes/** - Various code fixes (OAuth, hospital data, etc.)
- **oauth/** - OAuth-specific fixes and maintenance

### 📁 utils/
Utility scripts for various purposes.

- **build/** - Build and deployment utilities
- **health/** - Health checks and monitoring
- **debug/** - Debugging utilities
- **cleanup/** - Cleanup and reset scripts
- **docs/** - Documentation generation

### 📁 data/
Data seeding and demo data scripts.

### 📁 migrations/
SQL migration files (existing directory maintained).

### 📁 websocket-server/
WebSocket server implementation (existing directory maintained).

## Usage

Most scripts can be run using npm scripts defined in package.json:

```bash
# Development
npm run dev:healthcare    # Start with healthcare setup
npm run dev:clean        # Clean start with fresh database

# Testing
npm run test:auth        # Run authentication tests
npm run test:healthcare  # Run healthcare tests
npm run test:api        # Run API tests

# Database
npm run db:reset        # Reset database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed demo data

# Users
npm run users:create    # Create test users
npm run users:setup     # Setup user roles
```

## Script Naming Conventions

- **setup-** : Initial setup scripts
- **test-** : Testing scripts
- **check-** : Verification and status check scripts
- **fix-** : Scripts that fix specific issues
- **create-** : Scripts that create resources
- **update-** : Scripts that update existing resources
- **verify-** : Validation scripts
- **start-** : Service startup scripts
- **migrate-** : Migration scripts

## Best Practices

1. **Modularity**: Each script should have a single, well-defined purpose
2. **Error Handling**: All scripts should handle errors gracefully
3. **Logging**: Use consistent logging for debugging
4. **Documentation**: Each script should have a header comment explaining its purpose
5. **Idempotency**: Setup scripts should be idempotent when possible
6. **Dependencies**: Clearly document any dependencies or prerequisites

## Common Tasks

### Setting up a new development environment
```bash
npm run setup:fresh
```

### Running all tests
```bash
npm run test:all
```

### Resetting and reseeding the database
```bash
npm run db:fresh
```

### Starting development with healthcare module
```bash
npm run dev:healthcare
```