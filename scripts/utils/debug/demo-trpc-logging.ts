#!/usr/bin/env bun
/**
 * Demo script showing TRPC logging integration with external service
 */

import { logger } from '@/lib/core/debug/unified-logger';

async function demoTRPCLogging() {

  // Check if logging service is running

  try {
    const healthRes = await fetch('http://localhost:3003/health');
    const health = await healthRes.json();

  } catch (error) {
    console.error('❌ Logging service not available. Please start it first.');

    return;
  }

}

// Run the demo
demoTRPCLogging().catch(console.error);