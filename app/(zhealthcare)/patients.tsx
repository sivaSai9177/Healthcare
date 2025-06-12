import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api/trpc';
import {
  Text,
  Card,
  Badge,
  VStack,
  HStack,
  Heading,
  Input,
  Avatar,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  EmptyState,
  Button,
} from '@/components/universal';
import { User, Search, AlertCircle, Heart, Activity, Calendar } from '@/components/universal/Symbols';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { LoadingView } from '@/components/LoadingView';
import { format } from 'date-fns';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  roomNumber: string;
  diagnosis: string;
  admittedAt: Date;
  status: 'stable' | 'critical' | 'monitoring' | 'recovering';
  assignedDoctor: {
    id: string;
    name: string;
  };
  vitals: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenLevel: number;
  };
  recentAlerts: number;
}

export default function PatientsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const spacing = useSpacing();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - replace with actual API call
  const { data: patients = [], isLoading, refetch } = api.healthcare.getPatients.useQuery({
    search: searchQuery,
    status: activeTab === 'all' ? undefined : activeTab,
  });

  // Mock patients data for now
  const mockPatients: Patient[] = [
    {
      id: '1',
      name: 'John Doe',
      age: 45,
      gender: 'Male',
      roomNumber: '301',
      diagnosis: 'Post-operative recovery',
      admittedAt: new Date('2025-01-10'),
      status: 'stable',
      assignedDoctor: { id: '1', name: 'Dr. Smith' },
      vitals: {
        heartRate: 72,
        bloodPressure: '120/80',
        temperature: 98.6,
        oxygenLevel: 98,
      },
      recentAlerts: 0,
    },
    {
      id: '2',
      name: 'Jane Smith',
      age: 67,
      gender: 'Female',
      roomNumber: '305',
      diagnosis: 'Cardiac monitoring',
      admittedAt: new Date('2025-01-09'),
      status: 'monitoring',
      assignedDoctor: { id: '2', name: 'Dr. Johnson' },
      vitals: {
        heartRate: 85,
        bloodPressure: '140/90',
        temperature: 99.1,
        oxygenLevel: 95,
      },
      recentAlerts: 2,
    },
    {
      id: '3',
      name: 'Robert Brown',
      age: 72,
      gender: 'Male',
      roomNumber: '310',
      diagnosis: 'Pneumonia',
      admittedAt: new Date('2025-01-08'),
      status: 'critical',
      assignedDoctor: { id: '3', name: 'Dr. Williams' },
      vitals: {
        heartRate: 95,
        bloodPressure: '150/95',
        temperature: 101.2,
        oxygenLevel: 92,
      },
      recentAlerts: 5,
    },
  ];

  const filteredPatients = mockPatients.filter(patient => 
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.roomNumber.includes(searchQuery) ||
    patient.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return theme.colors.primary;
      case 'critical': return theme.colors.destructive;
      case 'monitoring': return 'theme.warning';
      case 'recovering': return '#51cf66';
      default: return theme.colors.muted;
    }
  };

  const renderPatient = (patient: Patient) => (
    <Pressable
      key={patient.id}
      onPress={() => router.push(`/(zmodals)/patient-details?id=${patient.id}`)}
    >
      <Card style={{ marginBottom: spacing.md }}>
        <VStack space={spacing.md}>
          <HStack space={spacing.md} style={{ alignItems: 'center' }}>
            <Avatar size={50}>
              <Text style={{ fontSize: 20, fontWeight: '600' }}>
                {patient.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </Avatar>
            
            <VStack space={spacing.xs} style={{ flex: 1 }}>
              <HStack space={spacing.sm} style={{ alignItems: 'center' }}>
                <Text style={{ fontWeight: '600', fontSize: 16 }}>{patient.name}</Text>
                <Badge
                  variant="outline"
                  style={{
                    borderColor: getStatusColor(patient.status),
                    backgroundColor: getStatusColor(patient.status) + '20',
                  }}
                >
                  <Text style={{ color: getStatusColor(patient.status), fontSize: 12 }}>
                    {patient.status.toUpperCase()}
                  </Text>
                </Badge>
              </HStack>
              
              <HStack space={spacing.md}>
                <Text style={{ fontSize: 14, color: theme.colors.mutedForeground }}>
                  {patient.age} yrs • {patient.gender}
                </Text>
                <Text style={{ fontSize: 14, color: theme.colors.mutedForeground }}>
                  Room {patient.roomNumber}
                </Text>
              </HStack>
            </VStack>

            {patient.recentAlerts > 0 && (
              <Badge variant="destructive">
                <AlertCircle size={14} />
                <Text>{patient.recentAlerts}</Text>
              </Badge>
            )}
          </HStack>

          <Text style={{ color: theme.colors.mutedForeground }}>
            {patient.diagnosis}
          </Text>

          <HStack space={spacing.lg} style={{ justifyContent: 'space-between' }}>
            <VStack space={spacing.xs}>
              <HStack space={spacing.xs} style={{ alignItems: 'center' }}>
                <Heart size={16} color={theme.colors.mutedForeground} />
                <Text style={{ fontSize: 14 }}>{patient.vitals.heartRate} bpm</Text>
              </HStack>
              <HStack space={spacing.xs} style={{ alignItems: 'center' }}>
                <Activity size={16} color={theme.colors.mutedForeground} />
                <Text style={{ fontSize: 14 }}>{patient.vitals.bloodPressure}</Text>
              </HStack>
            </VStack>

            <VStack space={spacing.xs}>
              <Text style={{ fontSize: 14 }}>
                Temp: {patient.vitals.temperature}°F
              </Text>
              <Text style={{ fontSize: 14 }}>
                O2: {patient.vitals.oxygenLevel}%
              </Text>
            </VStack>

            <VStack space={spacing.xs} style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 12, color: theme.colors.mutedForeground }}>
                {patient.assignedDoctor.name}
              </Text>
              <HStack space={spacing.xs} style={{ alignItems: 'center' }}>
                <Calendar size={14} color={theme.colors.mutedForeground} />
                <Text style={{ fontSize: 12, color: theme.colors.mutedForeground }}>
                  {format(patient.admittedAt, 'MMM d')}
                </Text>
              </HStack>
            </VStack>
          </HStack>
        </VStack>
      </Card>
    </Pressable>
  );

  if (isLoading) {
    return <LoadingView />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ padding: spacing.lg }}
      >
        <VStack space={spacing.lg}>
          {/* Header */}
          <VStack space={spacing.md}>
            <Heading size="lg">Patients</Heading>
            
            {/* Search */}
            <Input
              placeholder="Search patients by name, room, or diagnosis..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              leftIcon={<Search size={20} />}
            />
          </VStack>

          {/* Stats Cards */}
          <HStack space={spacing.md} style={{ flexWrap: 'wrap' }}>
            <Card style={{ flex: 1, minWidth: 150 }}>
              <VStack space={spacing.xs} style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: '600' }}>
                  {filteredPatients.length}
                </Text>
                <Text style={{ color: theme.colors.mutedForeground }}>
                  Total Patients
                </Text>
              </VStack>
            </Card>
            
            <Card style={{ flex: 1, minWidth: 150 }}>
              <VStack space={spacing.xs} style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: '600', color: theme.colors.destructive }}>
                  {filteredPatients.filter(p => p.status === 'critical').length}
                </Text>
                <Text style={{ color: theme.colors.mutedForeground }}>
                  Critical
                </Text>
              </VStack>
            </Card>
          </HStack>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="critical">Critical</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              <TabsTrigger value="stable">Stable</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredPatients.length === 0 ? (
                <EmptyState
                  icon={<User size={48} />}
                  title="No patients found"
                  description="No patients match your search criteria"
                />
              ) : (
                <VStack space={spacing.md}>
                  {filteredPatients
                    .filter(p => activeTab === 'all' || p.status === activeTab)
                    .map(renderPatient)}
                </VStack>
              )}
            </TabsContent>
          </Tabs>
        </VStack>
      </ScrollView>
    </View>
  );
}