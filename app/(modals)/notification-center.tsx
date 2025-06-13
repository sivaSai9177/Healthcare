import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import {
  Text,
  Button,
  Card,
  Stack,
  Container,
  Badge,
  Separator,
  Tabs,
} from '@/components/universal';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSpacing } from '@/hooks/core/useSpacing';

type NotificationType = 'alert' | 'message' | 'system' | 'reminder';
type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: NotificationPriority;
  actionUrl?: string;
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Critical Patient Alert',
    message: 'Patient in Room 203 requires immediate attention',
    timestamp: '2025-01-06T15:30:00',
    read: false,
    priority: 'critical',
  },
  {
    id: '2',
    type: 'message',
    title: 'New Message from Dr. Smith',
    message: 'Please review the test results for patient #12345',
    timestamp: '2025-01-06T14:15:00',
    read: false,
    priority: 'medium',
  },
  {
    id: '3',
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance tonight from 2-4 AM',
    timestamp: '2025-01-06T12:00:00',
    read: true,
    priority: 'low',
  },
  {
    id: '4',
    type: 'reminder',
    title: 'Shift Change Reminder',
    message: 'Your shift ends in 30 minutes',
    timestamp: '2025-01-06T11:30:00',
    read: true,
    priority: 'medium',
  },
];

export default function NotificationCenterModal() {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const spacing = useSpacing();

  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeTab, setActiveTab] = useState('all');

  const handleClose = () => {
    router.back();
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((notif) => ({ ...notif, read: true })));
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'alert':
        return '🚨';
      case 'message':
        return '💬';
      case 'system':
        return '⚙️';
      case 'reminder':
        return '⏰';
      default:
        return '📢';
    }
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'default';
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notif.read;
    return notif.type === activeTab;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Container style={{ flex: 1, backgroundColor }}>
      <Stack spacing="lg" style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
          <Stack spacing="sm">
            <Stack direction="row" justify="between" align="center">
              <Text variant="h2">Notifications</Text>
              <Button variant="ghost" size="sm" onPress={handleClose}>
                Close
              </Button>
            </Stack>
            {unreadCount > 0 && (
              <Stack direction="row" justify="between" align="center">
                <Text variant="body" style={{ opacity: 0.7 }}>
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={handleMarkAllAsRead}
                >
                  Mark all as read
                </Button>
              </Stack>
            )}
          </Stack>
        </View>

        {/* Tabs */}
        <View style={{ paddingHorizontal: spacing.md }}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Trigger value="all">All</Tabs.Trigger>
              <Tabs.Trigger value="unread">Unread</Tabs.Trigger>
              <Tabs.Trigger value="alert">Alerts</Tabs.Trigger>
              <Tabs.Trigger value="message">Messages</Tabs.Trigger>
            </Tabs.List>
          </Tabs>
        </View>

        {/* Notifications List */}
        <ScrollView
          contentContainerStyle={{
            padding: spacing.md,
            paddingTop: 0,
          }}
        >
          <Stack spacing="md">
            {filteredNotifications.length === 0 ? (
              <Card>
                <Stack spacing="sm" align="center" style={{ padding: spacing.xl }}>
                  <Text variant="h4" style={{ opacity: 0.5 }}>
                    No notifications
                  </Text>
                  <Text variant="body" style={{ opacity: 0.5 }}>
                    You&apos;re all caught up!
                  </Text>
                </Stack>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  onPress={() => handleMarkAsRead(notification.id)}
                  activeOpacity={0.7}
                >
                  <Card
                    style={{
                      opacity: notification.read ? 0.7 : 1,
                      borderLeftWidth: notification.read ? 0 : 3,
                      borderLeftColor: notification.read
                        ? undefined
                        : primaryColor,
                    }}
                  >
                    <Stack spacing="sm">
                      <Stack direction="row" justify="between" align="start">
                        <Stack
                          direction="row"
                          spacing="sm"
                          align="center"
                          style={{ flex: 1 }}
                        >
                          <Text variant="h4">
                            {getNotificationIcon(notification.type)}
                          </Text>
                          <Stack spacing="xs" style={{ flex: 1 }}>
                            <Text variant="body" weight="medium">
                              {notification.title}
                            </Text>
                            <Text variant="caption" style={{ opacity: 0.7 }}>
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </Text>
                          </Stack>
                        </Stack>
                        <Badge
                          variant={getPriorityColor(notification.priority)}
                          size="sm"
                        >
                          {notification.priority}
                        </Badge>
                      </Stack>
                      <Text variant="body" style={{ opacity: 0.8 }}>
                        {notification.message}
                      </Text>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => handleMarkAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </Stack>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </Stack>
        </ScrollView>
      </Stack>
    </Container>
  );
}