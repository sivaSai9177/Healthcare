#!/bin/bash

# DEPRECATED: This script has been replaced with scripts/services/start-unified.ts
# Please use: bun scripts/services/start-unified.ts [mode]

echo "⚠️  This script is deprecated!"
echo "Please use: bun scripts/services/start-unified.ts [mode]"
echo ""
echo "The new TypeScript version provides:"
echo "  - Better error handling and type safety"
echo "  - Improved process management"
echo "  - Consistent logging"
echo "  - Proper cleanup on exit"
echo ""
echo "Redirecting to new script..."
echo ""

# Pass through to the new script
exec bun scripts/services/start-unified.ts "$@"