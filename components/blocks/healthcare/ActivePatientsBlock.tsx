import React from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api/trpc';
import { format } from 'date-fns';
import { 
  Card, 
  Text, 
  Button, 
  Badge, 
  Skeleton,
  HStack,
  VStack,
} from '@/components/universal';
import {
  Users,
  Heart,
  Activity,
  Thermometer,
  Clock,
  ChevronRightIcon,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from '@/components/universal/Symbols';

interface PatientData {
  id: string;
  name: string;
  age: number;
  condition: string;
  roomNumber: string;
  vitalSigns: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSaturation: number;
  };
  lastChecked: Date;
  trend: 'improving' | 'stable' | 'declining';
  alerts: number;
}

export function ActivePatientsBlock() {
  const router = useRouter();
  
  // Fetch patients data
  const { data: patients, isLoading } = api.healthcare.getActivePatients.useQuery({
    limit: 5,
    includeVitals: true,
  });

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!patients) return { total: 0, critical: 0, improving: 0 };
    
    return {
      total: patients.length,
      critical: patients.filter((p: any) => p.condition === 'critical').length,
      improving: patients.filter((p: any) => p.trend === 'improving').length,
    };
  }, [patients]);

  if (isLoading) {
    return (
      <Card p={6}>
        <VStack spacing={4}>
          <Skeleton className="h-8 w-48" />
          <VStack spacing={3}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </VStack>
        </VStack>
      </Card>
    );
  }

  const getVitalIcon = (type: string) => {
    switch (type) {
      case 'heartRate':
        return <Heart size={16} className="text-red-500" />;
      case 'bloodPressure':
        return <Activity size={16} className="text-blue-500" />;
      case 'temperature':
        return <Thermometer size={16} className="text-orange-500" />;
      case 'oxygenSaturation':
        return <Activity size={16} className="text-cyan-500" />;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp size={16} className="text-green-500" />;
      case 'declining':
        return <TrendingDown size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const formatVitalValue = (type: string, value: any) => {
    switch (type) {
      case 'heartRate':
        return `${value} bpm`;
      case 'bloodPressure':
        return value;
      case 'temperature':
        return `${value}°F`;
      case 'oxygenSaturation':
        return `${value}%`;
      default:
        return value;
    }
  };

  const getVitalStatus = (type: string, value: number) => {
    switch (type) {
      case 'heartRate':
        if (value < 60 || value > 100) return 'warning';
        return 'normal';
      case 'temperature':
        if (value < 97.0 || value > 99.5) return 'warning';
        return 'normal';
      case 'oxygenSaturation':
        if (value < 95) return 'warning';
        return 'normal';
      default:
        return 'normal';
    }
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'critical':
        return <Badge variant="error" size="sm">Critical</Badge>;
      case 'stable':
        return <Badge variant="success" size="sm">Stable</Badge>;
      case 'improving':
        return <Badge variant="default" size="sm">Improving</Badge>;
      case 'monitoring':
        return <Badge variant="secondary" size="sm">Monitoring</Badge>;
      default:
        return <Badge variant="default" size="sm">{condition}</Badge>;
    }
  };

  const renderPatientCard = (patient: PatientData) => {
    return (
      <Card
        key={patient.id}
        p={4}
        pressable
        onPress={() => router.push(`/(healthcare)/patients/${patient.id}`)}
        className="border border-border"
      >
        <VStack spacing={3}>
          {/* Patient Header */}
          <HStack className="justify-between items-start">
            <VStack spacing={1}>
              <Text className="text-base font-semibold">{patient.name}</Text>
              <HStack spacing={2} className="items-center">
                <Text className="text-sm text-muted-foreground">
                  {patient.age} years • Room {patient.roomNumber}
                </Text>
                {patient.alerts > 0 && (
                  <Badge variant="error" size="xs">
                    <AlertCircle size={12} />
                    <Text className="ml-1">{patient.alerts}</Text>
                  </Badge>
                )}
              </HStack>
            </VStack>
            <HStack spacing={2} className="items-center">
              {getTrendIcon(patient.trend)}
              {getConditionBadge(patient.condition)}
            </HStack>
          </HStack>

          {/* Vital Signs */}
          <HStack spacing={4} className="flex-wrap">
            {Object.entries(patient.vitalSigns).map(([key, value]) => {
              const status = getVitalStatus(key, typeof value === 'number' ? value : 0);
              return (
                <HStack key={key} spacing={1} className="items-center">
                  {getVitalIcon(key)}
                  <Text 
                    className={`text-sm ${
                      status === 'warning' ? 'text-orange-500 font-medium' : 'text-foreground'
                    }`}
                  >
                    {formatVitalValue(key, value)}
                  </Text>
                </HStack>
              );
            })}
          </HStack>

          {/* Last Checked */}
          <HStack spacing={1} className="items-center">
            <Clock size={14} className="text-muted-foreground" />
            <Text className="text-xs text-muted-foreground">
              Last checked {format(patient.lastChecked, 'h:mm a')}
            </Text>
          </HStack>
        </VStack>
      </Card>
    );
  };

  return (
    <Card p={6}>
      <VStack spacing={4}>
        {/* Header */}
        <HStack className="justify-between items-center">
          <HStack spacing={2} className="items-center">
            <Users size={24} className="text-primary" />
            <Text className="text-xl font-semibold">Active Patients</Text>
          </HStack>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => router.push('/(healthcare)/patients')}
          >
            <Text>View All</Text>
            <ChevronRightIcon size={16} />
          </Button>
        </HStack>

        {/* Stats */}
        <HStack spacing={6}>
          <HStack spacing={1} className="items-center">
            <Text className="text-lg font-bold">{stats.total}</Text>
            <Text className="text-sm text-muted-foreground">Total</Text>
          </HStack>
          
          <HStack spacing={1} className="items-center">
            <View className="w-2 h-2 rounded-full bg-red-500" />
            <Text className="text-lg font-bold">{stats.critical}</Text>
            <Text className="text-sm text-muted-foreground">Critical</Text>
          </HStack>
          
          <HStack spacing={1} className="items-center">
            <View className="w-2 h-2 rounded-full bg-green-500" />
            <Text className="text-lg font-bold">{stats.improving}</Text>
            <Text className="text-sm text-muted-foreground">Improving</Text>
          </HStack>
        </HStack>

        {/* Patient List */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 400 }}
        >
          <VStack spacing={3}>
            {patients?.slice(0, 5).map((patient: any) => renderPatientCard(patient))}
          </VStack>
        </ScrollView>

        {/* Empty State */}
        {(!patients || patients.length === 0) && (
          <View className="py-8 items-center">
            <Users size={48} className="text-muted-foreground mb-2" />
            <Text className="text-muted-foreground">No active patients</Text>
          </View>
        )}
      </VStack>
    </Card>
  );
}