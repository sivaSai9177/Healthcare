# E2E Test Implementation Guide

**Date**: January 12, 2025  
**Status**: Ready for Implementation  

## 🚀 Quick Start

### 1. Install Testing Dependencies
```bash
# Install Detox for React Native E2E testing
bun add -D detox @types/detox jest-circus

# Install additional testing utilities
bun add -D @testing-library/react-native @testing-library/jest-native

# For API testing
bun add -D supertest @types/supertest
```

### 2. Configure Detox
Create `.detoxrc.js`:
```javascript
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 120000
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/myexpo.app',
      build: 'xcodebuild -workspace ios/myexpo.xcworkspace -scheme myexpo -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081]
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_6_API_33'
      }
    }
  },
  configurations: {
    'ios.debug': {
      device: 'simulator',
      app: 'ios.debug'
    },
    'android.debug': {
      device: 'emulator',
      app: 'android.debug'
    }
  }
};
```

### 3. Create E2E Test Structure
```bash
mkdir -p e2e/{tests,helpers,fixtures}
```

## 📁 Test File Structure

```
e2e/
├── jest.config.js
├── setup.ts
├── helpers/
│   ├── auth.helper.ts
│   ├── navigation.helper.ts
│   └── wait.helper.ts
├── fixtures/
│   ├── users.json
│   ├── alerts.json
│   └── patients.json
└── tests/
    ├── auth/
    │   ├── login.e2e.ts
    │   ├── register.e2e.ts
    │   └── profile-completion.e2e.ts
    ├── healthcare/
    │   ├── alert-creation.e2e.ts
    │   ├── alert-acknowledgment.e2e.ts
    │   ├── escalation.e2e.ts
    │   └── shift-handover.e2e.ts
    └── integration/
        ├── real-time-sync.e2e.ts
        └── offline-mode.e2e.ts
```

## 🧪 Example Test Implementations

### Auth Helper
```typescript
// e2e/helpers/auth.helper.ts
export class AuthHelper {
  static async login(email: string, password: string) {
    await element(by.id('email-input')).typeText(email);
    await element(by.id('password-input')).typeText(password);
    await element(by.id('login-button')).tap();
    
    // Wait for navigation
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
  }

  static async logout() {
    await element(by.id('settings-tab')).tap();
    await element(by.id('logout-button')).tap();
    await element(by.text('Logout')).tap();
  }

  static async isAuthenticated() {
    try {
      await expect(element(by.id('home-screen'))).toBeVisible();
      return true;
    } catch {
      return false;
    }
  }
}
```

### Basic Login Test
```typescript
// e2e/tests/auth/login.e2e.ts
describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should login successfully as operator', async () => {
    await element(by.id('login-screen-button')).tap();
    await AuthHelper.login('johncena@gmail.com', 'password123');
    
    // Verify operator dashboard
    await expect(element(by.text('Operator Dashboard'))).toBeVisible();
    await expect(element(by.id('create-alert-button'))).toBeVisible();
  });

  it('should show error for invalid credentials', async () => {
    await element(by.id('login-screen-button')).tap();
    await AuthHelper.login('invalid@email.com', 'wrongpass');
    
    await expect(element(by.text('Invalid credentials'))).toBeVisible();
  });
});
```

### Alert Creation Test
```typescript
// e2e/tests/healthcare/alert-creation.e2e.ts
describe('Alert Creation', () => {
  beforeAll(async () => {
    await device.launchApp();
    await AuthHelper.login('johncena@gmail.com', 'password123');
  });

  it('should create CODE RED alert', async () => {
    // Navigate to alerts
    await element(by.id('alerts-tab')).tap();
    await element(by.id('create-alert-button')).tap();
    
    // Fill alert form
    await element(by.id('alert-type-select')).tap();
    await element(by.text('CODE RED')).tap();
    
    await element(by.id('patient-name-input')).typeText('John Doe');
    await element(by.id('location-input')).typeText('Emergency Room');
    await element(by.id('description-input')).typeText('Cardiac arrest, immediate response needed');
    
    // Submit
    await element(by.id('submit-alert-button')).tap();
    
    // Verify creation
    await waitFor(element(by.text('Alert created successfully')))
      .toBeVisible()
      .withTimeout(3000);
      
    // Verify in list
    await element(by.id('back-button')).tap();
    await expect(element(by.text('CODE RED - John Doe'))).toBeVisible();
  });
});
```

