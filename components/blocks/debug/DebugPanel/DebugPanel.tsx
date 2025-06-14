import React, { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react';
import {
  View,
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
import { TanStackDebugInfo } from './TanStackDebugInfoMigrated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useSpacingStore } from '@/lib/stores/spacing-store';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { useDebugStore } from '@/lib/stores/debug-store';
import { cn } from '@/lib/core/utils';
import { Text, VStack, HStack, Button, Card, Switch } from '@/components/universal';
import { Download, Trash2, Info } from '@/components/universal/display/Symbols';
import { useShadow } from '@/hooks/useShadow';
import Animated, { FadeIn } from 'react-native-reanimated';
import { debugLog, type LogLevel, type DebugLog, exportLogs } from '../utils/logger';
import { startConsoleInterception, stopConsoleInterception } from '../utils/console-interceptor';
import { getNavigationHistory, clearNavigationHistory, getCurrentRoute } from '@/lib/core/debug/router-debug';

const AnimatedView = Animated.View;

// Log level colors using Tailwind classes
const LOG_LEVEL_CLASSES = {
  error: 'border-destructive bg-destructive/10',
  warn: 'border-warning bg-warning/10',
  info: 'border-primary bg-primary/10',
  debug: 'border-success bg-success/10',
} as const;

// Memoized log entry component
const LogEntryItem = React.memo(({ 
  log, 
  onPress, 
  onLongPress 
}: { 
  log: DebugLog; 
  onPress: () => void; 
  onLongPress: () => void;
}) => {
  const shadowSm = useShadow({ size: 'sm' });
  
  return (
    <AnimatedView entering={FadeIn.springify()}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        className={cn(
          "mb-2 p-3 rounded-lg border-l-4",
          LOG_LEVEL_CLASSES[log.level]
        )}
        style={shadowSm}
      >
        <HStack justify="between" className="mb-1">
          <Text 
            size="xs" 
            weight="semibold"
            className={cn(
              log.level === 'error' && 'text-destructive',
              log.level === 'warn' && 'text-warning',
              log.level === 'info' && 'text-primary',
              log.level === 'debug' && 'text-success'
            )}
          >
            {log.level.toUpperCase()} {log.source && `• ${log.source}`}
          </Text>
          <Text size="xs" colorTheme="mutedForeground">
            {log.timestamp.toLocaleTimeString()}
          </Text>
        </HStack>
        
        <Text size="sm" className="mb-1">
          {log.message}
        </Text>
        
        {log.data && (
          <Text 
            size="xs" 
            colorTheme="mutedForeground"
            style={{ fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) }}
          >
            {JSON.stringify(log.data, null, 2)}
          </Text>
        )}
        
        <Text size="xs" colorTheme="mutedForeground" className="mt-2 italic">
          Tap to copy • Long press for details
        </Text>
      </TouchableOpacity>
    </AnimatedView>
  );
});

LogEntryItem.displayName = 'LogEntryItem';

export function ConsolidatedDebugPanel() {
  const [visible, setVisible] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [logFilter, setLogFilter] = useState<LogLevel>('debug');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'logs' | 'router' | 'config'>('logs');
  const [consoleIntercept, setConsoleIntercept] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const spacingStore = useSpacingStore();
  const animationStore = useAnimationStore();
  const debugStore = useDebugStore();
  const shadowLg = useShadow({ size: 'lg' });
  
  // Defer search query for better performance
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Subscribe to log updates
  useEffect(() => {
    const unsubscribe = debugLog.subscribe(setLogs);
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Memoize filtered logs
  const filteredLogs = useMemo(() => {
    const searchLower = deferredSearchQuery.toLowerCase();
    const levelPriority = { error: 0, warn: 1, info: 2, debug: 3 };
    const filterPriority = levelPriority[logFilter];
    
    return logs.filter(log => {
      const logPriority = levelPriority[log.level];
      const matchesFilter = logPriority <= filterPriority;
      if (!matchesFilter) return false;
      
      if (!searchLower) return true;
      
      const matchesSearch = 
        log.message.toLowerCase().includes(searchLower) ||
        (log.source && log.source.toLowerCase().includes(searchLower)) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchLower));
      return matchesSearch;
    });
  }, [logs, logFilter, deferredSearchQuery]);

  // Memoize error count
  const errorCount = useMemo(() => 
    debugLog.getErrorCount(),
    [] // getErrorCount doesn't depend on logs state
  );
  
  // Memoize log counts for filter buttons
  const logCounts = useMemo(() => ({
    error: logs.filter(l => l.level === 'error').length,
    warn: logs.filter(l => l.level === 'warn').length,
    info: logs.filter(l => l.level === 'info').length,
    debug: logs.filter(l => l.level === 'debug').length,
  }), [logs]);

  // Handle console interception toggle
  const handleConsoleInterceptToggle = useCallback((value: boolean) => {
    setConsoleIntercept(value);
    if (value) {
      startConsoleInterception();
    } else {
      stopConsoleInterception();
    }
  }, []);

  if (!__DEV__) return null;

  const handleExport = async () => {
    const logText = exportLogs(filteredLogs);
    
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(logText);
        Alert.alert('Success', 'Logs copied to clipboard');
      } catch {
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-logs-${Date.now()}.txt`;
        a.click();
      }
    } else {
      await Clipboard.setStringAsync(logText);
      Alert.alert('Success', 'Logs copied to clipboard');
    }
  };

  const copyLogEntry = async (log: DebugLog) => {
    const logText = exportLogs([log]);
    
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(logText);
      } catch {
        console.error('Failed to copy to clipboard');
      }
    } else {
      await Clipboard.setStringAsync(logText);
    }
    
    Alert.alert('Copied', 'Log entry copied to clipboard');
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            debugLog.clear();
            setLogs([]);
          }
        },
      ]
    );
  };

  return (
    <>
      {/* Floating Debug Button */}
      <AnimatedView
        entering={FadeIn.delay(500).springify()}
        className="absolute bottom-20 right-5 z-50"
        style={shadowLg}
      >
        <TouchableOpacity
          onPress={() => setVisible(true)}
          className="bg-primary w-14 h-14 rounded-full items-center justify-center"
        >
          <Text className="text-2xl">🐛</Text>
          {errorCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-destructive rounded-full min-w-[20px] h-5 items-center justify-center px-1">
              <Text size="xs" weight="bold" className="text-destructive-foreground">
                {errorCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </AnimatedView>

      {/* Debug Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setVisible(false)}
      >
        <View className="flex-1 bg-background">
          {/* Header */}
          <View 
            className={cn(
              "bg-background/95 border-b border-border",
              Platform.OS === 'ios' && "absolute top-0 left-0 right-0 z-10"
            )}
            style={{ paddingTop: insets.top }}
          >
            {Platform.OS === 'ios' && (
              <BlurView
                intensity={100}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            
            <HStack className="h-11 px-4" align="center">
              <TouchableOpacity
                onPress={() => setVisible(false)}
                className="p-2"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text size="lg" weight="bold">✕</Text>
              </TouchableOpacity>
              
              <View className="flex-1 items-center">
                <Text size="lg" weight="semibold">Debug Console</Text>
              </View>
              
              <View className="w-9" />
            </HStack>
          </View>

          {/* Main Content */}
          <ScrollView 
            className="flex-1"
            style={{ marginTop: Platform.OS === 'ios' ? insets.top + 44 : 0 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          >
            {/* Platform Info */}
            <TouchableOpacity
              onLongPress={async () => {
                const platformInfo = `Platform: ${Platform.OS} | Version: ${Platform.Version || 'N/A'}
Auth: ${isAuthenticated ? '✅' : '❌'} | User: ${user?.email || 'None'} | Role: ${user?.role || 'None'}
Environment: ${process.env.EXPO_PUBLIC_ENVIRONMENT || 'dev'}`;
                
                await Clipboard.setStringAsync(platformInfo);
                Alert.alert('Copied', 'Platform info copied to clipboard');
              }}
              className="bg-primary/10 p-3 border-b border-primary/20"
            >
              <HStack justify="between" align="center">
                <Text size="sm" weight="semibold" className="text-primary">
                  {Platform.OS === 'ios' ? '🍎' : Platform.OS === 'android' ? '🤖' : '🌐'} {Platform.OS.toUpperCase()} {Platform.Version ? `v${Platform.Version}` : ''}
                </Text>
                <Text size="xs" colorTheme="mutedForeground" className="italic">
                  Long press to copy
                </Text>
              </HStack>
              <Text size="xs" className="text-primary mt-1" style={{ fontFamily: 'monospace' }}>
                Auth: {isAuthenticated ? '✅' : '❌'} | User: {user?.email || 'None'} | Role: {user?.role || 'None'}
              </Text>
            </TouchableOpacity>

            {/* Tab Navigation */}
            <HStack className="bg-card p-2 border-b border-border">
              {(['logs', 'router', 'config'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-2 items-center rounded-md",
                    activeTab === tab && "bg-primary/10"
                  )}
                >
                  <Text 
                    size="sm" 
                    weight={activeTab === tab ? 'semibold' : 'normal'}
                    className={activeTab === tab ? 'text-primary' : 'text-muted-foreground'}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </HStack>

            {/* Tab Content */}
            {activeTab === 'logs' && (
              <VStack className="p-4" gap={3}>
                {/* Log Controls */}
                <Card className="p-3">
                  <VStack gap={2}>
                    {/* Search */}
                    <TextInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Search logs..."
                      className="bg-muted rounded-lg px-3 py-2 text-sm"
                      placeholderTextColor="#9ca3af"
                    />
                    
                    {/* Filter Buttons */}
                    <HStack gap={1}>
                      {(['error', 'warn', 'info', 'debug'] as const).map((level) => (
                        <TouchableOpacity
                          key={level}
                          onPress={() => setLogFilter(level)}
                          className={cn(
                            "flex-1 py-1 px-2 rounded-md items-center",
                            logFilter === level ? 'bg-primary' : 'bg-muted'
                          )}
                        >
                          <Text 
                            size="xs" 
                            weight="semibold"
                            className={logFilter === level ? 'text-primary-foreground' : 'text-muted-foreground'}
                          >
                            {level.toUpperCase()} ({logCounts[level]})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </HStack>
                    
                    {/* Actions */}
                    <HStack gap={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        onPress={handleExport}
                        className="flex-1"
                      >
                        <HStack gap={1} align="center">
                          <Download size={16} />
                          <Text>Export</Text>
                        </HStack>
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onPress={handleClearLogs}
                        className="flex-1"
                      >
                        <HStack gap={1} align="center">
                          <Trash2 size={16} />
                          <Text>Clear</Text>
                        </HStack>
                      </Button>
                    </HStack>
                    
                    {/* Console Interception Toggle */}
                    <HStack justify="between" align="center" className="pt-2 border-t border-border">
                      <Text size="sm">Intercept Console</Text>
                      <Switch
                        checked={consoleIntercept}
                        onCheckedChange={handleConsoleInterceptToggle}
                      />
                    </HStack>
                  </VStack>
                </Card>
                
                {/* Log Entries */}
                <VStack gap={2}>
                  <Text size="sm" weight="semibold" colorTheme="mutedForeground">
                    {filteredLogs.length} logs {searchQuery && '(filtered)'}
                  </Text>
                  
                  {filteredLogs.length === 0 ? (
                    <Card className="p-8 items-center">
                      <Info size={48} className="text-muted-foreground mb-2" />
                      <Text colorTheme="mutedForeground">No logs to display</Text>
                    </Card>
                  ) : (
                    filteredLogs.map((log, index) => (
                      <LogEntryItem
                        key={`${log.timestamp.getTime()}-${index}`}
                        log={log}
                        onPress={() => copyLogEntry(log)}
                        onLongPress={() => {
                          Alert.alert(
                            'Log Details',
                            exportLogs([log]),
                            [
                              { text: 'Copy', onPress: () => copyLogEntry(log) },
                              { text: 'OK' },
                            ]
                          );
                        }}
                      />
                    ))
                  )}
                </VStack>
              </VStack>
            )}
            
            {activeTab === 'router' && (
              <VStack className="p-4" gap={3}>
                <Card className="p-4">
                  <VStack gap={2}>
                    <Text size="lg" weight="semibold">Navigation History</Text>
                    <Text size="sm" colorTheme="mutedForeground">
                      Current Route: {(() => {
                        const route = getCurrentRoute();
                        return typeof route === 'string' ? route : 'Unknown';
                      })()}
                    </Text>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => {
                        clearNavigationHistory();
                        Alert.alert('Success', 'Navigation history cleared');
                      }}
                    >
                      Clear History
                    </Button>
                    
                    <VStack gap={1} className="mt-2">
                      {getNavigationHistory().map((entry, index) => (
                        <HStack key={index} className="py-2 border-b border-border">
                          <Text size="xs" colorTheme="mutedForeground" className="w-20">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </Text>
                          <Text size="sm" className="flex-1">{entry.pathname}</Text>
                        </HStack>
                      ))}
                    </VStack>
                  </VStack>
                </Card>
              </VStack>
            )}
            
            {activeTab === 'config' && (
              <VStack className="p-4" gap={3}>
                {/* Debug Settings */}
                <Card className="p-4">
                  <VStack gap={3}>
                    <Text size="lg" weight="semibold">Debug Settings</Text>
                    
                    <HStack justify="between" align="center">
                      <Text size="sm">Enable tRPC Logging</Text>
                      <Switch
                        checked={debugStore.enableTRPCLogging}
                        onCheckedChange={(checked) => debugStore.updateSettings({ enableTRPCLogging: checked })}
                      />
                    </HStack>
                    
                    <HStack justify="between" align="center">
                      <Text size="sm">Enable Router Logging</Text>
                      <Switch
                        checked={debugStore.enableRouterLogging}
                        onCheckedChange={(checked) => debugStore.updateSettings({ enableRouterLogging: checked })}
                      />
                    </HStack>
                    
                    <HStack justify="between" align="center">
                      <Text size="sm">Enable Auth Logging</Text>
                      <Switch
                        checked={debugStore.enableAuthLogging}
                        onCheckedChange={(checked) => debugStore.updateSettings({ enableAuthLogging: checked })}
                      />
                    </HStack>
                  </VStack>
                </Card>
                
                {/* Theme Settings */}
                <Card className="p-4">
                  <VStack gap={3}>
                    <Text size="lg" weight="semibold">Theme & Display</Text>
                    
                    {/* Theme selection removed - spacing store doesn't have theme */}
                    
                    <VStack gap={2}>
                      <Text size="sm">Spacing Density</Text>
                      <HStack gap={2}>
                        <Button
                          size="sm"
                          variant={spacingStore.density === 'compact' ? 'default' : 'outline'}
                          onPress={() => spacingStore.setDensity('compact')}
                        >
                          Compact
                        </Button>
                        <Button
                          size="sm"
                          variant={spacingStore.density === 'medium' ? 'default' : 'outline'}
                          onPress={() => spacingStore.setDensity('medium')}
                        >
                          Medium
                        </Button>
                        <Button
                          size="sm"
                          variant={spacingStore.density === 'large' ? 'default' : 'outline'}
                          onPress={() => spacingStore.setDensity('large')}
                        >
                          Large
                        </Button>
                      </HStack>
                    </VStack>
                  </VStack>
                </Card>
                
                {/* Animation Settings */}
                <Card className="p-4">
                  <VStack gap={3}>
                    <Text size="lg" weight="semibold">Animations</Text>
                    
                    <HStack justify="between" align="center">
                      <Text size="sm">Enable Animations</Text>
                      <Switch
                        checked={animationStore.enableAnimations}
                        onCheckedChange={(checked) => animationStore.setEnableAnimations(checked)}
                      />
                    </HStack>
                    
                    <HStack justify="between" align="center">
                      <Text size="sm">Debug Mode</Text>
                      <Switch
                        checked={animationStore.debugMode}
                        onCheckedChange={(checked) => animationStore.setDebugMode(checked)}
                      />
                    </HStack>
                    
                    <VStack gap={2}>
                      <Text size="sm">Animation Speed</Text>
                      <HStack gap={2}>
                        <Button
                          size="sm"
                          variant={animationStore.animationSpeed === 0.5 ? 'default' : 'outline'}
                          onPress={() => animationStore.setAnimationSpeed(0.5)}
                        >
                          Slow
                        </Button>
                        <Button
                          size="sm"
                          variant={animationStore.animationSpeed === 1 ? 'default' : 'outline'}
                          onPress={() => animationStore.setAnimationSpeed(1)}
                        >
                          Normal
                        </Button>
                        <Button
                          size="sm"
                          variant={animationStore.animationSpeed === 2 ? 'default' : 'outline'}
                          onPress={() => animationStore.setAnimationSpeed(2)}
                        >
                          Fast
                        </Button>
                      </HStack>
                    </VStack>
                  </VStack>
                </Card>
                
                {/* TanStack Query Debug */}
                <TanStackDebugInfo />
              </VStack>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}