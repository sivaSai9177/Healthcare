# Maestro E2E Testing

## Overview

This directory contains end-to-end (E2E) tests for the Healthcare Alert System using Maestro. Maestro is a mobile UI testing framework that allows writing tests in simple YAML format.

## Installation

```bash
# Install Maestro CLI
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version
```

## Directory Structure

```
maestro/
├── flows/                  # Test flows organized by feature
│   ├── auth/              # Authentication flows
│   │   ├── login.yaml     # Login test
│   │   ├── register.yaml  # Registration test
│   │   └── logout.yaml    # Logout test
│   ├── healthcare/        # Healthcare-specific flows
│   │   ├── create-alert.yaml       # Alert creation
│   │   ├── acknowledge-alert.yaml  # Alert acknowledgment
│   │   └── escalation.yaml        # Escalation process
│   └── common/            # Common app flows
│       ├── navigation.yaml    # Navigation tests
│       └── settings.yaml      # Settings tests
├── config/                # Test configuration
│   └── test-users.yaml   # Test user data
├── run-all.sh            # Script to run all tests
└── README.md             # This file
```

## Running Tests

### Run All Tests
```bash
./maestro/run-all.sh
```

### Run Specific Test
```bash
maestro test maestro/flows/auth/login.yaml
```

### Run Tests by Tag
```bash
# Run critical tests only
maestro test maestro/flows --include-tags=critical

# Run auth tests
maestro test maestro/flows --include-tags=auth
```

### Run with Custom App ID
```bash
maestro test maestro/flows/auth/login.yaml --env APP_ID=com.yourcompany.app
```

## Writing Tests

### Basic Test Structure
```yaml
appId: ${APP_ID}
tags:
  - feature_name
  - priority
---
# Test Description
- launchApp:
    clearState: true
    
- assertVisible:
    text: "Expected Text"
    timeout: 10000
    
- tapOn:
    id: "element-id"
    
- inputText: "Test input"

- takeScreenshot: test-complete
```

### Common Commands

#### Assertions
```yaml
# Assert element is visible
- assertVisible:
    text: "Dashboard"
    id: "dashboard-screen"
    timeout: 5000

# Assert element is not visible
- assertNotVisible:
    text: "Error"
```

#### Interactions
```yaml
# Tap on element
- tapOn:
    text: "Button"
    id: "button-id"
    index: 0  # If multiple matches

# Input text
- inputText: "test@example.com"

# Scroll
- scrollUntilVisible:
    element:
      text: "Target Element"
    direction: DOWN
    timeout: 10000

# Swipe
- swipe:
    direction: LEFT
    duration: 1000
```

#### Navigation
```yaml
# Go back
- back

# Launch app
- launchApp:
    clearState: true
    permissions:
      notifications: allow
      camera: deny
```

#### Waiting
```yaml
# Wait for specific time
- wait:
    seconds: 5

# Wait for condition
- waitUntilVisible:
    text: "Loading complete"
    timeout: 10000
```

### Using Variables
```yaml
env:
  USER_EMAIL: "test@example.com"
  USER_PASSWORD: "password123"
---
- inputText: ${USER_EMAIL}
```

### Reusing Flows
```yaml
# Run another flow
- runFlow: ../auth/login.yaml

# Run flow with parameters
- runFlow:
    file: ../auth/login.yaml
    env:
      EMAIL: "custom@example.com"
```

## Test Data

Test users are defined in `config/test-users.yaml`:
- Nurse: `nurse@test.hospital.com`
- Doctor: `doctor@test.hospital.com`
- Manager: `manager@test.hospital.com`
- Admin: `admin@test.hospital.com`

All test users use password: `Test123!`

## Best Practices

1. **Use IDs over Text**: Prefer `id` selectors over `text` for stability
2. **Add Timeouts**: Always add appropriate timeouts for assertions
3. **Clear State**: Use `clearState: true` for test isolation
4. **Take Screenshots**: Capture screenshots at key points for debugging
5. **Use Tags**: Tag tests for easy filtering and organization
6. **Handle Delays**: Add waits for animations and network requests
7. **Test Happy Path First**: Ensure basic flows work before edge cases

## Debugging

### Enable Debug Mode
```bash
maestro test flow.yaml --debug
```

### View Hierarchy
```bash
maestro studio
```

### Common Issues

1. **Element Not Found**
   - Check element IDs in React Native code
   - Use `maestro studio` to inspect hierarchy
   - Add appropriate timeouts

2. **Flaky Tests**
   - Add explicit waits
   - Use `waitUntilVisible` instead of `assertVisible`
   - Check for race conditions

3. **App State Issues**
   - Use `clearState: true` in `launchApp`
   - Reset app data between tests
   - Handle permissions properly

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Maestro Tests
  uses: mobile-dev-inc/action-maestro-cloud@v1
  with:
    api-key: ${{ secrets.MAESTRO_CLOUD_API_KEY }}
    app-file: ./build/app.apk
```

### Local CI
```bash
# Run tests and generate report
./maestro/run-all.sh

# Check exit code
if [ $? -eq 0 ]; then
  echo "All tests passed"
else
  echo "Tests failed"
fi
```

## Reporting

Test results are saved in `maestro-results/` directory:
- JUnit XML reports for CI integration
- Log files for each test run
- HTML summary report
- Screenshots from test runs

## Extending Tests

To add new tests:

1. Create new YAML file in appropriate directory
2. Add test flow following the structure
3. Update tags for categorization
4. Add to run-all.sh if needed
5. Document any new patterns used

## Resources

- [Maestro Documentation](https://maestro.mobile.dev/docs)
- [Maestro Examples](https://github.com/mobile-dev-inc/maestro/tree/main/examples)
- [Best Practices](https://maestro.mobile.dev/docs/best-practices)