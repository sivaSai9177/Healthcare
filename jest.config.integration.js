module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '<rootDir>/__tests__/integration/**/*.test.ts',
    '<rootDir>/__tests__/integration/**/*.test.tsx',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node',
        resolveJsonModule: true,
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(better-auth|nanostores|@trpc|superjson)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.integration.js'],
  testTimeout: 60000, // 60 seconds for integration tests
  globals: {
    __DEV__: false,
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/integration/api/.*mock.*\\.test\\.ts$',
  ],
};