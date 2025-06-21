# Deployment Scripts Integration Tests

This directory contains integration tests for the deployment management scripts. These tests verify the actual CLI behavior with minimal mocking.

## Test Files

### 1. manage-deploy-cli.integration.test.ts ✅
Tests the deployment management script (`manage-deploy.ts`) including:
- Help command display
- Build commands for different platforms (web, iOS, Android)
- Deployment to different environments (development, staging, production)
- Environment variable management
- Prerequisites checking
- Status and logs commands
- Error handling

**Status**: ✅ All 12 tests passing

### 2. manage-eas-cli.integration.test.ts ✅
Tests the EAS (Expo Application Services) management script (`manage-eas.ts`) including:
- Setup and configuration
- Build commands with different profiles
- Build listing and submission
- OTA updates
- Credentials management
- Metadata handling
- Platform and profile options
- Error handling

**Status**: ✅ All 31 tests passing

### 3. manage-health-cli.integration.test.ts ⚠️
Tests for the health monitoring script (`manage-health.ts`) including:
- System health status checks
- Service endpoint monitoring
- Alert configuration testing
- Metrics collection and export
- Dashboard functionality
- Configuration management

**Status**: ⚠️ Tests written but script not yet implemented

### 4. manage-deploy.integration.test.ts (Original Mock-based Tests)
The original comprehensive test suite using mocks for rapid testing:
- Full coverage of all deployment actions
- Complex scenarios and workflows
- Detailed error handling
- Integration with other tools

**Status**: ✅ Tests written with mocks

### 5. manage-eas.integration.test.ts (Original Mock-based Tests)
The original comprehensive test suite for EAS management:
- All EAS CLI commands
- Build and submission workflows
- Update management
- Credential handling

**Status**: ✅ Tests written with mocks

## Running the Tests

### Run all integration tests:
```bash
cd scripts
npx vitest run __tests__/deployment/*.integration.test.ts
```

### Run specific test file:
```bash
cd scripts
npx vitest run __tests__/deployment/manage-deploy-cli.integration.test.ts
```

## Test Structure

Each CLI integration test follows this pattern:

1. **Setup**: Creates a test workspace with necessary files
2. **Execution**: Runs the actual script with `bun` command
3. **Verification**: Checks the output and side effects
4. **Cleanup**: Removes test workspace

## Key Features

- **Minimal Mocking**: Tests actual script behavior
- **Real File System**: Creates and manipulates real files
- **Process Execution**: Uses `execSync` to run scripts
- **Output Validation**: Verifies console output with regex patterns
- **Error Handling**: Tests both success and failure scenarios

## Test Coverage Summary

| Script | CLI Tests | Mock Tests | Total Coverage |
|--------|-----------|------------|----------------|
| manage-deploy.ts | 12/12 ✅ | 37/37 ✅ | Full |
| manage-eas.ts | 31/31 ✅ | 25/25 ✅ | Full |
| manage-health.ts | 25 written | - | Pending implementation |

## Best Practices

1. **Use regex patterns** for output matching to handle variations
2. **Create minimal test environments** with only necessary files
3. **Test both success and error paths**
4. **Clean up test workspaces** after each test
5. **Handle missing dependencies gracefully** (e.g., Docker, Kamal, EAS CLI)

## Future Improvements

1. Add performance benchmarks for script execution
2. Test concurrent script execution
3. Add integration with CI/CD pipelines
4. Create end-to-end deployment scenarios
5. Add visual regression tests for dashboard commands