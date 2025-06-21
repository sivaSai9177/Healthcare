#!/usr/bin/env bun
/**
 * DEPRECATED: This script has been replaced with scripts/users/manage-users.ts
 * Please use: bun scripts/users/manage-users.ts setup-demo
 */

// Run the new script with setup-demo action
process.argv = [process.argv[0], process.argv[1], 'setup-demo', '--api'];
import('../manage-users');