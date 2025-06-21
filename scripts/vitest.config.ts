/**
 * Vitest Configuration for Scripts Module
 * 
 * NOTE: This is ONLY for testing the Node.js/Bun scripts in the scripts/ directory,
 * NOT for testing React Native/Expo components.
 * 
 * For React Native component testing, use Jest with the configuration in 
 * the root jest.config.js file.
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // Node environment for CLI scripts
    include: ['**/__tests__/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/*.native.ts', // Exclude any React Native specific files
      '**/*.ios.ts',
      '**/*.android.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'config/**/*.ts'],
      exclude: [
        '**/__tests__/**',
        '**/index.ts',
        '**/*.d.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../'),
    }
  }
});