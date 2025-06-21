# Testing Strategy Clarification

## Scripts Module (Node.js/Bun) - What We Just Set Up

**Location**: `/scripts/`
**Environment**: Node.js
**Test Runner**: Vitest (or Jest)
**What it tests**: 
- CLI utilities (`parseArgs`, `logger`, etc.)
- Database scripts (`reset-database.ts`)
- Service management (`start-unified.ts`)
- User management (`manage-users.ts`)

These are **server-side Node.js scripts** that run on your development machine or CI/CD pipeline.

```bash
# Run script tests
cd scripts
bun test

# Or with Jest
bun test scripts/__tests__/lib/logger.test.ts
```

## Expo/React Native App - Your Main Application

**Location**: `/app/`, `/components/`
**Environment**: React Native
**Test Runner**: Jest (already configured)
**Test Libraries**: 
- `@testing-library/react-native`
- `jest-expo`

This is your **mobile application** code.

```bash
# Run React Native tests (from root)
bun test

# Run specific component tests
bun test __tests__/components/healthcare/
```

## Why Different Test Setups?

1. **Scripts** are Node.js programs that:
   - Run in a Node/Bun runtime
   - Access file system, run Docker commands
   - Connect directly to databases
   - Use Node.js APIs

2. **Expo/React Native** components:
   - Run in a mobile JavaScript engine
   - Use React Native APIs
   - Render UI components
   - Handle touch events, navigation

## Summary

- ✅ Vitest for `/scripts/` - Node.js CLI tools
- ✅ Jest for React Native components
- ❌ Don't use Vitest for React Native components
- ❌ Don't use React Native Testing Library for CLI scripts

The test setup we just created is specifically for the scripts module optimization, not for your React Native app components!