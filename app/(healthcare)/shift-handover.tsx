import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import {
  Text,
  Card,
  Badge,
  Button,
  VStack,
  HStack,
  Container,
  Avatar,
  Progress,
  Separator,
  Alert,
  Checkbox,
  Textarea,
} from '@/components/universal';
import { 
  Users, 
  Clock,
  AlertCircle,
  CheckCircle,
  Calendar,
  MessageSquare,
  FileText,
  UserCheck,
  UserX,
  Download,
  Upload,
} from '@/components/universal/display/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useTheme } from '@/lib/theme/provider';

interface ShiftStaff {
  id: string;
  name: string;
  role: 'doctor' | 'nurse' | 'head_doctor';
  avatar?: string;
  status: 'online' | 'offline' | 'break';
  activeAlerts: number;
  completedAlerts: number;
}

interface ActiveAlert {
  id: string;
  patientName: string;
  roomNumber: string;
  alertType: string;
  urgencyLevel: number;
  assignedTo: string;
  status: 'active' | 'acknowledged';
  createdAt: Date;
}

interface HandoverNote {
  id: string;
  author: string;
  timestamp: Date;
  content: string;
  priority: 'high' | 'medium' | 'low';
}

export default function ShiftHandoverScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { spacing } = useSpacing();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);

  // Mock data
  const currentShift = {
    name: 'Day Shift',
    start: '07:00 AM',
    end: '07:00 PM',
    date: new Date(),
  };

  const nextShift = {
    name: 'Night Shift',
    start: '07:00 PM',
    end: '07:00 AM',
  };

  const [outgoingStaff] = useState<ShiftStaff[]>([
    {
      id: '1',
      name: 'Dr. Sarah Wilson',
      role: 'doctor',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      status: 'online',
      activeAlerts: 2,
      completedAlerts: 8,
    },
    {
      id: '2',
      name: 'Nurse Emily Davis',
      role: 'nurse',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
      status: 'online',
      activeAlerts: 1,
      completedAlerts: 12,
    },
  ]);

  const [incomingStaff] = useState<ShiftStaff[]>([
    {
      id: '3',
      name: 'Dr. Michael Chen',
      role: 'doctor',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
      status: 'offline',
      activeAlerts: 0,
      completedAlerts: 0,
    },
    {
      id: '4',
      name: 'Nurse John Smith',
      role: 'nurse',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      status: 'offline',
      activeAlerts: 0,
      completedAlerts: 0,
    },
  ]);

  const [activeAlerts] = useState<ActiveAlert[]>([
    {
      id: '1',
      patientName: 'John Doe',
      roomNumber: '205A',
      alertType: 'Medical Emergency',
      urgencyLevel: 2,
      assignedTo: 'Dr. Sarah Wilson',
      status: 'acknowledged',
      createdAt: new Date(Date.now() - 30 * 60000),
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      roomNumber: '312B',
      alertType: 'Monitoring Required',
      urgencyLevel: 3,
      assignedTo: 'Nurse Emily Davis',
      status: 'active',
      createdAt: new Date(Date.now() - 15 * 60000),
    },
  ]);

  const [handoverNotes] = useState<HandoverNote[]>([
    {
      id: '1',
      author: 'Dr. Sarah Wilson',
      timestamp: new Date(Date.now() - 10 * 60000),
      content: 'Patient in 205A requires hourly monitoring. Recent vitals show improvement but remain cautious.',
      priority: 'high',
    },
    {
      id: '2',
      author: 'Nurse Emily Davis',
      timestamp: new Date(Date.now() - 5 * 60000),
      content: 'IV medications for 312B scheduled at 8 PM. Family has been notified of status.',
      priority: 'medium',
    },
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      // Add note API call
      setNewNote('');
    }
  };

  const handleTransferAlerts = () => {
    // Transfer selected alerts to incoming staff
// TODO: Replace with structured logging - console.log('Transferring alerts:', selectedAlerts);
  };

  const toggleAlertSelection = (alertId: string) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const getRoleBadgeVariant = (role: string): any => {
    switch (role) {
      case 'doctor':
        return 'default';
      case 'nurse':
        return 'secondary';
      case 'head_doctor':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-gray-400';
      case 'break':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
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
          <VStack spacing="xs">
            <Text variant="h3">Shift Handover</Text>
            <Text variant="body2" className="text-muted-foreground">
              Transfer active alerts and important notes to the incoming shift
            </Text>
          </VStack>

          {/* Shift Information */}
          <Card padding="md">
            <HStack justify="between" align="center">
              <VStack spacing="xs">
                <Text variant="body2" className="text-muted-foreground">
                  Current Shift
                </Text>
                <HStack spacing="sm" align="center">
                  <Clock size={16} className="text-muted-foreground" />
                  <Text variant="body1" weight="semibold">
                    {currentShift.name} ({currentShift.start} - {currentShift.end})
                  </Text>
                </HStack>
              </VStack>
              
              <VStack spacing="xs" align="end">
                <Text variant="body2" className="text-muted-foreground">
                  Next Shift
                </Text>
                <Text variant="body1" weight="semibold">
                  {nextShift.name} ({nextShift.start})
                </Text>
              </VStack>
            </HStack>
          </Card>

          {/* Active Alerts Summary */}
          <Alert variant="warning">
            <AlertCircle size={16} />
            <Text variant="body2">
              {activeAlerts.length} active alerts require handover to incoming shift
            </Text>
          </Alert>

          {/* Staff Overview */}
          <VStack spacing="md">
            <Text variant="h5" weight="semibold">Staff Overview</Text>
            
            <HStack spacing="md">
              {/* Outgoing Staff */}
              <Card padding="md" className="flex-1">
                <VStack spacing="md">
                  <HStack spacing="sm" align="center">
                    <UserX size={20} className="text-red-500" />
                    <Text variant="body1" weight="semibold">
                      Outgoing Staff
                    </Text>
                  </HStack>
                  
                  <VStack spacing="sm">
                    {outgoingStaff.map((staff) => (
                      <HStack key={staff.id} spacing="sm" align="center">
                        <View className="relative">
                          <Avatar
                            src={staff.avatar}
                            alt={staff.name}
                            size="sm"
                          />
                          <View 
                            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(staff.status)}`} 
                          />
                        </View>
                        
                        <VStack spacing="xs" className="flex-1">
                          <Text variant="body2" weight="medium">
                            {staff.name}
                          </Text>
                          <HStack spacing="xs">
                            <Badge variant={getRoleBadgeVariant(staff.role)} size="sm">
                              {staff.role}
                            </Badge>
                            <Text variant="caption" className="text-muted-foreground">
                              {staff.activeAlerts} active • {staff.completedAlerts} completed
                            </Text>
                          </HStack>
                        </VStack>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Card>

              {/* Incoming Staff */}
              <Card padding="md" className="flex-1">
                <VStack spacing="md">
                  <HStack spacing="sm" align="center">
                    <UserCheck size={20} className="text-green-500" />
                    <Text variant="body1" weight="semibold">
                      Incoming Staff
                    </Text>
                  </HStack>
                  
                  <VStack spacing="sm">
                    {incomingStaff.map((staff) => (
                      <HStack key={staff.id} spacing="sm" align="center">
                        <View className="relative">
                          <Avatar
                            src={staff.avatar}
                            alt={staff.name}
                            size="sm"
                          />
                          <View 
                            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(staff.status)}`} 
                          />
                        </View>
                        
                        <VStack spacing="xs" className="flex-1">
                          <Text variant="body2" weight="medium">
                            {staff.name}
                          </Text>
                          <Badge variant={getRoleBadgeVariant(staff.role)} size="sm">
                            {staff.role}
                          </Badge>
                        </VStack>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </Card>
            </HStack>
          </VStack>

          {/* Active Alerts to Transfer */}
          <VStack spacing="md">
            <HStack justify="between" align="center">
              <Text variant="h5" weight="semibold">Active Alerts</Text>
              <Button
                variant="outline"
                size="sm"
                onPress={handleTransferAlerts}
                disabled={selectedAlerts.length === 0}
              >
                <Upload size={16} />
                <Text>Transfer Selected ({selectedAlerts.length})</Text>
              </Button>
            </HStack>
            
            <VStack spacing="sm">
              {activeAlerts.map((alert) => (
                <Card key={alert.id} padding="md">
                  <HStack spacing="md" align="center">
                    <Checkbox
                      checked={selectedAlerts.includes(alert.id)}
                      onCheckedChange={() => toggleAlertSelection(alert.id)}
                    />
                    
                    <VStack spacing="xs" className="flex-1">
                      <HStack justify="between" align="center">
                        <Text variant="body1" weight="semibold">
                          {alert.alertType}
                        </Text>
                        <Badge variant="outline" size="sm">
                          Level {alert.urgencyLevel}
                        </Badge>
                      </HStack>
                      <Text variant="body2" className="text-muted-foreground">
                        {alert.patientName} • Room {alert.roomNumber}
                      </Text>
                      <HStack spacing="md">
                        <Text variant="caption" className="text-muted-foreground">
                          Assigned: {alert.assignedTo}
                        </Text>
                        <Badge 
                          variant={alert.status === 'active' ? 'destructive' : 'default'} 
                          size="sm"
                        >
                          {alert.status}
                        </Badge>
                      </HStack>
                    </VStack>
                  </HStack>
                </Card>
              ))}
            </VStack>
          </VStack>

          {/* Handover Notes */}
          <VStack spacing="md">
            <Text variant="h5" weight="semibold">Handover Notes</Text>
            
            {/* Add Note */}
            <Card padding="md">
              <VStack spacing="sm">
                <Textarea
                  placeholder="Add important information for the incoming shift..."
                  value={newNote}
                  onChangeText={setNewNote}
                  rows={3}
                />
                <HStack justify="end">
                  <Button
                    size="sm"
                    onPress={handleAddNote}
                    disabled={!newNote.trim()}
                  >
                    <MessageSquare size={16} />
                    <Text>Add Note</Text>
                  </Button>
                </HStack>
              </VStack>
            </Card>

            {/* Existing Notes */}
            <VStack spacing="sm">
              {handoverNotes.map((note) => (
                <Card key={note.id} padding="md">
                  <VStack spacing="sm">
                    <HStack justify="between" align="start">
                      <HStack spacing="sm" align="center">
                        <FileText size={16} className="text-muted-foreground" />
                        <Text variant="body2" weight="medium">
                          {note.author}
                        </Text>
                        <Badge 
                          variant={
                            note.priority === 'high' ? 'destructive' : 
                            note.priority === 'medium' ? 'secondary' : 
                            'outline'
                          } 
                          size="sm"
                        >
                          {note.priority}
                        </Badge>
                      </HStack>
                      <Text variant="caption" className="text-muted-foreground">
                        {note.timestamp.toLocaleTimeString()}
                      </Text>
                    </HStack>
                    <Text variant="body2">
                      {note.content}
                    </Text>
                  </VStack>
                </Card>
              ))}
            </VStack>
          </VStack>

          {/* Shift Summary */}
          <Card padding="lg" className="bg-muted/50">
            <VStack spacing="md">
              <Text variant="h6" weight="semibold">Shift Summary</Text>
              <Separator />
              
              <HStack spacing="xl">
                <VStack spacing="xs">
                  <Text variant="caption" className="text-muted-foreground">
                    Total Alerts
                  </Text>
                  <Text variant="h6">23</Text>
                </VStack>
                
                <VStack spacing="xs">
                  <Text variant="caption" className="text-muted-foreground">
                    Resolved
                  </Text>
                  <Text variant="h6" className="text-green-500">18</Text>
                </VStack>
                
                <VStack spacing="xs">
                  <Text variant="caption" className="text-muted-foreground">
                    Active
                  </Text>
                  <Text variant="h6" className="text-yellow-500">3</Text>
                </VStack>
                
                <VStack spacing="xs">
                  <Text variant="caption" className="text-muted-foreground">
                    Escalated
                  </Text>
                  <Text variant="h6" className="text-red-500">2</Text>
                </VStack>
              </HStack>
              
              <Button variant="outline" className="w-full">
                <Download size={16} />
                <Text>Generate Shift Report</Text>
              </Button>
            </VStack>
          </Card>
        </VStack>
      </Container>
    </ScrollView>
  );
}