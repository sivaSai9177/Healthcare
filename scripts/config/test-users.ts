/**
 * Centralized test user configuration
 * Used across all scripts for consistent test data
 */

export interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'operator' | 'nurse' | 'doctor' | 'head_doctor' | 'admin';
  hospitalId?: string;
  organizationId?: string;
}

export const TEST_USERS: TestUser[] = [
  {
    email: 'johncena@gmail.com',
    password: 'password123',
    name: 'John Operator',
    role: 'operator',
  },
  {
    email: 'doremon@gmail.com',
    password: 'password123',
    name: 'Nurse Doremon',
    role: 'nurse',
  },
  {
    email: 'johndoe@gmail.com',
    password: 'password123',
    name: 'Dr. John Doe',
    role: 'doctor',
  },
  {
    email: 'saipramod273@gmail.com',
    password: 'password123',
    name: 'Dr. Saipramod (Head)',
    role: 'head_doctor',
  },
];

export const TEST_USER_BY_ROLE = {
  operator: TEST_USERS[0],
  nurse: TEST_USERS[1],
  doctor: TEST_USERS[2],
  head_doctor: TEST_USERS[3],
} as const;

export const DEFAULT_HOSPITAL = {
  id: 'default-hospital',
  name: 'Default Hospital',
  organizationId: 'default-org',
};

export const DEFAULT_ORGANIZATION = {
  id: 'default-org',
  name: 'Default Healthcare Organization',
  slug: 'default-healthcare',
};

// Environment-based configuration
export const getApiUrl = () => {
  return process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8081';
};

export const getDatabaseUrl = () => {
  if (process.env.APP_ENV === 'local') {
    return process.env.DATABASE_URL || 'postgresql://myexpo:myexpo123@localhost:5432/myexpo_dev';
  }
  return process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
};

export const getAuthUrl = () => {
  return process.env.AUTH_URL || process.env.BETTER_AUTH_URL || 'http://localhost:8081';
};

export const getWebSocketUrl = () => {
  const baseUrl = getApiUrl();
  return baseUrl.replace('http', 'ws').replace('https', 'wss') + '/ws';
};