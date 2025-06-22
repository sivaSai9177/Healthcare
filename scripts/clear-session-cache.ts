#!/usr/bin/env tsx
// Clear all session caches to force fresh data

async function clearCache() {
  console.log('🧹 Clearing session cache...\n');
  
  try {
    // Make a request to a special endpoint or use the API directly
    const response = await fetch('http://localhost:8081/api/auth/clear-cache', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('✅ Cache cleared successfully');
    } else {
      console.log('❌ Failed to clear cache:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    console.log('\nAlternatively, you can restart the server to clear all caches.');
  }
}

clearCache();