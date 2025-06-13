import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Text,
  Card,
  Button,
  Switch,
  VStack,
  HStack,
  Container,
  Badge,
  Progress,
  Separator,
} from '@/components/universal';
import { 
  Settings, 
  Database, 
  Shield, 
  Bell, 
  Activity,
  HardDrive,
  Users,
  Lock,
  Globe,
  ChevronRight
} from '@/components/universal/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';

export default function SystemScreen() {
  const router = useRouter();
  const { spacing } = useSpacing();
  const [refreshing, setRefreshing] = useState(false);

  // System settings state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Mock system stats
  const systemStats = {
    storage: { used: 45, total: 100 }, // GB
    memory: { used: 3.2, total: 8 }, // GB
    cpu: 35, // percentage
    activeUsers: 152,
    uptime: '45 days, 12 hours',
    lastBackup: '2 hours ago',
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh system data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const SettingRow = ({ 
    icon: Icon, 
    title, 
    description, 
    action,
    onPress,
  }: {
    icon: any;
    title: string;
    description?: string;
    action?: React.ReactNode;
    onPress?: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      className={onPress ? 'active:opacity-70' : ''}
    >
      <HStack spacing="md" align="center" className="py-3">
        <View className="w-10 h-10 bg-muted rounded-lg items-center justify-center">
          <Icon size={20} className="text-muted-foreground" />
        </View>
        <VStack spacing="xs" className="flex-1">
          <Text variant="body1" weight="medium">{title}</Text>
          {description && (
            <Text variant="body2" className="text-muted-foreground">
              {description}
            </Text>
          )}
        </VStack>
        {action || (onPress && <ChevronRight size={20} className="text-muted-foreground" />)}
      </HStack>
    </Pressable>
  );

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      contentContainerStyle={{ paddingBottom: spacing.xl }}
    >
      <Container size="full" padding="lg">
        <VStack spacing="lg">
          {/* Header */}
          <VStack spacing="xs">
            <Text variant="h3">System Settings</Text>
            <Text variant="body2" className="text-muted-foreground">
              Configure system-wide settings and monitoring
            </Text>
          </VStack>

          {/* System Status */}
          <Card padding="lg">
            <VStack spacing="lg">
              <HStack justify="between" align="center">
                <Text variant="h5" weight="semibold">System Status</Text>
                <Badge variant={maintenanceMode ? 'destructive' : 'success'}>
                  {maintenanceMode ? 'Maintenance' : 'Operational'}
                </Badge>
              </HStack>

              <VStack spacing="md">
                {/* Storage */}
                <VStack spacing="xs">
                  <HStack justify="between">
                    <Text variant="body2">Storage</Text>
                    <Text variant="body2" className="text-muted-foreground">
                      {systemStats.storage.used}GB / {systemStats.storage.total}GB
                    </Text>
                  </HStack>
                  <Progress 
                    value={(systemStats.storage.used / systemStats.storage.total) * 100} 
                    className="h-2"
                  />
                </VStack>

                {/* Memory */}
                <VStack spacing="xs">
                  <HStack justify="between">
                    <Text variant="body2">Memory</Text>
                    <Text variant="body2" className="text-muted-foreground">
                      {systemStats.memory.used}GB / {systemStats.memory.total}GB
                    </Text>
                  </HStack>
                  <Progress 
                    value={(systemStats.memory.used / systemStats.memory.total) * 100} 
                    className="h-2"
                  />
                </VStack>

                {/* CPU */}
                <VStack spacing="xs">
                  <HStack justify="between">
                    <Text variant="body2">CPU Usage</Text>
                    <Text variant="body2" className="text-muted-foreground">
                      {systemStats.cpu}%
                    </Text>
                  </HStack>
                  <Progress value={systemStats.cpu} className="h-2" />
                </VStack>
              </VStack>

              <HStack spacing="xl">
                <VStack spacing="xs">
                  <Text variant="caption" className="text-muted-foreground">Active Users</Text>
                  <Text variant="h6">{systemStats.activeUsers}</Text>
                </VStack>
                <VStack spacing="xs">
                  <Text variant="caption" className="text-muted-foreground">Uptime</Text>
                  <Text variant="h6">{systemStats.uptime}</Text>
                </VStack>
              </HStack>
            </VStack>
          </Card>

          {/* General Settings */}
          <Card padding="lg">
            <VStack spacing="md">
              <Text variant="h5" weight="semibold">General Settings</Text>
              
              <SettingRow
                icon={Activity}
                title="Maintenance Mode"
                description="Temporarily disable user access for maintenance"
                action={
                  <Switch
                    checked={maintenanceMode}
                    onCheckedChange={setMaintenanceMode}
                  />
                }
              />
              
              <Separator />
              
              <SettingRow
                icon={Database}
                title="Automatic Backups"
                description="Daily backups at 3:00 AM"
                action={
                  <Switch
                    checked={autoBackup}
                    onCheckedChange={setAutoBackup}
                  />
                }
              />
              
              <Separator />
              
              <SettingRow
                icon={Shield}
                title="Debug Mode"
                description="Enable detailed logging and diagnostics"
                action={
                  <Switch
                    checked={debugMode}
                    onCheckedChange={setDebugMode}
                  />
                }
              />
            </VStack>
          </Card>

          {/* Configuration */}
          <Card padding="lg">
            <VStack spacing="md">
              <Text variant="h5" weight="semibold">Configuration</Text>
              
              <SettingRow
                icon={Bell}
                title="Email Notifications"
                description="System alerts and updates"
                action={
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                }
              />
              
              <Separator />
              
              <SettingRow
                icon={Globe}
                title="API Configuration"
                description="Manage API keys and endpoints"
                onPress={() => router.push('/(admin)/api-config')}
              />
              
              <Separator />
              
              <SettingRow
                icon={Lock}
                title="Security Settings"
                description="2FA, session timeout, password policies"
                onPress={() => router.push('/(admin)/security')}
              />
              
              <Separator />
              
              <SettingRow
                icon={HardDrive}
                title="Database Management"
                description="Last backup: {systemStats.lastBackup}"
                onPress={() => router.push('/(admin)/database')}
              />
            </VStack>
          </Card>

          {/* Actions */}
          <VStack spacing="md">
            <Button 
              variant="destructive" 
              size="lg" 
              className="w-full"
              onPress={() => {
                // Clear cache action
              }}
            >
              Clear System Cache
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full"
              onPress={() => {
                // Export logs action
              }}
            >
              Export System Logs
            </Button>
          </VStack>
        </VStack>
      </Container>
    </ScrollView>
  );
}