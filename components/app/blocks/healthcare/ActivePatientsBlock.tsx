import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Text,
  Card,
  Badge,
  VStack,
  HStack,
  Avatar,
  Button,
  Progress,
} from '@/components/universal';
import { 
  Users, 
  Heart,
  Activity,
  Thermometer,
  Clock,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from '@/components/universal/Symbols';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useTheme } from '@/lib/theme/provider';

interface Vitals {
  heartRate: number;
  bloodPressure: string;
  temperature: number;
  oxygenLevel: number;
  trend?: 'up' | 'down' | 'stable';
}

interface Patient {
  id: string;
  name: string;
  age: number;
  roomNumber: string;
  condition: 'stable' | 'critical' | 'improving' | 'monitoring';
  admittedAt: Date;
  assignedDoctor: string;
  vitals: Vitals;
  hasActiveAlert?: boolean;
}

interface ActivePatientsBlockProps {
  patients?: Patient[];
  showVitals?: boolean;
  maxItems?: number;
  viewMode?: 'list' | 'grid';
}

export function ActivePatientsBlock({ 
  patients: propPatients,
  showVitals = true,
  maxItems = 4,
  viewMode = 'list'
}: ActivePatientsBlockProps) {
  const router = useRouter();
  const { spacing } = useSpacing();
  const theme = useTheme();

  // Mock data if no patients provided
  const mockPatients: Patient[] = [
    {
      id: '1',
      name: 'John Doe',
      age: 65,
      roomNumber: '205A',
      condition: 'critical',
      admittedAt: new Date(Date.now() - 2 * 24 * 60 * 60000), // 2 days ago
      assignedDoctor: 'Dr. Sarah Wilson',
      vitals: {
        heartRate: 95,
        bloodPressure: '140/90',
        temperature: 38.5,
        oxygenLevel: 92,
        trend: 'down',
      },
      hasActiveAlert: true,
    },
    {
      id: '2',
      name: 'Jane Smith',
      age: 42,
      roomNumber: '312B',
      condition: 'improving',
      admittedAt: new Date(Date.now() - 5 * 24 * 60 * 60000), // 5 days ago
      assignedDoctor: 'Dr. Michael Chen',
      vitals: {
        heartRate: 72,
        bloodPressure: '120/80',
        temperature: 37.2,
        oxygenLevel: 98,
        trend: 'up',
      },
    },
    {
      id: '3',
      name: 'Bob Johnson',
      age: 78,
      roomNumber: '108',
      condition: 'stable',
      admittedAt: new Date(Date.now() - 1 * 24 * 60 * 60000), // 1 day ago
      assignedDoctor: 'Dr. Emily Davis',
      vitals: {
        heartRate: 68,
        bloodPressure: '130/85',
        temperature: 36.8,
        oxygenLevel: 96,
        trend: 'stable',
      },
    },
    {
      id: '4',
      name: 'Alice Brown',
      age: 55,
      roomNumber: '410C',
      condition: 'monitoring',
      admittedAt: new Date(Date.now() - 3 * 60 * 60000), // 3 hours ago
      assignedDoctor: 'Dr. James Wilson',
      vitals: {
        heartRate: 88,
        bloodPressure: '135/88',
        temperature: 37.8,
        oxygenLevel: 94,
        trend: 'down',
      },
    },
  ];

  const patients = propPatients || mockPatients;
  const displayPatients = patients.slice(0, maxItems);

  const stats = {
    total: patients.length,
    critical: patients.filter(p => p.condition === 'critical').length,
    stable: patients.filter(p => p.condition === 'stable').length,
    improving: patients.filter(p => p.condition === 'improving').length,
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'critical':
        return <Badge variant="destructive" size="sm">Critical</Badge>;
      case 'stable':
        return <Badge variant="success" size="sm">Stable</Badge>;
      case 'improving':
        return <Badge variant="default" size="sm">Improving</Badge>;
      case 'monitoring':
        return <Badge variant="secondary" size="sm">Monitoring</Badge>;
      default:
        return null;
    }
  };

  const getVitalStatus = (vital: string, value: number) => {
    const ranges = {
      heartRate: { low: 60, high: 100 },
      temperature: { low: 36.5, high: 37.5 },
      oxygenLevel: { low: 95, high: 100 },
    };

    const range = ranges[vital as keyof typeof ranges];
    if (!range) return 'normal';

    if (value < range.low) return 'low';
    if (value > range.high) return 'high';
    return 'normal';
  };

  const getVitalColor = (status: string) => {
    switch (status) {
      case 'low':
      case 'high':
        return theme.destructive;
      default:
        return theme.foreground;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={12} className="text-green-500" />;
      case 'down':
        return <TrendingDown size={12} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getDaysSince = (date: Date) => {
    const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60000));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  return (
    <Card padding="lg">
      <VStack spacing="md">
        {/* Header */}
        <HStack justify="between" align="center">
          <HStack spacing="sm" align="center">
            <Users size={24} className="text-primary" />
            <Text variant="h5" weight="semibold">Active Patients</Text>
          </HStack>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => router.push('/(zhealthcare)/patients')}
          >
            <Text>View All</Text>
            <ChevronRight size={16} />
          </Button>
        </HStack>

        {/* Stats */}
        <HStack spacing="lg">
          <HStack spacing="xs" align="center">
            <Text variant="h6" weight="bold">{stats.total}</Text>
            <Text variant="body2" className="text-muted-foreground">Total</Text>
          </HStack>
          
          <HStack spacing="xs" align="center">
            <View className="w-2 h-2 rounded-full bg-red-500" />
            <Text variant="body2" weight="medium">{stats.critical}</Text>
            <Text variant="caption" className="text-muted-foreground">Critical</Text>
          </HStack>
          
          <HStack spacing="xs" align="center">
            <View className="w-2 h-2 rounded-full bg-green-500" />
            <Text variant="body2" weight="medium">{stats.stable}</Text>
            <Text variant="caption" className="text-muted-foreground">Stable</Text>
          </HStack>
        </HStack>

        {/* Patient List */}
        <VStack spacing="sm">
          {displayPatients.map((patient) => (
            <Pressable
              key={patient.id}
              onPress={() => router.push(`/(zmodals)/patient-details?id=${patient.id}`)}
            >
              <Card padding="md" className="active:scale-[0.98]">
                <VStack spacing="sm">
                  {/* Patient Info */}
                  <HStack justify="between" align="start">
                    <HStack spacing="md" align="center">
                      <Avatar
                        size="md"
                        fallback={patient.name.split(' ').map(n => n[0]).join('')}
                      />
                      
                      <VStack spacing="xs">
                        <HStack spacing="sm" align="center">
                          <Text variant="body1" weight="semibold">
                            {patient.name}
                          </Text>
                          {patient.hasActiveAlert && (
                            <AlertCircle size={16} className="text-destructive" />
                          )}
                        </HStack>
                        <HStack spacing="md">
                          <Text variant="caption" className="text-muted-foreground">
                            {patient.age} yrs • Room {patient.roomNumber}
                          </Text>
                          <Text variant="caption" className="text-muted-foreground">
                            {getDaysSince(patient.admittedAt)}
                          </Text>
                        </HStack>
                        <Text variant="caption" className="text-muted-foreground">
                          {patient.assignedDoctor}
                        </Text>
                      </VStack>
                    </HStack>
                    
                    {getConditionBadge(patient.condition)}
                  </HStack>

                  {/* Vitals */}
                  {showVitals && (
                    <HStack spacing="md" className="pt-2">
                      {/* Heart Rate */}
                      <VStack spacing="xs" align="center" className="flex-1">
                        <HStack spacing="xs" align="center">
                          <Heart size={14} className="text-muted-foreground" />
                          <Text 
                            variant="caption" 
                            weight="medium"
                            style={{ color: getVitalColor(getVitalStatus('heartRate', patient.vitals.heartRate)) }}
                          >
                            {patient.vitals.heartRate}
                          </Text>
                          {getTrendIcon(patient.vitals.trend)}
                        </HStack>
                        <Text variant="caption" className="text-muted-foreground">
                          bpm
                        </Text>
                      </VStack>

                      {/* Blood Pressure */}
                      <VStack spacing="xs" align="center" className="flex-1">
                        <HStack spacing="xs" align="center">
                          <Activity size={14} className="text-muted-foreground" />
                          <Text variant="caption" weight="medium">
                            {patient.vitals.bloodPressure}
                          </Text>
                        </HStack>
                        <Text variant="caption" className="text-muted-foreground">
                          BP
                        </Text>
                      </VStack>

                      {/* Temperature */}
                      <VStack spacing="xs" align="center" className="flex-1">
                        <HStack spacing="xs" align="center">
                          <Thermometer size={14} className="text-muted-foreground" />
                          <Text 
                            variant="caption" 
                            weight="medium"
                            style={{ color: getVitalColor(getVitalStatus('temperature', patient.vitals.temperature)) }}
                          >
                            {patient.vitals.temperature}°
                          </Text>
                        </HStack>
                        <Text variant="caption" className="text-muted-foreground">
                          Temp
                        </Text>
                      </VStack>

                      {/* Oxygen */}
                      <VStack spacing="xs" align="center" className="flex-1">
                        <HStack spacing="xs" align="center">
                          <Activity size={14} className="text-muted-foreground" />
                          <Text 
                            variant="caption" 
                            weight="medium"
                            style={{ color: getVitalColor(getVitalStatus('oxygenLevel', patient.vitals.oxygenLevel)) }}
                          >
                            {patient.vitals.oxygenLevel}%
                          </Text>
                        </HStack>
                        <Text variant="caption" className="text-muted-foreground">
                          O₂
                        </Text>
                      </VStack>
                    </HStack>
                  )}
                </VStack>
              </Card>
            </Pressable>
          ))}
        </VStack>

        {/* Empty State */}
        {patients.length === 0 && (
          <VStack spacing="sm" align="center" className="py-4">
            <Heart size={48} className="text-muted-foreground" />
            <Text variant="body1" className="text-muted-foreground">
              No active patients
            </Text>
          </VStack>
        )}
      </VStack>
    </Card>
  );
}