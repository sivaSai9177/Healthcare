#!/usr/bin/env bun
import * as Clipboard from 'expo-clipboard';

async function testClipboard() {
  console.log('Testing clipboard functionality...');
  
  try {
    // Test writing to clipboard
    const testText = 'Test clipboard text ' + new Date().toISOString();
    console.log('Writing to clipboard:', testText);
    
    await Clipboard.setStringAsync(testText);
    console.log('✅ Successfully wrote to clipboard');
    
    // Test reading from clipboard
    const readText = await Clipboard.getStringAsync();
    console.log('Read from clipboard:', readText);
    
    if (readText === testText) {
      console.log('✅ Clipboard read/write test passed');
    } else {
      console.log('❌ Clipboard read/write test failed - text mismatch');
    }
  } catch (error) {
    console.error('❌ Clipboard test failed:', error);
  }
}

testClipboard();