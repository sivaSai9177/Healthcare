# Utility Scripts

General utility scripts for various development and operational tasks.

## Subdirectories

### build/
Build and deployment utilities
- EAS build scripts
- IP address updates
- Credential synchronization

### health/
Health checks and monitoring
- `health-check.ts` - General system health check
- `check-api-health.ts` - API endpoint health
- `monitor-auth-flow.ts` - Authentication monitoring
- Verification scripts

### debug/
Debugging utilities
- `debug-mobile-auth.ts` - Mobile auth debugging
- `debug-oauth-server.ts` - OAuth server debugging
- `demo-trpc-logging.ts` - TRPC logging demo
- Browser debugging tools

### cleanup/
Cleanup and reset utilities
- Project reset scripts
- Docker cleanup
- Cache clearing
- Log removal

### docs/
Documentation and guides
- API documentation generation
- Test guides
- Credential display
- Shell script utilities

## Usage

### Health Checks
```bash
# Check system health
tsx scripts/utils/health/health-check.ts

# Check API health
tsx scripts/utils/health/check-api-health.ts

# Monitor auth flow
tsx scripts/utils/health/monitor-auth-flow.ts
```

### Debugging
```bash
# Debug mobile authentication
tsx scripts/utils/debug/debug-mobile-auth.ts

# Debug OAuth server
tsx scripts/utils/debug/debug-oauth-server.ts
```

### Cleanup
```bash
# Reset project
node scripts/utils/cleanup/reset-project.js

# Clean Docker environment
./scripts/utils/cleanup/docker-reset.sh
```

### Documentation
```bash
# Generate API docs
tsx scripts/utils/docs/generate-api-docs.ts

# Show test credentials
tsx scripts/utils/docs/show-test-credentials.ts
```