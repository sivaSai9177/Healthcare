import React, { useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  Badge,
  Button,
  VStack,
  HStack,
  Container,
  Avatar,
  Separator,
  Alert,
  Checkbox,
  TextArea,
} from '@/components/universal';
import { Symbol } from '@/components/universal/display/Symbols';

// Icon components as wrappers around Symbol
import { useSpacing } from '@/lib/stores/spacing-store';

// Icon components as wrappers around Symbol
const Clock = (props: any) => <Symbol name="clock.fill" {...props} />;
const AlertCircle = (props: any) => <Symbol name="exclamationmark.circle.fill" {...props} />;
const MessageSquare = (props: any) => <Symbol name="message.fill" {...props} />;
const FileText = (props: any) => <Symbol name="doc.text.fill" {...props} />;
const UserCheck = (props: any) => <Symbol name="person.badge.checkmark" {...props} />;
const UserX = (props: any) => <Symbol name="person.badge.xmark" {...props} />;
const Download = (props: any) => <Symbol name="arrow.down.circle.fill" {...props} />;
const Upload = (props: any) => <Symbol name="arrow.up.circle.fill" {...props} />;

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
  const { spacing } = useSpacing();
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
    // Will be implemented with actual API call
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
        return 'bg-success';
      case 'offline':
        return 'bg-muted-foreground';
      case 'break':
        return 'bg-warning';
      default:
        return 'bg-muted-foreground';
    }
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      contentContainerStyle={{ paddingBottom: spacing[8] }}
    >
      <Container maxWidth="full" className="p-6">
        <VStack gap={6}>
          {/* Header */}
          <VStack gap={1}>
            <Text size="2xl" weight="bold">Shift Handover</Text>
            <Text size="sm" color="muted">
              Transfer active alerts and important notes to the incoming shift
            </Text>
          </VStack>

          {/* Shift Information */}
          <Card className="p-4">
            <HStack justify="between" align="center">
              <VStack gap={1}>
                <Text size="sm" color="muted">
                  Current Shift
                </Text>
                <HStack gap={2} align="center">
                  <Clock size={16} color="#6B7280" />
                  <Text size="base" weight="semibold">
                    {currentShift.name} ({currentShift.start} - {currentShift.end})
                  </Text>
                </HStack>
              </VStack>
              
              <VStack gap={1} align="end">
                <Text size="sm" color="muted">
                  Next Shift
                </Text>
                <Text size="base" weight="semibold">
                  {nextShift.name} ({nextShift.start})
                </Text>
              </VStack>
            </HStack>
          </Card>

          {/* Active Alerts Summary */}
          <Alert variant="warning">
            <AlertCircle size={16} />
            <Text size="sm">
              {activeAlerts.length} active alerts require handover to incoming shift
            </Text>
          </Alert>

          {/* Staff Overview */}
          <VStack gap={4}>
            <Text size="lg" weight="semibold">Staff Overview</Text>
            
            <HStack gap={4}>
              {/* Outgoing Staff */}
              <Card className="p-4 flex-1">
                <VStack gap={4}>
                  <HStack gap={2} align="center">
                    <UserX size={20} color="#EF4444" />
                    <Text size="base" weight="semibold">
                      Outgoing Staff
                    </Text>
                  </HStack>
                  
                  <VStack gap={2}>
                    {outgoingStaff.map((staff) => (
                      <HStack key={staff.id} gap={2} align="center">
                        <View className="relative">
                          <Avatar
                            source={staff.avatar ? { uri: staff.avatar } : undefined}
                            name={staff.name}
                            size="sm"
                          />
                          <View 
                            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(staff.status)}`} 
                          />
                        </View>
                        
                        <VStack gap={1} className="flex-1">
                          <Text size="sm" weight="medium">
                            {staff.name}
                          </Text>
                          <HStack gap={1}>
                            <Badge variant={getRoleBadgeVariant(staff.role)} size="sm">
                              {staff.role}
                            </Badge>
                            <Text size="xs" color="muted">
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
              <Card className="p-4 flex-1">
                <VStack gap={4}>
                  <HStack gap={2} align="center">
                    <UserCheck size={20} color="#10B981" />
                    <Text size="base" weight="semibold">
                      Incoming Staff
                    </Text>
                  </HStack>
                  
                  <VStack gap={2}>
                    {incomingStaff.map((staff) => (
                      <HStack key={staff.id} gap={2} align="center">
                        <View className="relative">
                          <Avatar
                            source={staff.avatar ? { uri: staff.avatar } : undefined}
                            name={staff.name}
                            size="sm"
                          />
                          <View 
                            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(staff.status)}`} 
                          />
                        </View>
                        
                        <VStack gap={1} className="flex-1">
                          <Text size="sm" weight="medium">
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
          <VStack gap={4}>
            <HStack justify="between" align="center">
              <Text size="lg" weight="semibold">Active Alerts</Text>
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
            
            <VStack gap={2}>
              {activeAlerts.map((alert) => (
                <Card key={alert.id} className="p-4">
                  <HStack gap={4} align="center">
                    <Checkbox
                      checked={selectedAlerts.includes(alert.id)}
                      onCheckedChange={() => toggleAlertSelection(alert.id)}
                    />
                    
                    <VStack gap={1} className="flex-1">
                      <HStack justify="between" align="center">
                        <Text size="base" weight="semibold">
                          {alert.alertType}
                        </Text>
                        <Badge variant="outline" size="sm">
                          Level {alert.urgencyLevel}
                        </Badge>
                      </HStack>
                      <Text size="sm" color="muted">
                        {alert.patientName} • Room {alert.roomNumber}
                      </Text>
                      <HStack gap={4}>
                        <Text size="xs" color="muted">
                          Assigned: {alert.assignedTo}
                        </Text>
                        <Badge 
                          variant={alert.status === 'active' ? 'error' : 'default'} 
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
          <VStack gap={4}>
            <Text size="lg" weight="semibold">Handover Notes</Text>
            
            {/* Add Note */}
            <Card className="p-4">
              <VStack gap={2}>
                <TextArea
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
            <VStack gap={2}>
              {handoverNotes.map((note) => (
                <Card key={note.id} className="p-4">
                  <VStack gap={2}>
                    <HStack justify="between" align="start">
                      <HStack gap={2} align="center">
                        <FileText size={16} color="muted" />
                        <Text size="sm" weight="medium">
                          {note.author}
                        </Text>
                        <Badge 
                          variant={
                            note.priority === 'high' ? 'error' : 
                            note.priority === 'medium' ? 'warning' : 
                            'outline'
                          } 
                          size="sm"
                        >
                          {note.priority}
                        </Badge>
                      </HStack>
                      <Text size="xs" color="muted">
                        {note.timestamp.toLocaleTimeString()}
                      </Text>
                    </HStack>
                    <Text size="sm">
                      {note.content}
                    </Text>
                  </VStack>
                </Card>
              ))}
            </VStack>
          </VStack>

          {/* Shift Summary */}
          <Card className="p-6 bg-muted/50">
            <VStack gap={4}>
              <Text size="base" weight="semibold">Shift Summary</Text>
              <Separator />
              
              <HStack gap={8}>
                <VStack gap={1}>
                  <Text size="xs" color="muted">
                    Total Alerts
                  </Text>
                  <Text size="base" weight="semibold">23</Text>
                </VStack>
                
                <VStack gap={1}>
                  <Text size="xs" color="muted">
                    Resolved
                  </Text>
                  <Text size="base" weight="semibold" color="success">18</Text>
                </VStack>
                
                <VStack gap={1}>
                  <Text size="xs" color="muted">
                    Active
                  </Text>
                  <Text size="base" weight="semibold" color="warning">3</Text>
                </VStack>
                
                <VStack gap={1}>
                  <Text size="xs" color="muted">
                    Escalated
                  </Text>
                  <Text size="base" weight="semibold" color="destructive">2</Text>
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