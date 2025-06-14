#!/usr/bin/env bun
/**
 * Quick script to check for common runtime errors
 */

// TODO: Replace with structured logging - console.log('🔍 Checking for common runtime errors...\n');

// Check email service
try {
  const emailMock = require('../src/server/services/email-mock');
// TODO: Replace with structured logging - console.log('✅ Email mock service loads correctly');
} catch (error) {
  console.error('❌ Email mock service error:', error.message);
}

// Check theme provider
try {
  const theme = require('../lib/theme/provider');
// TODO: Replace with structured logging - console.log('✅ Theme provider loads correctly');
} catch (error) {
  console.error('❌ Theme provider error:', error.message);
}

// Check auth imports
try {
  const auth = require('../lib/auth/auth-client');
// TODO: Replace with structured logging - console.log('✅ Auth client loads correctly');
} catch (error) {
  console.error('❌ Auth client error:', error.message);
}

// Check API client
try {
  const api = require('../lib/api/trpc');
// TODO: Replace with structured logging - console.log('✅ API client loads correctly');
} catch (error) {
  console.error('❌ API client error:', error.message);
}

// Check navigation
try {
  const nav = require('../lib/navigation/navigation');
// TODO: Replace with structured logging - console.log('✅ Navigation loads correctly');
} catch (error) {
  console.error('❌ Navigation error:', error.message);
}

// TODO: Replace with structured logging - console.log('\n✅ Basic runtime checks complete!');