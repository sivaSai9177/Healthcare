import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useDebugStore } from '@/lib/stores/debug-store';

export default function TestDebugCopyScreen() {
  const { logs, addLog } = useDebugStore();
  
  useEffect(() => {
    // Add some test logs
    addLog({
      level: 'info',
      message: 'Test info log for copy functionality',
      source: 'TestDebugCopy',
      timestamp: new Date(),
      data: { test: true, value: 123 }
    });
    
    addLog({
      level: 'error',
      message: 'Test error log for copy functionality',
      source: 'TestDebugCopy',
      timestamp: new Date(),
      data: { error: 'Test error', code: 'TEST_001' }
    });
  }, []);
  
  const testCopy = async (text: string) => {
    console.log('[TestDebugCopy] Attempting to copy:', text);
    try {
      await Clipboard.setStringAsync(text);
      console.log('[TestDebugCopy] Copy successful');
      Alert.alert('Success', 'Text copied to clipboard');
    } catch (error) {
      console.error('[TestDebugCopy] Copy failed:', error);
      Alert.alert('Error', `Failed to copy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 100 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Debug Copy Test
      </Text>
      
      <TouchableOpacity
        onPress={() => testCopy('Simple test text')}
        style={{ 
          backgroundColor: '#3b82f6', 
          padding: 15, 
          borderRadius: 8,
          marginBottom: 20 
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Test Simple Copy
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={() => testCopy(JSON.stringify({ test: true, data: 'complex' }, null, 2))}
        style={{ 
          backgroundColor: '#10b981', 
          padding: 15, 
          borderRadius: 8,
          marginBottom: 20 
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          Test JSON Copy
        </Text>
      </TouchableOpacity>
      
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
          Debug Logs ({logs.length}):
        </Text>
        {logs.slice(-5).map((log, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => testCopy(`[${log.level.toUpperCase()}] ${log.message}`)}
            style={{
              backgroundColor: log.level === 'error' ? '#fee' : '#f0f0f0',
              padding: 10,
              marginBottom: 5,
              borderRadius: 5
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: 'bold' }}>
              {log.level.toUpperCase()} - {log.source}
            </Text>
            <Text style={{ fontSize: 14 }}>
              {log.message}
            </Text>
            <Text style={{ fontSize: 10, color: '#666' }}>
              Tap to copy
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}