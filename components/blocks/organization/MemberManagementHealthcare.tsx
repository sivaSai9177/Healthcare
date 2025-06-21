import React, { useState } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Badge, 
  Avatar,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Box,
} from '@/components/universal';
import { cn } from '@/lib/core/utils';
import { useSpacing } from '@/lib/stores/spacing-store';
import { SearchSymbol, UserPlus } from '@/components/universal/display/Symbols';
import { api } from '@/lib/api/trpc';
import { useShadow } from '@/hooks/useShadow';

interface HealthcareMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'member' | 'guest';
  healthcareRole?: 'head_doctor' | 'doctor' | 'nurse' | 'operator';
  avatar?: string;
  joinedAt: Date;
  lastActive?: Date;
  isOnDuty?: boolean;
  department?: string;
  specialization?: string;
  shiftStartTime?: Date;
}

export interface MemberManagementHealthcareProps {
  organizationId: string;
  canManageMembers?: boolean;
  onInviteMember?: () => void;
  showHealthcareInfo?: boolean;
}

export function MemberManagementHealthcare({
  organizationId,
  canManageMembers = false,
  onInviteMember,
  showHealthcareInfo = true,
}: MemberManagementHealthcareProps) {
  const { spacing } = useSpacing();
  const shadowMd = useShadow({ size: 'md' });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch members with healthcare data
  const { data: response, isLoading } = api.organization.getMembersWithHealthcare.useQuery({
    organizationId,
  });
  
  const members = response?.members || [];
  
  const roleVariants = {
    owner: 'error',
    admin: 'default',
    manager: 'secondary',
    member: 'outline',
    guest: 'outline',
  } as const;
  
  const healthcareRoleColors = {
    head_doctor: 'destructive',
    doctor: 'default',
    nurse: 'secondary',
    operator: 'outline',
  } as const;
  
  const filteredMembers = members.filter((member: HealthcareMember) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const onDutyCount = members.filter((m: HealthcareMember) => m.isOnDuty).length;
  
  return (
    <Card
      style={[shadowMd, { width: '100%', maxWidth: 800 }]}
      className="animate-fade-in"
    >
      <CardHeader>
        <HStack justifyContent="space-between" alignItems="center">
          <VStack gap={1}>
            <CardTitle>Team Members ({members.length})</CardTitle>
            {showHealthcareInfo && (
              <Text size="sm" colorTheme="mutedForeground">
                {onDutyCount} currently on duty
              </Text>
            )}
          </VStack>
          {canManageMembers && (
            <Button
              size="sm"
              onPress={onInviteMember}
              variant="outline"
            >
              <HStack gap={2} alignItems="center">
                <UserPlus size={16} />
                <Text>Invite</Text>
              </HStack>
            </Button>
          )}
        </HStack>
      </CardHeader>
      
      <CardContent>
        <VStack gap={spacing[4]}>
          {/* Search */}
          <View style={{ position: 'relative' }}>
            <SearchSymbol 
              size={20} 
              style={{ 
                position: 'absolute', 
                left: spacing[3], 
                top: '50%',
                transform: [{ translateY: -10 }],
                zIndex: 1,
              }} 
            />
            <Input
              placeholder="Search by name, email, department..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ paddingLeft: spacing[10] }}
            />
          </View>
          
          {/* Members List */}
          <ScrollView 
            style={{ maxHeight: 400 }}
            showsVerticalScrollIndicator={false}
          >
            <VStack gap={spacing[3]}>
              {isLoading ? (
                <Text colorTheme="mutedForeground">Loading members...</Text>
              ) : filteredMembers.length === 0 ? (
                <Text colorTheme="mutedForeground">No members found</Text>
              ) : (
                filteredMembers.map((member: HealthcareMember) => (
                  <Card key={member.id} className="p-3">
                    <HStack gap={spacing[3]} alignItems="center">
                      {/* Avatar with online indicator */}
                      <View style={{ position: 'relative' }}>
                        <Avatar
                          source={member.avatar ? { uri: member.avatar } : undefined}
                          name={member.name}
                          size="md"
                        />
                        {member.isOnDuty && (
                          <Box
                            position="absolute"
                            bottom={0}
                            right={0}
                            width={12}
                            height={12}
                            bg="success"
                            rounded="full"
                            borderWidth={2}
                            borderTheme="background"
                          />
                        )}
                      </View>
                      
                      {/* Member Info */}
                      <VStack gap={1} flex={1}>
                        <HStack gap={2} alignItems="center" flexWrap="wrap">
                          <Text weight="medium">{member.name}</Text>
                          {member.isOnDuty && (
                            <Badge variant="success" size="sm">On Duty</Badge>
                          )}
                        </HStack>
                        <Text size="sm" colorTheme="mutedForeground">
                          {member.email}
                        </Text>
                        
                        {/* Healthcare Info */}
                        {showHealthcareInfo && member.healthcareRole && (
                          <HStack gap={2} alignItems="center" flexWrap="wrap">
                            <Badge 
                              variant={healthcareRoleColors[member.healthcareRole]} 
                              size="sm"
                            >
                              {member.healthcareRole.replace('_', ' ')}
                            </Badge>
                            {member.department && (
                              <Text size="xs" colorTheme="mutedForeground">
                                {member.department}
                              </Text>
                            )}
                            {member.specialization && (
                              <Text size="xs" colorTheme="mutedForeground">
                                • {member.specialization}
                              </Text>
                            )}
                          </HStack>
                        )}
                        
                        {/* Shift Info */}
                        {member.isOnDuty && member.shiftStartTime && (
                          <Text size="xs" colorTheme="mutedForeground">
                            On shift since {new Date(member.shiftStartTime).toLocaleTimeString()}
                          </Text>
                        )}
                      </VStack>
                      
                      {/* Organization Role */}
                      <Badge 
                        variant={roleVariants[member.role]} 
                        size="sm"
                      >
                        {member.role}
                      </Badge>
                    </HStack>
                  </Card>
                ))
              )}
            </VStack>
          </ScrollView>
        </VStack>
      </CardContent>
    </Card>
  );
}