### Real-time Sync Test
```typescript
// e2e/tests/integration/real-time-sync.e2e.ts
describe('Real-time Synchronization', () => {
  it('should sync alerts across devices', async () => {
    // Device 1: Login as operator
    await device.launchApp({ newInstance: true });
    await AuthHelper.login('johncena@gmail.com', 'password123');
    
    // Device 2: Login as nurse (would need second device/emulator)
    // This is pseudo-code for multi-device testing
    // await device2.launchApp({ newInstance: true });
    // await AuthHelper.login('doremon@gmail.com', 'password123', device2);
    
    // Create alert on Device 1
    await element(by.id('create-alert-button')).tap();
    await createAlert({ type: 'CODE_YELLOW', patient: 'Test Patient' });
    
    // Verify on Device 2 (in real implementation)
    // await expect(element(by.text('CODE YELLOW - Test Patient')).atIndex(0))
    //   .toBeVisible()
    //   .on(device2);
  });
});
```

## 🔧 API Integration Tests

### Create `__tests__/api/healthcare.test.ts`:
```typescript
import request from 'supertest';
import { createTestApp } from '../helpers/test-app';

describe('Healthcare API', () => {
  let app: any;
  let operatorToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'johncena@gmail.com', password: 'password123' });
    operatorToken = res.body.token;
  });

  describe('POST /api/alerts', () => {
    it('should create alert with valid data', async () => {
      const res = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          type: 'CODE_YELLOW',
          priority: 'high',
          patientId: 'patient-123',
          location: 'Room 302',
          description: 'Patient requires immediate attention'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('active');
    });

    it('should reject alert without authentication', async () => {
      const res = await request(app)
        .post('/api/alerts')
        .send({ type: 'CODE_RED' });

      expect(res.status).toBe(401);
    });
  });
});
```

## 🎬 Running Tests

### Package.json Scripts
```json
{
  "scripts": {
    "test:e2e:ios": "detox test --configuration ios.debug",
    "test:e2e:android": "detox test --configuration android.debug",
    "test:e2e:build:ios": "detox build --configuration ios.debug",
    "test:e2e:build:android": "detox build --configuration android.debug",
    "test:api": "jest __tests__/api --testTimeout=30000",
    "test:all": "bun run test:unit && bun run test:api && bun run test:e2e:ios"
  }
}
```

### CI/CD Integration
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: macos-12
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Bun
        run: curl -fsSL https://bun.sh/install | bash
        
      - name: Install Dependencies
        run: bun install
        
      - name: Setup Healthcare Data
        run: bun run scripts/setup-healthcare-local.ts
        
      - name: Build iOS App
        run: bun run test:e2e:build:ios
        
      - name: Run E2E Tests
        run: bun run test:e2e:ios
        
      - name: Upload Screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-screenshots
          path: e2e/screenshots
```

## 📊 Test Reporting

### Jest Reporter Configuration
```javascript
// e2e/jest.config.js
module.exports = {
  preset: 'react-native',
  testMatch: ['<rootDir>/e2e/tests/**/*.e2e.ts'],
  testTimeout: 120000,
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'E2E Test Report',
      outputPath: 'reports/e2e-test-report.html',
      includeFailureMsg: true,
      includeConsoleLog: true
    }]
  ],
  setupFilesAfterEnv: ['<rootDir>/e2e/setup.ts'],
};
```

## 🚦 Next Steps

1. **Install Dependencies**: Run the installation commands
2. **Configure Devices**: Set up iOS Simulator and Android Emulator
3. **Create Test Helpers**: Implement the helper functions
4. **Write First Test**: Start with basic login test
5. **Expand Coverage**: Add more test scenarios
6. **Setup CI/CD**: Configure automated testing
7. **Monitor Results**: Set up test reporting dashboard

## 📝 Best Practices

1. **Use Test IDs**: Add `testID` props to all interactive elements
2. **Wait for Elements**: Always use `waitFor` for async operations
3. **Clean State**: Reset app state between tests
4. **Mock External Services**: Use mock servers for third-party APIs
5. **Parallel Execution**: Run independent tests in parallel
6. **Screenshot on Failure**: Capture screenshots for debugging
7. **Performance Metrics**: Track test execution times

---

**Ready to implement comprehensive E2E testing!**