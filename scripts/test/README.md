# Test Scripts

Comprehensive testing scripts organized by module and test type.

## Subdirectories

### auth/
Authentication and authorization testing
- OAuth flows
- Session management
- Bearer token auth
- Login/logout flows

### healthcare/
Healthcare module testing
- Alert system tests
- Shift management
- Escalation flows
- Integration tests

### api/
API endpoint testing
- TRPC endpoints
- WebSocket connections
- Organization APIs
- Direct endpoint tests

### integration/
Full integration tests
- MVP feature testing
- Frontend integration
- Navigation testing
- Screen rendering

### unit/
Unit tests for individual components
- Email service
- Notification service
- Logging infrastructure
- Error handling

## Running Tests

```bash
# Run all tests
./scripts/test/run-comprehensive-tests.sh

# Run specific category
tsx scripts/test/auth/test-auth-simple.ts
tsx scripts/test/healthcare/test-alerts-api.ts
tsx scripts/test/api/test-websocket-simple.ts

# Run integration tests
tsx scripts/test/integration/test-mvp-features.ts
```

## Test Categories

1. **Authentication Tests** - OAuth, session, bearer token validation
2. **Healthcare Tests** - Alert system, shifts, escalations
3. **API Tests** - Endpoint validation, WebSocket testing
4. **Integration Tests** - End-to-end feature testing
5. **Unit Tests** - Individual service testing