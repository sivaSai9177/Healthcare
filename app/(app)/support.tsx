import React from 'react';
import { ScrollView, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/lib/theme/provider';
import {
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Box,
} from '@/components/universal';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useShadow } from '@/hooks/useShadow';
import { Symbol } from '@/components/universal/display/Symbols';

export default function SupportScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const shadowMd = useShadow({ size: 'md' });
  
  const supportItems = [
    {
      icon: 'book' as const,
      title: 'Documentation',
      description: 'Browse our comprehensive guides and tutorials',
      action: () => Linking.openURL('https://docs.example.com'),
    },
    {
      icon: 'questionmark.circle' as const,
      title: 'FAQs',
      description: 'Find answers to frequently asked questions',
      action: () => Linking.openURL('https://example.com/faq'),
    },
    {
      icon: 'envelope' as const,
      title: 'Email Support',
      description: 'Contact our support team via email',
      action: () => Linking.openURL('mailto:support@example.com'),
    },
    {
      icon: 'message' as const,
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      action: () => {
        // TODO: Implement live chat
      },
    },
    {
      icon: 'exclamationmark.triangle' as const,
      title: 'Report an Issue',
      description: 'Report bugs or technical problems',
      action: () => Linking.openURL('https://github.com/example/issues'),
    },
    {
      icon: 'lightbulb' as const,
      title: 'Feature Requests',
      description: 'Suggest new features or improvements',
      action: () => Linking.openURL('https://example.com/feedback'),
    },
  ];
  
  const content = (
    <VStack gap={4 as any}>
      {/* Header */}
      <HStack alignItems="center" gap={2 as any}>
        <Button
          onPress={() => router.back()}
          variant="ghost"
          size="icon"
        >
          <Symbol name="chevron.left" size={24} />
        </Button>
        <Text size="xl" weight="bold">Help & Support</Text>
      </HStack>
      
      {/* Welcome Message */}
      <Card style={shadowMd}>
        <Box p={4 as any}>
          <VStack gap={2 as any}>
            <Text weight="semibold">How can we help you?</Text>
            <Text size="sm" colorTheme="mutedForeground">
              Choose from the options below or contact our support team directly.
            </Text>
          </VStack>
        </Box>
      </Card>
      
      {/* Support Options */}
      <VStack gap={3 as any}>
        {supportItems.map((item, index) => (
          <Card key={index} style={shadowMd}>
            <Box
              p={4}
              onPress={item.action}
            >
              <HStack gap={3 as any} alignItems="center">
                <Box
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: theme.primary + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Symbol name={item.icon} size={20} className="text-primary" />
                </Box>
                <VStack gap={1 as any} style={{ flex: 1 }}>
                  <Text weight="semibold">{item.title}</Text>
                  <Text size="sm" colorTheme="mutedForeground">
                    {item.description}
                  </Text>
                </VStack>
                <Symbol name="chevron.right" size={20} className="text-muted-foreground" />
              </HStack>
            </Box>
          </Card>
        ))}
      </VStack>
      
      {/* Contact Info */}
      <Card style={shadowMd}>
        <Box p={4 as any}>
          <VStack gap={3 as any}>
            <Text weight="semibold">Contact Information</Text>
            <VStack gap={2 as any}>
              <HStack gap={2 as any}>
                <Symbol name="clock" size={16} className="text-muted-foreground" />
                <Text size="sm" colorTheme="mutedForeground">
                  Support Hours: Mon-Fri, 9AM-5PM EST
                </Text>
              </HStack>
              <HStack gap={2 as any}>
                <Symbol name="phone" size={16} className="text-muted-foreground" />
                <Text size="sm" colorTheme="mutedForeground">
                  Phone: 1-800-EXAMPLE
                </Text>
              </HStack>
              <HStack gap={2 as any}>
                <Symbol name="envelope" size={16} className="text-muted-foreground" />
                <Text size="sm" colorTheme="mutedForeground">
                  Email: support@example.com
                </Text>
              </HStack>
            </VStack>
          </VStack>
        </Box>
      </Card>
      
      {/* App Version */}
      <Card style={shadowMd}>
        <Box p={3 as any}>
          <HStack justifyContent="between" alignItems="center">
            <Text size="sm" colorTheme="mutedForeground">App Version</Text>
            <Text size="sm">v2.0.0</Text>
          </HStack>
        </Box>
      </Card>
    </VStack>
  );
  
  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          contentContainerStyle={{ padding: spacing[4] as any, paddingBottom: spacing[6] as any }}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  return (
    <Container>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <VStack p={4} gap={4 as any}>
          {content}
        </VStack>
      </ScrollView>
    </Container>
  );
}