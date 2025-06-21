# Testing Documentation Hub

## 📁 Directory Structure

```
testing/
├── README.md                    # This file - main testing documentation
├── config/                      # Test configuration files
│   ├── jest.config.js          # Main Jest configuration
│   ├── jest.setup.js           # Jest setup for all tests
│   └── jest.setup.components.js # Component-specific setup
├── docs/                        # Testing documentation
│   ├── current-status.md       # Current testing status
│   ├── testing-strategy.md     # Overall testing strategy
│   └── troubleshooting.md      # Common issues and solutions
├── utils/                       # Test utilities
│   ├── test-utils.ts           # Main test utilities
│   └── mock-utils.ts           # Mock utilities
└── scripts/                     # Testing scripts
    ├── run-tests.sh            # Script to run all tests
    └── coverage-report.sh      # Generate coverage reports
```

## 🚀 Quick Start

```bash
# Run all tests
bun run test:healthcare:all

# Run specific test suites
bun run test:healthcare:unit       # Unit tests (100% passing)
bun run test:healthcare:integration # Integration tests
bun run test:healthcare:components  # Component tests

# Run with coverage
bun run test:healthcare:all --coverage

# Run in watch mode
bun run test:healthcare:watch
```

## 📊 Current Status (June 18, 2025)

| Test Suite | Tests | Passing | Coverage | Status |
|------------|-------|---------|----------|---------|
| Unit Tests | 74 | 74 | 85% | ✅ |
| Integration | 37 | 0 | 0% | ❌ |
| Components | 24 | 4 | 10% | ⚠️ |
| **Total** | **135** | **78** | **~40%** | **57%** |

## 📚 Documentation

- [Current Status](./docs/current-status.md) - Detailed test status and metrics
- [Testing Strategy](./docs/testing-strategy.md) - Overall approach and best practices
- [Troubleshooting](./docs/troubleshooting.md) - Common issues and solutions

## 🛠️ Test Configuration

- [Jest Config](./config/jest.config.js) - Main Jest configuration
- [Setup Files](./config/jest.setup.js) - Global test setup
- [Component Setup](./config/jest.setup.components.js) - React Native component setup

## 🧪 Test Utilities

- [Test Utils](./utils/test-utils.ts) - Helper functions for tests
- [Mock Utils](./utils/mock-utils.ts) - Mock data and services

## 🔧 Known Issues

1. **Integration Tests**: Database connection issues
2. **Component Tests**: React import errors
3. **TRPC Mocks**: Type mismatches

See [Troubleshooting](./docs/troubleshooting.md) for solutions.

## 📈 Coverage Goals

- Unit Tests: 95% (currently 85%)
- Integration: 80% (currently 0%)
- Components: 90% (currently 10%)
- Overall: 85% (currently ~40%)

## 🤝 Contributing

1. Write tests for new features
2. Maintain test coverage above 80%
3. Update documentation when adding tests
4. Follow naming conventions: `*.test.ts` or `*.spec.ts`