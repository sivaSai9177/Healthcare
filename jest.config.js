module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  projects: [
    {
      displayName: 'ios',
      preset: 'jest-expo/ios',
      testMatch: [
        '<rootDir>/__tests__/**/*.ios.test.{js,jsx,ts,tsx}',
        '<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/__tests__/**/*-test.{js,jsx,ts,tsx}',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'android',
      preset: 'jest-expo/android',
      testMatch: [
        '<rootDir>/__tests__/**/*.android.test.{js,jsx,ts,tsx}',
        '<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/__tests__/**/*-test.{js,jsx,ts,tsx}',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'web',
      preset: 'jest-expo/web',
      testMatch: [
        '<rootDir>/__tests__/**/*.web.test.{js,jsx,ts,tsx}',
        '<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/__tests__/**/*-test.{js,jsx,ts,tsx}',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
  ],
  // Exclude patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '__tests__/disabled/',
    '__tests__/backup/',
    '/dist/',
    '/build/',
    '/.expo/',
    '/app/',  // Important: Don't test files inside app directory
  ],
  collectCoverageFrom: [
    'hooks/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'src/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/__mocks__/**',
    '!**/jest.setup.js',
    '!**/jest.config.js',
    '!**/*.config.{js,ts}',
    '!**/coverage/**',
    '!app/**',  // Exclude app directory from coverage
  ],
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 70,
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testTimeout: 30000,
  globals: {
    __DEV__: true,
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-reanimated|nativewind|react-native-screens|react-native-safe-area-context|@sentry/.*|react-native-gesture-handler)',
  ],
};