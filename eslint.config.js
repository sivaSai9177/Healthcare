// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/*',
      '.cleanup-archive/**',
      '.migration/**',
      'ios.bak/**',
      'node_modules/**',
      'android/**',
      'ios/**',
      '.expo/**',
      'coverage/**',
      'build/**',
    ],
  },
]);
