import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Text,
  Card,
  Badge,
  Button,
  Avatar,
  VStack,
  HStack,
  Container,
  Progress,
  Grid,
} from '@/components/universal';
import { 
  Users, 
  UserPlus, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Activity,
} from '@/components/universal/display/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';

export default function TeamScreen() {
  const router = useRouter();
  const { spacing } = useSpacing();
  const [refreshing, setRefreshing] = useState(false);

  // Mock team data - replace with tRPC query
  const teamStats = {
    totalMembers: 12,
    activeToday: 10,
    tasksCompleted: 45,
    pendingTasks: 23,
    productivity: 78,
    avgResponseTime: '2.5 hours',
  };

  const teamMembers = [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'Senior Developer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      status: 'active',
      tasksCompleted: 8,
      tasksAssigned: 10,
      productivity: 80,
      lastActive: 'Now',
    },
    {
      id: '2',
      name: 'Mike Chen',
      role: 'UX Designer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
      status: 'active',
      tasksCompleted: 6,
      tasksAssigned: 8,
      productivity: 75,
      lastActive: '5 min ago',
    },
    {
      id: '3',
      name: 'Emily Davis',
      role: 'Backend Developer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
      status: 'away',
      tasksCompleted: 5,
      tasksAssigned: 7,
      productivity: 71,
      lastActive: '1 hour ago',
    },
    {
      id: '4',
      name: 'James Wilson',
      role: 'DevOps Engineer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
      status: 'offline',
      tasksCompleted: 9,
      tasksAssigned: 9,
      productivity: 100,
      lastActive: 'Yesterday',
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh team data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getProductivityColor = (productivity: number) => {
    if (productivity >= 80) return 'text-green-500';
    if (productivity >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

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
          <HStack justify="between" align="center">
            <VStack spacing="xs">
              <Text variant="h3">Team Overview</Text>
              <Text variant="body2" className="text-muted-foreground">
                Manage and monitor your team performance
              </Text>
            </VStack>
            <Button
              size="sm"
              onPress={() => router.push('/(modals)/invite-member')}
            >
              <UserPlus size={16} />
              <Text>Invite</Text>
            </Button>
          </HStack>

          {/* Team Stats */}
          <Grid cols={2} spacing="md">
            <Card padding="md">
              <VStack spacing="sm">
                <HStack spacing="sm" align="center">
                  <Users size={20} className="text-muted-foreground" />
                  <Text variant="body2" className="text-muted-foreground">
                    Team Members
                  </Text>
                </HStack>
                <Text variant="h4">{teamStats.totalMembers}</Text>
                <Text variant="caption" className="text-green-500">
                  {teamStats.activeToday} active today
                </Text>
              </VStack>
            </Card>

            <Card padding="md">
              <VStack spacing="sm">
                <HStack spacing="sm" align="center">
                  <CheckCircle size={20} className="text-muted-foreground" />
                  <Text variant="body2" className="text-muted-foreground">
                    Tasks Completed
                  </Text>
                </HStack>
                <Text variant="h4">{teamStats.tasksCompleted}</Text>
                <Text variant="caption" className="text-yellow-500">
                  {teamStats.pendingTasks} pending
                </Text>
              </VStack>
            </Card>

            <Card padding="md">
              <VStack spacing="sm">
                <HStack spacing="sm" align="center">
                  <TrendingUp size={20} className="text-muted-foreground" />
                  <Text variant="body2" className="text-muted-foreground">
                    Productivity
                  </Text>
                </HStack>
                <Text variant="h4">{teamStats.productivity}%</Text>
                <Progress value={teamStats.productivity} className="h-2 mt-2" />
              </VStack>
            </Card>

            <Card padding="md">
              <VStack spacing="sm">
                <HStack spacing="sm" align="center">
                  <Clock size={20} className="text-muted-foreground" />
                  <Text variant="body2" className="text-muted-foreground">
                    Avg Response
                  </Text>
                </HStack>
                <Text variant="h4">{teamStats.avgResponseTime}</Text>
                <Text variant="caption" className="text-muted-foreground">
                  Per task
                </Text>
              </VStack>
            </Card>
          </Grid>

          {/* Team Members */}
          <VStack spacing="md">
            <Text variant="h5" weight="semibold">Team Members</Text>
            
            {teamMembers.map((member) => (
              <Card key={member.id} padding="md">
                <HStack spacing="md" align="center">
                  <View className="relative">
                    <Avatar
                      src={member.avatar}
                      alt={member.name}
                      size="lg"
                    />
                    <View 
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`} 
                    />
                  </View>
                  
                  <VStack spacing="xs" className="flex-1">
                    <HStack justify="between" align="center">
                      <VStack spacing="xs">
                        <Text variant="body1" weight="semibold">
                          {member.name}
                        </Text>
                        <Text variant="body2" className="text-muted-foreground">
                          {member.role}
                        </Text>
                      </VStack>
                      
                      <Pressable
                        onPress={() => router.push(`/(modals)/member-details?id=${member.id}`)}
                        className="p-2"
                      >
                        <MoreVertical size={20} className="text-muted-foreground" />
                      </Pressable>
                    </HStack>
                    
                    <HStack spacing="lg" className="mt-2">
                      <VStack spacing="xs">
                        <Text variant="caption" className="text-muted-foreground">
                          Tasks
                        </Text>
                        <HStack spacing="xs" align="center">
                          <Text variant="body2" weight="medium">
                            {member.tasksCompleted}/{member.tasksAssigned}
                          </Text>
                        </HStack>
                      </VStack>
                      
                      <VStack spacing="xs">
                        <Text variant="caption" className="text-muted-foreground">
                          Productivity
                        </Text>
                        <Text 
                          variant="body2" 
                          weight="medium"
                          className={getProductivityColor(member.productivity)}
                        >
                          {member.productivity}%
                        </Text>
                      </VStack>
                      
                      <VStack spacing="xs">
                        <Text variant="caption" className="text-muted-foreground">
                          Last Active
                        </Text>
                        <Text variant="body2">
                          {member.lastActive}
                        </Text>
                      </VStack>
                    </HStack>
                    
                    <Progress 
                      value={(member.tasksCompleted / member.tasksAssigned) * 100} 
                      className="h-2 mt-2"
                    />
                  </VStack>
                </HStack>
              </Card>
            ))}
          </VStack>

          {/* Quick Actions */}
          <VStack spacing="md">
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full"
              onPress={() => router.push('/(manager)/tasks')}
            >
              <Activity size={20} />
              <Text>View All Tasks</Text>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full"
              onPress={() => router.push('/(manager)/reports')}
            >
              <TrendingUp size={20} />
              <Text>Generate Team Report</Text>
            </Button>
          </VStack>
        </VStack>
      </Container>
    </ScrollView>
  );
}