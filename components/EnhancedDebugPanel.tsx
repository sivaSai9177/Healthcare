import React, { useState, useEffect, useCallback, useMemo, useTransition, useDeferredValue } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  TextInput,
  StyleSheet,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '@/hooks/useAuth';
import { getLogHistory, clearLogHistory, LogLevel, LogEntry } from '@/lib/core/debug';
import { TanStackDebugInfo } from './TanStackDebugInfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BlurView } from 'expo-blur';
import { useTheme } from '@/lib/theme/provider';
import { useSpacingStore } from '@/lib/stores/spacing-store';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { useDebugStore } from '@/lib/stores/debug-store';
import { getNavigationHistory, clearNavigationHistory, getCurrentRoute } from '@/lib/core/debug/router-debug';

const LOG_COLORS = {
  [LogLevel.ERROR]: '#ef4444',
  [LogLevel.WARN]: '#f59e0b',
  [LogLevel.INFO]: '#3b82f6',
  [LogLevel.DEBUG]: '#10b981',
};

// Memoized log entry component for better performance
const LogEntryItem = React.memo(({ 
  logEntry, 
  onPress, 
  onLongPress 
}: { 
  logEntry: LogEntry; 
  onPress: () => void; 
  onLongPress: () => void;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        backgroundColor: '#fff',
        marginBottom: 8,
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: LOG_COLORS[logEntry.level],
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
        elevation: 1,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ 
          fontSize: 11,
          fontWeight: '600',
          color: LOG_COLORS[logEntry.level],
        }}>
          {LogLevel[logEntry.level]} • {logEntry.component}
        </Text>
        <Text style={{ fontSize: 10, color: '#9ca3af' }}>
          {logEntry.timestamp.toLocaleTimeString()}
        </Text>
      </View>
      <Text style={{ fontSize: 13, color: '#374151', marginBottom: 2 }}>
        {logEntry.message}
      </Text>
      {logEntry.data && (
        <Text style={{
          fontSize: 11,
          color: '#6b7280',
          fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
        }}>
          {JSON.stringify(logEntry.data, null, 2)}
        </Text>
      )}
      <Text style={{ 
        fontSize: 10, 
        color: '#9ca3af', 
        marginTop: 4,
        fontStyle: 'italic',
      }}>
        Tap to copy • Long press for details
      </Text>
    </TouchableOpacity>
  );
});

LogEntryItem.displayName = 'LogEntryItem';

