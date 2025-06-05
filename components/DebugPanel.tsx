// components/DebugPanel.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Platform } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { getLogHistory, clearLogHistory, exportLogs, LogLevel } from '@/lib/core/debug';

export function DebugPanel() {
  const [visible, setVisible] = useState(false);
  const [logs, setLogs] = useState(getLogHistory());
  const [logFilter, setLogFilter] = useState<LogLevel>(LogLevel.DEBUG);
  const { user, session, isAuthenticated } = useAuth();

  if (!__DEV__) return null;

  const refreshLogs = () => {
    setLogs(getLogHistory({ level: logFilter }));
  };

  const handleExport = () => {
    const logText = exportLogs();
    if (Platform.OS === 'web') {
      const blob = new Blob([logText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `debug-logs-${Date.now()}.txt`;
      a.click();
    } else {
      console.log('Debug logs:', logText);
    }
  };

  return (
    <>
      {/* Floating Debug Button */}
      <Pressable
        onPress={() => setVisible(true)}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          backgroundColor: '#6366f1',
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          zIndex: 1000,
        }}
      >
        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>🐛</Text>
      </Pressable>

      {/* Debug Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setVisible(false)}
          />
          <View
            style={{
              backgroundColor: 'white',
              minHeight: '70%',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Debug Panel</Text>
              <Pressable onPress={() => setVisible(false)}>
                <Text style={{ fontSize: 18 }}>✕</Text>
              </Pressable>
            </View>

            <ScrollView>
              {/* Auth State */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Auth State</Text>
                <View style={{ backgroundColor: '#f3f4f6', padding: 10, borderRadius: 8 }}>
                  <Text style={{ fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 12 }}>
                    Authenticated: {String(isAuthenticated)}
                  </Text>
                  <Text style={{ fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 12 }}>
                    User ID: {user?.id || 'None'}
                  </Text>
                  <Text style={{ fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 12 }}>
                    Email: {user?.email || 'None'}
                  </Text>
                  <Text style={{ fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 12 }}>
                    Role: {user?.role || 'None'}
                  </Text>
                  <Text style={{ fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 12 }}>
                    Needs Profile: {String(user?.needsProfileCompletion || false)}
                  </Text>
                  <Text style={{ fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 12 }}>
                    Session ID: {session?.id || 'None'}
                  </Text>
                </View>
              </View>

              {/* Log Controls */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Log Controls</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                  <Pressable
                    onPress={refreshLogs}
                    style={{
                      backgroundColor: '#3b82f6',
                      padding: 8,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: 'white' }}>Refresh</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      clearLogHistory();
                      refreshLogs();
                    }}
                    style={{
                      backgroundColor: '#ef4444',
                      padding: 8,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: 'white' }}>Clear</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleExport}
                    style={{
                      backgroundColor: '#10b981',
                      padding: 8,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: 'white' }}>Export</Text>
                  </Pressable>
                </View>

                {/* Log Filter */}
                <View style={{ flexDirection: 'row', gap: 5 }}>
                  {[LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG].map((level) => (
                    <Pressable
                      key={level}
                      onPress={() => {
                        setLogFilter(level);
                        setLogs(getLogHistory({ level }));
                      }}
                      style={{
                        backgroundColor: logFilter === level ? '#3b82f6' : '#e5e7eb',
                        padding: 6,
                        borderRadius: 4,
                      }}
                    >
                      <Text style={{ color: logFilter === level ? 'white' : 'black', fontSize: 12 }}>
                        {LogLevel[level]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Logs */}
              <View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
                  Logs ({logs.length})
                </Text>
                <ScrollView style={{ maxHeight: 300 }}>
                  {logs.map((log, index) => (
                    <View
                      key={index}
                      style={{
                        backgroundColor: '#f9fafb',
                        padding: 8,
                        marginBottom: 4,
                        borderRadius: 4,
                        borderLeftWidth: 3,
                        borderLeftColor:
                          log.level === LogLevel.ERROR
                            ? '#ef4444'
                            : log.level === LogLevel.WARN
                            ? '#f59e0b'
                            : log.level === LogLevel.INFO
                            ? '#3b82f6'
                            : '#6b7280',
                      }}
                    >
                      <Text style={{ fontSize: 10, color: '#6b7280' }}>
                        {log.timestamp.toLocaleTimeString()} [{LogLevel[log.level]}] {log.component}
                      </Text>
                      <Text style={{ fontSize: 12, marginTop: 2 }}>{log.message}</Text>
                      {log.data && (
                        <Text
                          style={{
                            fontSize: 10,
                            color: '#6b7280',
                            marginTop: 2,
                            fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
                          }}
                        >
                          {JSON.stringify(log.data, null, 2)}
                        </Text>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}