import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Text,
  Card,
  Badge,
  Button,
  Input,
  VStack,
  HStack,
  Container,
  Avatar,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Checkbox,
} from '@/components/universal';
import { 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Circle,
  MoreVertical,
  Users,
} from '@/components/universal/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';

export default function TasksScreen() {
  const router = useRouter();
  const { spacing } = useSpacing();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Mock tasks data - replace with tRPC query
  const tasks = [
    {
      id: '1',
      title: 'Implement user authentication flow',
      description: 'Add OAuth and email/password authentication',
      status: 'in_progress',
      priority: 'high',
      assignee: {
        id: '1',
        name: 'Sarah Johnson',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      },
      dueDate: '2025-01-15',
      createdAt: '2025-01-10',
      completedTasks: 3,
      totalTasks: 5,
      tags: ['backend', 'security'],
    },
    {
      id: '2',
      title: 'Design new dashboard UI',
      description: 'Create mockups and implement responsive design',
      status: 'todo',
      priority: 'medium',
      assignee: {
        id: '2',
        name: 'Mike Chen',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
      },
      dueDate: '2025-01-18',
      createdAt: '2025-01-11',
      completedTasks: 0,
      totalTasks: 4,
      tags: ['design', 'frontend'],
    },
    {
      id: '3',
      title: 'Optimize database queries',
      description: 'Improve performance of slow queries',
      status: 'completed',
      priority: 'low',
      assignee: {
        id: '3',
        name: 'Emily Davis',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
      },
      dueDate: '2025-01-12',
      createdAt: '2025-01-08',
      completedTasks: 4,
      totalTasks: 4,
      tags: ['backend', 'performance'],
    },
    {
      id: '4',
      title: 'Set up CI/CD pipeline',
      description: 'Configure automated testing and deployment',
      status: 'in_progress',
      priority: 'high',
      assignee: {
        id: '4',
        name: 'James Wilson',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
      },
      dueDate: '2025-01-14',
      createdAt: '2025-01-09',
      completedTasks: 2,
      totalTasks: 3,
      tags: ['devops', 'automation'],
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh tasks data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'in_progress':
        return <Clock size={20} className="text-blue-500" />;
      case 'todo':
        return <Circle size={20} className="text-gray-400" />;
      default:
        return <Circle size={20} className="text-gray-400" />;
    }
  };

  const getPriorityBadgeVariant = (priority: string): any => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStatusBadgeVariant = (status: string): any => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'default';
      case 'todo':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days left`;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
              <Text variant="h3">Task Management</Text>
              <Text variant="body2" className="text-muted-foreground">
                Assign and track team tasks
              </Text>
            </VStack>
            <Button
              size="sm"
              onPress={() => router.push('/(zmodals)/create-task')}
            >
              <Plus size={16} />
              <Text>New Task</Text>
            </Button>
          </HStack>

          {/* Stats */}
          <HStack spacing="md">
            <Card padding="sm" className="flex-1">
              <HStack spacing="sm" align="center">
                <Circle size={16} className="text-gray-400" />
                <Text variant="body2">Todo</Text>
                <Text variant="h6" className="ml-auto">
                  {tasks.filter(t => t.status === 'todo').length}
                </Text>
              </HStack>
            </Card>
            
            <Card padding="sm" className="flex-1">
              <HStack spacing="sm" align="center">
                <Clock size={16} className="text-blue-500" />
                <Text variant="body2">In Progress</Text>
                <Text variant="h6" className="ml-auto">
                  {tasks.filter(t => t.status === 'in_progress').length}
                </Text>
              </HStack>
            </Card>
            
            <Card padding="sm" className="flex-1">
              <HStack spacing="sm" align="center">
                <CheckCircle size={16} className="text-green-500" />
                <Text variant="body2">Done</Text>
                <Text variant="h6" className="ml-auto">
                  {tasks.filter(t => t.status === 'completed').length}
                </Text>
              </HStack>
            </Card>
          </HStack>

          {/* Filters */}
          <VStack spacing="md">
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="w-full"
              icon={<Search size={16} className="text-muted-foreground" />}
            />
            
            <HStack spacing="md">
              <View className="flex-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </View>
              
              <View className="flex-1">
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </View>
            </HStack>
          </VStack>

          {/* Task List */}
          <VStack spacing="md">
            {filteredTasks.map((task) => (
              <Card key={task.id} padding="md">
                <VStack spacing="md">
                  {/* Task Header */}
                  <HStack justify="between" align="start">
                    <HStack spacing="sm" align="start">
                      {getStatusIcon(task.status)}
                      <VStack spacing="xs" className="flex-1">
                        <Text variant="body1" weight="semibold">
                          {task.title}
                        </Text>
                        <Text variant="body2" className="text-muted-foreground">
                          {task.description}
                        </Text>
                      </VStack>
                    </HStack>
                    
                    <Pressable
                      onPress={() => router.push(`/(zmodals)/task-details?id=${task.id}`)}
                      className="p-2"
                    >
                      <MoreVertical size={20} className="text-muted-foreground" />
                    </Pressable>
                  </HStack>

                  {/* Task Meta */}
                  <HStack spacing="md" wrap>
                    <Badge size="sm" variant={getPriorityBadgeVariant(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge size="sm" variant={getStatusBadgeVariant(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                    {task.tags.map((tag) => (
                      <Badge key={tag} size="sm" variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </HStack>

                  {/* Task Footer */}
                  <HStack justify="between" align="center">
                    <HStack spacing="md" align="center">
                      <HStack spacing="xs" align="center">
                        <Avatar
                          src={task.assignee.avatar}
                          alt={task.assignee.name}
                          size="xs"
                        />
                        <Text variant="caption" className="text-muted-foreground">
                          {task.assignee.name}
                        </Text>
                      </HStack>
                      
                      <HStack spacing="xs" align="center">
                        <Calendar size={14} className="text-muted-foreground" />
                        <Text variant="caption" className="text-muted-foreground">
                          {getDaysUntilDue(task.dueDate)}
                        </Text>
                      </HStack>
                    </HStack>
                    
                    <Text variant="caption" className="text-muted-foreground">
                      {task.completedTasks}/{task.totalTasks} subtasks
                    </Text>
                  </HStack>
                </VStack>
              </Card>
            ))}
          </VStack>

          {/* Empty State */}
          {filteredTasks.length === 0 && (
            <Card padding="xl" className="items-center">
              <VStack spacing="md" align="center">
                <AlertCircle size={48} className="text-muted-foreground" />
                <Text variant="body1" className="text-muted-foreground">
                  No tasks found
                </Text>
                <Text variant="body2" className="text-muted-foreground text-center">
                  Try adjusting your filters or create a new task
                </Text>
                <Button
                  size="sm"
                  onPress={() => router.push('/(zmodals)/create-task')}
                >
                  <Plus size={16} />
                  <Text>Create Task</Text>
                </Button>
              </VStack>
            </Card>
          )}
        </VStack>
      </Container>
    </ScrollView>
  );
}