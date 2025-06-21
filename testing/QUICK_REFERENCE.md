# Testing Quick Reference 🚀

## Essential Commands

```bash
# Run all tests
bun run test:run all

# Run specific suite
bun run test:healthcare:unit       # Unit tests ✅
bun run test:healthcare:integration # Integration tests ⚠️
bun run test:healthcare:components  # Component tests ⚠️

# Coverage report
bun run test:coverage

# Watch mode
bun run test:healthcare:watch

# Debug mode
bun run test:debug path/to/test.ts
```

## Current Status

| Suite | Tests | Passing | Status |
|-------|-------|---------|---------|
| Unit | 74 | 74 | ✅ |
| Integration | 37 | 0 | ❌ |
| Component | 24 | 4 | ⚠️ |
| **Total** | **135** | **78** | **57%** |

## File Locations

```
__tests__/
├── unit/healthcare/        # Business logic tests ✅
├── integration/healthcare/ # API flow tests ❌
└── components/healthcare/  # UI tests ⚠️

testing/
├── config/                 # Jest setup
├── docs/                   # Documentation
├── utils/                  # Test helpers
└── scripts/                # Automation
```

## Common Fixes

### TextEncoder Error
```javascript
// Already fixed in jest.setup.js
global.TextEncoder = require('util').TextEncoder;
```

### Component Import Error
```javascript
// Check exports
export { Component }; // Named
export default Component; // Default
```

### TRPC Mock Error
```javascript
// Add to test file
jest.mock('@/lib/api/trpc', () => ({
  api: { useUtils: jest.fn() }
}));
```

## Writing New Tests

### Unit Test
```typescript
describe('Feature', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Integration Test
```typescript
import { createTestContext } from '@/testing/utils/test-utils';

it('should create alert', async () => {
  const ctx = await createTestContext(mockUser);
  const result = await caller.createAlert(data);
  expect(result.status).toBe('active');
});
```

### Component Test
```typescript
import { render } from '@testing-library/react-native';

it('should render', () => {
  const { getByText } = render(<Component />);
  expect(getByText('Hello')).toBeTruthy();
});
```

## Help & Resources

- 📚 [Full Guide](./MASTER_TESTING_GUIDE.md)
- 🔧 [Troubleshooting](./docs/troubleshooting.md)
- 📊 [Current Status](./docs/current-status.md)
- 🎯 [Testing Strategy](./docs/testing-strategy.md)

---
**Need help?** Check troubleshooting or run `bun run test:debug`