export function EnhancedDebugPanel() {
  const [visible, setVisible] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<LogLevel>(LogLevel.DEBUG);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'logs' | 'router' | 'config'>('logs');
  const [isPending, startTransition] = useTransition();
  const { user, isAuthenticated, hasHydrated } = useAuth();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const spacingStore = useSpacingStore();
  const animationStore = useAnimationStore();
  const debugStore = useDebugStore();
  
  // Track render count
  const renderCount = React.useRef(0);
  React.useEffect(() => {
    renderCount.current += 1;
  });
  
  // Defer search query for better performance
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const refreshLogs = useCallback(() => {
    setLogs(getLogHistory({ level: logFilter }));
  }, [logFilter]);

  // Auto-refresh logs every second when panel is open
  useEffect(() => {
    if (visible) {
      refreshLogs();
      const interval = setInterval(refreshLogs, 1000);
      return () => clearInterval(interval);
    }
  }, [visible, refreshLogs]);

  // Memoize filtered logs for better performance
  const filteredLogs = useMemo(() => {
    const searchLower = deferredSearchQuery.toLowerCase();
    return logs.filter(log => {
      const matchesFilter = logFilter >= log.level;
      if (!matchesFilter) return false;
      
      if (!searchLower) return true;
      
      const matchesSearch = 
        log.message.toLowerCase().includes(searchLower) ||
        log.component.toLowerCase().includes(searchLower) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchLower));
      return matchesSearch;
    });
  }, [logs, logFilter, deferredSearchQuery]);

  // Memoize error count
  const errorCount = useMemo(() => 
    logs.filter(l => l.level === LogLevel.ERROR).length,
    [logs]
  );
  
  // Memoize log counts for filter buttons
  const logCounts = useMemo(() => ({
    [LogLevel.ERROR]: logs.filter(l => l.level === LogLevel.ERROR).length,
    [LogLevel.WARN]: logs.filter(l => l.level === LogLevel.WARN).length,
    [LogLevel.INFO]: logs.filter(l => l.level === LogLevel.INFO).length,
    [LogLevel.DEBUG]: logs.filter(l => l.level === LogLevel.DEBUG).length,
  }), [logs]);

  if (!__DEV__) return null;

  const handleExport = async () => {
    const logText = logs
      .map(log => 
        `[${log.timestamp.toISOString()}] [${LogLevel[log.level]}] [${log.component}] ${log.message}${
          log.data ? '\nData: ' + JSON.stringify(log.data, null, 2) : ''
        }`
      )
      .join('\n\n');
    
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(logText);
        Alert.alert('Success', 'Logs copied to clipboard');
      } catch (err) {
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-logs-${Date.now()}.txt`;
        a.click();
      }
    } else {
      // React Native clipboard
      await Clipboard.setStringAsync(logText);
      Alert.alert('Success', 'Logs copied to clipboard');
    }
  };

  const copyLogEntry = async (log: LogEntry) => {
    const logText = `[${log.timestamp.toISOString()}] [${LogLevel[log.level]}] [${log.component}] ${log.message}${
      log.data ? '\nData: ' + JSON.stringify(log.data, null, 2) : ''
    }`;
    
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(logText);
      } catch (err) {
        console.error('Failed to copy to clipboard', err);
      }
    } else {
      await Clipboard.setStringAsync(logText);
    }
    
    Alert.alert('Copied', 'Log entry copied to clipboard');
  };

  return (
    <>
      {/* Floating Debug Button */}
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={{
          position: 'absolute',
          bottom: 80,
          right: 20,
          backgroundColor: '#6366f1',
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 8,
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
          zIndex: 1000,
        }}
      >
        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>🐛</Text>
        {errorCount > 0 && (
          <View style={{
            position: 'absolute',
            top: -4,
            right: -4,
            backgroundColor: '#ef4444',
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 4,
          }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
              {errorCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Debug Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          {/* iOS-style Navigation Bar */}
          <View style={[styles.header, { 
            height: insets.top + 44,
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : theme.background + 'F0',
          }]}>
            {Platform.OS === 'ios' && (
              <BlurView
                intensity={100}
                tint={theme.background === '#ffffff' ? 'light' : 'dark'}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            
            <View style={[styles.headerContent, { marginTop: insets.top }]}>
              {/* Left close button */}
              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.closeButtonText, { color: '#007AFF' }]}>
                  Close
                </Text>
              </TouchableOpacity>
              
              {/* Center title */}
              <View style={styles.headerTitleContainer}>
                <Text style={[styles.headerTitle, { color: theme.foreground }]}>
                  Debug Console
                </Text>
              </View>
              
              {/* Empty right side for balance */}
              <View style={{ width: 60 }} />
            </View>
          </View>

          {/* Main Content Container - positioned below header */}
          <View style={{ 
            flex: 1, 
            backgroundColor: '#f9fafb',
            marginTop: insets.top + 44, // Push content below header
          }}>

          {/* Platform & Auth State Info */}
          <TouchableOpacity
            onLongPress={async () => {
              const platformInfo = `Platform: ${Platform.OS} | Version: ${Platform.Version || 'N/A'} | ${Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'}\nAuth: ${isAuthenticated ? '✅' : '❌'} | Hydrated: ${hasHydrated ? '✅' : '❌'} | User: ${user?.email || 'None'} | Role: ${user?.role || 'None'}\nAPI: ${process.env.EXPO_PUBLIC_API_URL || 'Not set'} | Env: ${process.env.EXPO_PUBLIC_ENVIRONMENT || 'dev'}`;
              
              if (Platform.OS === 'web') {
                await navigator.clipboard.writeText(platformInfo);
              } else {
                await Clipboard.setStringAsync(platformInfo);
              }
              Alert.alert('Copied', 'Platform info copied to clipboard');
            }}
            style={{
              backgroundColor: '#eff6ff',
              padding: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#dbeafe',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#1e40af', fontWeight: '600' }}>
                {Platform.OS === 'ios' ? '🍎' : Platform.OS === 'android' ? '🤖' : '🌐'} {Platform.OS.toUpperCase()} {Platform.Version ? `v${Platform.Version}` : ''}
              </Text>
              <Text style={{ fontSize: 10, color: '#6b7280', fontStyle: 'italic' }}>
                Long press to copy
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#1e40af', fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), marginTop: 4 }}>
              Auth: {isAuthenticated ? '✅' : '❌'} | Hydrated: {hasHydrated ? '✅' : '❌'} | User: {user?.email || 'None'} | Role: {user?.role || 'None'}
            </Text>
            <Text style={{ fontSize: 11, color: '#1e40af', marginTop: 4 }}>
              API: {process.env.EXPO_PUBLIC_API_URL || 'Not set'} | Env: {process.env.EXPO_PUBLIC_ENVIRONMENT || 'dev'}
            </Text>
          </TouchableOpacity>

          {/* Tab Navigation */}
          <View style={{ 
            flexDirection: 'row', 
            backgroundColor: '#fff',
            paddingHorizontal: 12,
            paddingTop: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#e5e7eb',
          }}>
            <TouchableOpacity
              onPress={() => setActiveTab('logs')}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: 'center',
                borderBottomWidth: 2,
                borderBottomColor: activeTab === 'logs' ? '#6366f1' : 'transparent',
              }}
            >
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '600',
                color: activeTab === 'logs' ? '#6366f1' : '#6b7280',
              }}>
                Logs
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setActiveTab('router')}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: 'center',
                borderBottomWidth: 2,
                borderBottomColor: activeTab === 'router' ? '#6366f1' : 'transparent',
              }}
            >
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '600',
                color: activeTab === 'router' ? '#6366f1' : '#6b7280',
              }}>
                Router
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setActiveTab('config')}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: 'center',
                borderBottomWidth: 2,
                borderBottomColor: activeTab === 'config' ? '#6366f1' : 'transparent',
              }}
            >
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '600',
                color: activeTab === 'config' ? '#6366f1' : '#6b7280',
              }}>
                Config
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar (only for logs tab) */}
          {activeTab === 'logs' && (
            <View style={{ padding: 12, backgroundColor: '#fff' }}>
              <TextInput
                placeholder="Search logs..."
                value={searchQuery}
                onChangeText={(text) => {
                  startTransition(() => {
                    setSearchQuery(text);
                  });
                }}
                style={{
                  backgroundColor: '#f3f4f6',
                  padding: 8,
                  borderRadius: 8,
                  fontSize: 14,
                  opacity: isPending ? 0.6 : 1,
                }}
              />
            </View>
          )}

          {/* Filter and Actions (only for logs tab) */}
          {activeTab === 'logs' && (
            <View style={{ backgroundColor: '#fff', paddingBottom: 12 }}>
              {/* Log Level Filter */}
              <ScrollView 
                horizontal 
                style={{ paddingHorizontal: 12 }}
                showsHorizontalScrollIndicator={false}
              >
              {[LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG].map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setLogFilter(level)}
                  style={{
                    backgroundColor: logFilter >= level ? '#6366f1' : '#e5e7eb',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ 
                    color: logFilter >= level ? 'white' : '#6b7280',
                    fontSize: 12,
                    fontWeight: '600',
                  }}>
                    {LogLevel[level]} ({logCounts[level]})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 12, marginTop: 12, gap: 8 }}>
              <TouchableOpacity
                onPress={refreshLogs}
                style={{
                  backgroundColor: '#3b82f6',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                  Refresh
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Clear Logs',
                    'Are you sure you want to clear all logs?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Clear', 
                        style: 'destructive',
                        onPress: () => {
                          clearLogHistory();
                          refreshLogs();
                        }
                      }
                    ]
                  );
                }}
                style={{
                  backgroundColor: '#ef4444',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                  Clear
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleExport}
                style={{
                  backgroundColor: '#10b981',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                  Copy All
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          )}

          {/* Content Area */}
          <ScrollView style={{ flex: 1, padding: 12 }}>
            {activeTab === 'logs' ? (
              // Logs Tab Content
              filteredLogs.length === 0 ? (
                <Text style={{ textAlign: 'center', marginTop: 40, fontSize: 16, color: '#9ca3af' }}>
                  No logs to display
                </Text>
              ) : (
              filteredLogs.map((logEntry) => (
                <LogEntryItem
                  key={logEntry.id}
                  logEntry={logEntry}
                  onPress={() => copyLogEntry(logEntry)}
                  onLongPress={() => {
                    Alert.alert(
                      'Log Details',
                      `${logEntry.message}\n\nComponent: ${logEntry.component}${
                        logEntry.data ? '\n\nData: ' + JSON.stringify(logEntry.data, null, 2) : ''
                      }`,
                      [
                        { text: 'Copy', onPress: () => copyLogEntry(logEntry) },
                        { text: 'OK', style: 'cancel' }
                      ]
                    );
                  }}
                />
              ))
              )
            ) : activeTab === 'config' ? (
              // Config Tab Content (merged Theme + Settings + TanStack)
              <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }}>
                {/* Spacing Controls */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                    Spacing System
                  </Text>
                  
                  <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                    Theme: {spacingStore.theme}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <TouchableOpacity
                      onPress={() => spacingStore.setTheme('default')}
                      style={{
                        backgroundColor: spacingStore.theme === 'default' ? '#6366f1' : '#e5e7eb',
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                      }}
                    >
                      <Text style={{ 
                        color: spacingStore.theme === 'default' ? 'white' : '#6b7280',
                        fontSize: 12,
                        fontWeight: '600',
                      }}>
                        Default
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => spacingStore.setTheme('golden')}
                      style={{
                        backgroundColor: spacingStore.theme === 'golden' ? '#6366f1' : '#e5e7eb',
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                      }}
                    >
                      <Text style={{ 
                        color: spacingStore.theme === 'golden' ? 'white' : '#6b7280',
                        fontSize: 12,
                        fontWeight: '600',
                      }}>
                        Golden Ratio
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                    Density: {spacingStore.density}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['compact', 'medium', 'large'] as const).map((density) => (
                      <TouchableOpacity
                        key={density}
                        onPress={() => spacingStore.setDensity(density)}
                        style={{
                          backgroundColor: spacingStore.density === density ? '#6366f1' : '#e5e7eb',
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 20,
                        }}
                      >
                        <Text style={{ 
                          color: spacingStore.density === density ? 'white' : '#6b7280',
                          fontSize: 12,
                          fontWeight: '600',
                          textTransform: 'capitalize',
                        }}>
                          {density}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Animation Controls */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                    Animation Settings
                  </Text>
                  
                  <View style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, color: '#4b5563' }}>Animations Enabled</Text>
                      <TouchableOpacity
                        onPress={() => animationStore.setEnableAnimations(!animationStore.enableAnimations)}
                        style={{
                          width: 50,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: animationStore.enableAnimations ? '#6366f1' : '#e5e7eb',
                          justifyContent: 'center',
                          paddingHorizontal: 2,
                        }}
                      >
                        <View style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: 'white',
                          transform: [{ translateX: animationStore.enableAnimations ? 22 : 2 }],
                        }} />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 14, color: '#4b5563' }}>Debug Mode</Text>
                      <TouchableOpacity
                        onPress={() => animationStore.setDebugMode(!animationStore.debugMode)}
                        style={{
                          width: 50,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: animationStore.debugMode ? '#ef4444' : '#e5e7eb',
                          justifyContent: 'center',
                          paddingHorizontal: 2,
                        }}
                      >
                        <View style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: 'white',
                          transform: [{ translateX: animationStore.debugMode ? 22 : 2 }],
                        }} />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: '#4b5563' }}>Animation Speed</Text>
                      <Text style={{ fontSize: 14, color: '#6b7280' }}>{animationStore.animationSpeed}x</Text>
                    </View>
                  </View>
                </View>
                
                {/* Theme Info */}
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                    Theme Colors
                  </Text>
                  
                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: '#6b7280' }}>Background</Text>
                      <Text style={{ fontSize: 12, fontFamily: 'monospace', color: '#4b5563' }}>{theme.background}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: '#6b7280' }}>Foreground</Text>
                      <Text style={{ fontSize: 12, fontFamily: 'monospace', color: '#4b5563' }}>{theme.foreground}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12, color: '#6b7280' }}>Primary</Text>
                      <Text style={{ fontSize: 12, fontFamily: 'monospace', color: '#4b5563' }}>{theme.primary}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : activeTab === 'router' ? (
              // Router Tab Content
              <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 16 }}>
                {/* Rendering Info */}
                <View style={{ backgroundColor: '#fef3c7', padding: 12, borderRadius: 6, marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#92400e', marginBottom: 4 }}>
                    Rendering Info
                  </Text>
                  <Text style={{ fontSize: 11, color: '#78350f' }}>
                    Debug Panel Renders: {renderCount.current}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#78350f', marginTop: 2 }}>
                    React: {React.version} | Platform: {Platform.OS} {Platform.Version ? `v${Platform.Version}` : ''}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#78350f', marginTop: 2 }}>
                    Current Screen: {getCurrentRoute()?.pathname || 'Unknown'}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#78350f', marginTop: 2 }}>
                    Auth State: {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'} | Hydrated: {hasHydrated ? '✅' : '❌'}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#78350f', marginTop: 2 }}>
                    User Role: {user?.role || 'None'} | Email: {user?.email || 'None'}
                  </Text>
                </View>
                
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                    Navigation History
                  </Text>
                  
                  {/* Current Route */}
                  {getCurrentRoute() && (
                    <View style={{ backgroundColor: '#f3f4f6', padding: 12, borderRadius: 6, marginBottom: 12 }}>
                      <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Current Route</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#1f2937' }}>
                        {getCurrentRoute()?.pathname}
                      </Text>
                      {Object.keys(getCurrentRoute()?.params || {}).length > 0 && (
                        <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                          Params: {JSON.stringify(getCurrentRoute()?.params)}
                        </Text>
                      )}
                    </View>
                  )}
                  
                  {/* Clear History Button */}
                  <TouchableOpacity
                    onPress={() => {
                      clearNavigationHistory();
                      Alert.alert('Success', 'Navigation history cleared');
                    }}
                    style={{
                      backgroundColor: '#ef4444',
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 6,
                      marginBottom: 12,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                      Clear History
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Navigation History List */}
                  <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                    History (Last 20):
                  </Text>
                  
                  {/* Copy All History Button */}
                  <TouchableOpacity
                    onPress={async () => {
                      const history = getNavigationHistory().slice(-20).reverse();
                      const historyText = history.map(route => 
                        `[${route.timestamp.toLocaleTimeString()}] ${route.method.toUpperCase()}: ${route.pathname}${Object.keys(route.params).length > 0 ? ` • Params: ${JSON.stringify(route.params)}` : ''}`
                      ).join('\n');
                      
                      if (Platform.OS === 'web') {
                        await navigator.clipboard.writeText(historyText);
                      } else {
                        await Clipboard.setStringAsync(historyText);
                      }
                      Alert.alert('Copied', 'Navigation history copied to clipboard');
                    }}
                    style={{
                      backgroundColor: '#10b981',
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 6,
                      marginBottom: 12,
                      alignSelf: 'flex-start',
                      marginLeft: 8,
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                      Copy All
                    </Text>
                  </TouchableOpacity>
                  
                  <ScrollView style={{ maxHeight: 300 }}>
                    {getNavigationHistory().slice(-20).reverse().map((route, index) => (
                      <TouchableOpacity
                        key={`${route.timestamp.getTime()}-${index}`}
                        onPress={async () => {
                          const routeText = `[${route.timestamp.toLocaleTimeString()}] ${route.method.toUpperCase()}: ${route.pathname}${Object.keys(route.params).length > 0 ? ` • Params: ${JSON.stringify(route.params)}` : ''}`;
                          
                          if (Platform.OS === 'web') {
                            await navigator.clipboard.writeText(routeText);
                          } else {
                            await Clipboard.setStringAsync(routeText);
                          }
                          Alert.alert('Copied', 'Route copied to clipboard');
                        }}
                        onLongPress={() => {
                          Alert.alert(
                            'Route Details',
                            `Path: ${route.pathname}\nMethod: ${route.method}\nTime: ${route.timestamp.toLocaleTimeString()}${
                              Object.keys(route.params).length > 0 ? '\nParams: ' + JSON.stringify(route.params, null, 2) : ''
                            }`,
                            [{ text: 'OK', style: 'cancel' }]
                          );
                        }}
                        style={{
                          backgroundColor: '#f9fafb',
                          padding: 8,
                          marginBottom: 4,
                          borderRadius: 4,
                          borderLeftWidth: 3,
                          borderLeftColor: 
                            route.method === 'replace' ? '#3b82f6' :
                            route.method === 'push' ? '#10b981' :
                            route.method === 'back' ? '#f59e0b' : '#6b7280',
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: '#1f2937' }}>
                            {route.pathname}
                          </Text>
                          <Text style={{ fontSize: 10, color: '#6b7280' }}>
                            {route.timestamp.toLocaleTimeString()}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
                          {route.method.toUpperCase()}
                          {Object.keys(route.params).length > 0 && ` • ${JSON.stringify(route.params)}`}
                        </Text>
                        <Text style={{ 
                          fontSize: 10, 
                          color: '#9ca3af', 
                          marginTop: 4,
                          fontStyle: 'italic',
                        }}>
                          Tap to copy • Long press for details
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                
                {/* TanStack Query Info */}
                <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                    TanStack Query
                  </Text>
                  <TanStackDebugInfo />
                </View>
                
                {/* Debug Settings */}
                <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 16 }}>
                    Debug Settings
                  </Text>
                
                {/* Logging Settings */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 12, color: '#374151' }}>
                    Logging
                  </Text>
                  
                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: '#4b5563' }}>tRPC Logging</Text>
                      <TouchableOpacity
                        onPress={() => debugStore.updateSettings({ enableTRPCLogging: !debugStore.enableTRPCLogging })}
                        style={{
                          width: 50,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: debugStore.enableTRPCLogging ? '#6366f1' : '#e5e7eb',
                          justifyContent: 'center',
                          paddingHorizontal: 2,
                        }}
                      >
                        <View style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: 'white',
                          transform: [{ translateX: debugStore.enableTRPCLogging ? 22 : 2 }],
                        }} />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: '#4b5563' }}>Router Logging</Text>
                      <TouchableOpacity
                        onPress={() => debugStore.updateSettings({ enableRouterLogging: !debugStore.enableRouterLogging })}
                        style={{
                          width: 50,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: debugStore.enableRouterLogging ? '#6366f1' : '#e5e7eb',
                          justifyContent: 'center',
                          paddingHorizontal: 2,
                        }}
                      >
                        <View style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: 'white',
                          transform: [{ translateX: debugStore.enableRouterLogging ? 22 : 2 }],
                        }} />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: '#4b5563' }}>Auth Logging</Text>
                      <TouchableOpacity
                        onPress={() => debugStore.updateSettings({ enableAuthLogging: !debugStore.enableAuthLogging })}
                        style={{
                          width: 50,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: debugStore.enableAuthLogging ? '#6366f1' : '#e5e7eb',
                          justifyContent: 'center',
                          paddingHorizontal: 2,
                        }}
                      >
                        <View style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: 'white',
                          transform: [{ translateX: debugStore.enableAuthLogging ? 22 : 2 }],
                        }} />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: '#4b5563' }}>Log Level</Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {(['debug', 'info', 'warn', 'error'] as const).map((level) => (
                          <TouchableOpacity
                            key={level}
                            onPress={() => debugStore.setLogLevel(level)}
                            style={{
                              backgroundColor: debugStore.logLevel === level ? '#6366f1' : '#e5e7eb',
                              paddingHorizontal: 12,
                              paddingVertical: 4,
                              borderRadius: 12,
                            }}
                          >
                            <Text style={{ 
                              color: debugStore.logLevel === level ? 'white' : '#6b7280',
                              fontSize: 11,
                              fontWeight: '600',
                              textTransform: 'uppercase',
                            }}>
                              {level}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
                
                {/* Network Settings */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 12, color: '#374151' }}>
                    Network
                  </Text>
                  
                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: '#4b5563' }}>Show Network Requests</Text>
                      <TouchableOpacity
                        onPress={() => debugStore.updateSettings({ showNetworkRequests: !debugStore.showNetworkRequests })}
                        style={{
                          width: 50,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: debugStore.showNetworkRequests ? '#6366f1' : '#e5e7eb',
                          justifyContent: 'center',
                          paddingHorizontal: 2,
                        }}
                      >
                        <View style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: 'white',
                          transform: [{ translateX: debugStore.showNetworkRequests ? 22 : 2 }],
                        }} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                
                {/* Reset Button */}
                <TouchableOpacity
                  onPress={() => {
                    debugStore.resetSettings();
                    Alert.alert('Success', 'Debug settings reset to defaults');
                  }}
                  style={{
                    backgroundColor: '#6b7280',
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignSelf: 'center',
                    marginTop: 20,
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                    Reset to Defaults
                  </Text>
                </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 44,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  closeButton: {
    width: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 17,
    fontWeight: '400',
  },
});