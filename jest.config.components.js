module.exports = {
  displayName: 'components',
  preset: 'react-native',
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/testing/config/jest.setup.components.js'
  ],
  testMatch: [
    '<rootDir>/__tests__/components/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/components/**/__tests__/*.test.{js,jsx,ts,tsx}',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@expo|expo|expo-.*|@unimodules|react-native-.*|@react-native-community|react-native-svg|react-native-safe-area-context|react-native-screens|react-native-reanimated|react-native-gesture-handler|nativewind)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testTimeout: 10000,
};