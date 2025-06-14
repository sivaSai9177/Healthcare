# Consolidated Debug Panel

The debug panel has been consolidated from multiple implementations into a single, feature-rich component that works across all platforms.

## Features

### Core Features (from all implementations)
- 🐛 Floating debug button with error badge
- 📱 Cross-platform support (iOS, Android, Web)
- 🎨 Tailwind/NativeWind styling
- ⚡ Performance optimized with React.memo and transitions

### Logging System
- **Manual logging API**: `debugLog.error()`, `.warn()`, `.info()`, `.debug()`
- **Console interception**: Optional automatic capture of console.log/error/warn/info
- **Log filtering**: By level (error, warn, info, debug)
- **Search**: Real-time search across messages and data
- **Export**: Copy logs to clipboard or download as file
- **Source tracking**: Shows where logs originated from

### Three Main Tabs

#### 1. Logs Tab
- View all debug logs with filtering and search
- Color-coded by log level
- Copy individual logs or export all
- Clear all logs
- Toggle console interception

#### 2. Router Tab
- Navigation history tracking
- Current route display
- Clear navigation history

#### 3. Config Tab
- Debug settings (tRPC, Router, Auth logging)
- Theme settings (variant, spacing density)
- Animation settings (enable/disable, speed, debug mode)
- TanStack Query debugging

## Usage

### Basic Usage
```tsx
import { DebugPanelBlock } from '@/components';

// In your app layout
<DebugPanelBlock />
```

### Manual Logging
```tsx
import { debugLog } from '@/components';

// Log messages at different levels
debugLog.error('Something went wrong', { userId: 123 });
debugLog.warn('This might be a problem');
debugLog.info('User logged in', { email: 'user@example.com' });
debugLog.debug('Detailed debug info', { data: complexObject });

// Get current logs
const logs = debugLog.getLogs();

// Clear all logs
debugLog.clear();

// Get error count
const errorCount = debugLog.getErrorCount();

// Subscribe to log updates
const unsubscribe = debugLog.subscribe((logs) => {
  console.log('Logs updated:', logs);
});
```

### Console Interception
```tsx
import { startConsoleInterception, stopConsoleInterception } from '@/components/blocks/debug/DebugPanel';

// Start intercepting console methods
startConsoleInterception();

// Now all console.log/error/warn/info calls will be captured
console.log('This will appear in the debug panel');

// Stop interception
stopConsoleInterception();
```

## Migration from Old Implementations

If you were using any of these old implementations:
- `EnhancedDebugPanel`
- `MobileDebugger`
- `SimpleMobileDebugger`
- `DebugPanel`

Simply replace them with the new consolidated `DebugPanelBlock`:

```tsx
// Old
import { EnhancedDebugPanel } from '@/components';
<EnhancedDebugPanel />

// New
import { DebugPanelBlock } from '@/components';
<DebugPanelBlock />
```

## Architecture

```
debug/
├── DebugPanel/
│   ├── index.tsx              # Main exports
│   ├── ConsolidatedDebugPanel.tsx  # Main component
│   ├── TanStackDebugInfoMigrated.tsx  # Query debugging sub-component
│   └── README.md              # This file
└── utils/
    ├── logger.ts              # Manual logging API
    └── console-interceptor.ts # Console method interception
```

## Performance Considerations

- Uses React.memo for log entries
- Implements useDeferredValue for search
- Limits log storage to 100 entries (FIFO)
- Only renders in development mode (__DEV__)

## Removed Files

The following files have been consolidated and can be deleted:
- `DebugPanel.tsx` (basic version)
- `EnhancedDebugPanel.tsx` (consolidated as base)
- `MobileDebugger.tsx` (console interception integrated)
- `SimpleMobileDebugger.tsx` (manual logging integrated)
- `TanStackDebugInfo.tsx` (migrated to Tailwind)