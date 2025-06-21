import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.test') });

// Set default test environment variables
process.env.NODE_ENV = 'test';
process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
process.env.EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Database
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 
  'postgresql://postgres:postgres@localhost:5432/hospital_alert_test';

// Auth secrets (use test values)
process.env.BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || 'test-auth-secret-key';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-32-characters';

// OAuth (mock values for testing)
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'test-google-client-secret';

// Email (use mock service in tests)
process.env.EMAIL_PROVIDER = 'mock';
process.env.EMAIL_FROM = 'test@hospital-alert.com';

// WebSocket
process.env.WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'ws://localhost:3001';

// Disable rate limiting in tests
process.env.DISABLE_RATE_LIMIT = 'true';

// Export test configuration
export const testConfig = {
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL!,
    timeout: 10000,
  },
  auth: {
    testUsers: {
      admin: {
        email: 'admin@test.com',
        password: 'Test123!@#',
        name: 'Test Admin',
      },
      doctor: {
        email: 'doctor@test.com',
        password: 'Test123!@#',
        name: 'Dr. Test',
      },
      nurse: {
        email: 'nurse@test.com',
        password: 'Test123!@#',
        name: 'Nurse Test',
      },
      operator: {
        email: 'operator@test.com',
        password: 'Test123!@#',
        name: 'Operator Test',
      },
    },
  },
  database: {
    url: process.env.DATABASE_URL!,
    runMigrations: process.env.RUN_MIGRATIONS === 'true',
  },
};