import React from 'react';
import { Platform, ScrollView, RefreshControl } from 'react-native';
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
  Heading1,
  Avatar,
  Grid,
} from '@/components/universal';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useShadow } from '@/hooks/useShadow';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { spacing } = useSpacing();
  const shadowMd = useShadow({ size: 'md' });
  const [refreshing, setRefreshing] = React.useState(false);
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);
  
  const content = (
    <VStack gap={5}>
      {/* Header */}
      <HStack justifyContent="space-between" alignItems="center">
        <Box flex={1}>
          <Heading1>Manager Dashboard</Heading1>
          <Text colorTheme="mutedForeground">
            {user?.name || 'Manager'}
          </Text>
        </Box>
        <Avatar
          source={user?.image ? { uri: user.image } : undefined}
          name={user?.name || 'Manager'}
          size="xl"
        />
      </HStack>
      
      {/* Department Overview */}
      <Grid columns={2} gap={3}>
        <Card style={shadowMd}>
          <Box p={4}>
            <VStack gap={2}>
              <Text size="sm" colorTheme="mutedForeground">Team Members</Text>
              <Text size="2xl" weight="bold">--</Text>
            </VStack>
          </Box>
        </Card>
        <Card style={shadowMd}>
          <Box p={4}>
            <VStack gap={2}>
              <Text size="sm" colorTheme="mutedForeground">Active Projects</Text>
              <Text size="2xl" weight="bold">--</Text>
            </VStack>
          </Box>
        </Card>
      </Grid>
      
      {/* Quick Actions */}
      <Card style={shadowMd}>
        <Box p={4}>
          <VStack gap={3}>
            <Text size="lg" weight="bold">Team Management</Text>
            <Grid columns={2} gap={2}>
              <Button
                onPress={() => router.push('/settings/members')}
                variant="outline"
                fullWidth
              >
                Team Members
              </Button>
              <Button
                onPress={() => router.push('/shifts/handover')}
                variant="outline"
                fullWidth
              >
                Shift Schedule
              </Button>
              <Button
                onPress={() => router.push('/analytics/response-analytics')}
                variant="outline"
                fullWidth
              >
                Analytics
              </Button>
              <Button
                onPress={() => router.push('/organization/dashboard')}
                variant="outline"
                fullWidth
              >
                Organization
              </Button>
            </Grid>
          </VStack>
        </Box>
      </Card>
    </VStack>
  );
  
  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ScrollView
          contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[6] }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
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
        <VStack p={4} gap={4}>
          {content}
        </VStack>
      </ScrollView>
    </Container>
  );
}