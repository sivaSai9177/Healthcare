import React from 'react';
import { View } from 'react-native';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, Badge, Avatar } from '@/components/universal/display';
import { Text } from '@/components/universal/typography';
import { Button } from '@/components/universal/interaction';
import { Grid, HStack, VStack } from '@/components/universal/layout';
import { cn } from '@/lib/core/utils';
import { haptic } from '@/lib/ui/haptics';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Building2, Users, Shield, Settings } from '@/components/universal/display/Symbols';

export interface OrganizationOverviewBlockProps {
  organization: {
    id: string;
    name: string;
    plan: 'free' | 'pro' | 'enterprise';
    memberCount: number;
    logo?: string;
    industry?: string;
    website?: string;
  };
  onManageTeam?: () => void;
  onUpgradePlan?: () => void;
  onSettings?: () => void;
}

export function OrganizationOverviewBlock({
  organization,
  onManageTeam,
  onUpgradePlan,
  onSettings,
}: OrganizationOverviewBlockProps) {
  const { spacing } = useSpacing();
  
  // Golden ratio dimensions: 377x233px
  const goldenWidth = 377;
  const goldenHeight = 233;
  
  const planVariants = {
    free: 'outline',
    pro: 'default',
    enterprise: 'secondary',
  } as const;
  
  return (
    <Card
      shadow="md"
      className={cn(
        "animate-fade-in",
        "transition-all duration-200",
        "w-full"
      )}
      style={{
        maxWidth: goldenWidth,
        minHeight: goldenHeight,
      }}
    >
      <CardHeader>
        <HStack align="center" gap={spacing[4] as any}>
          {organization.logo ? (
            <Avatar 
              source={{ uri: organization.logo }} 
              name={organization.name}
              size="lg"
            />
          ) : (
            <View 
              className={cn(
                "w-16 h-16 rounded-lg bg-primary",
                "items-center justify-center",
                "animate-scale-in"
              )}
            >
              <Building2 size={32} className="text-primary-foreground" />
            </View>
          )}
          
          <VStack className="flex-1">
            <HStack align="center" gap={spacing[2] as any}>
              <CardTitle>{organization.name}</CardTitle>
              <Badge variant={planVariants[organization.plan]} size="sm">
                {organization.plan.toUpperCase()}
              </Badge>
            </HStack>
            {organization.industry && (
              <Text colorTheme="mutedForeground" size="sm">{organization.industry}</Text>
            )}
          </VStack>
        </HStack>
      </CardHeader>
      
      <CardContent>
        <Grid columns={2} gap={3} className="animate-stagger-in">
          <View className={cn(
            "p-4 rounded-lg bg-muted",
            "animate-fade-in",
            "transition-all duration-200"
          )}>
            <HStack align="center" gap={spacing[1] as any}>
              <Users size={16} className="text-muted-foreground" />
              <Text colorTheme="mutedForeground" size="sm">Members</Text>
            </HStack>
            <Text size="2xl" weight="bold">{organization.memberCount}</Text>
          </View>
          
          <View className={cn(
            "p-4 rounded-lg",
            organization.plan === 'free' && "bg-muted",
            organization.plan === 'pro' && "bg-primary",
            organization.plan === 'enterprise' && "bg-secondary",
            "animate-fade-in delay-100",
            "transition-all duration-200"
          )}>
            <HStack align="center" gap={spacing[1] as any}>
              <Shield size={16} className={cn(
                organization.plan === 'free' && "text-muted-foreground",
                organization.plan === 'pro' && "text-primary-foreground",
                organization.plan === 'enterprise' && "text-secondary-foreground"
              )} />
              <Text 
                size="sm"
                className={cn(
                  organization.plan === 'free' && "text-muted-foreground",
                  organization.plan === 'pro' && "text-primary-foreground",
                  organization.plan === 'enterprise' && "text-secondary-foreground"
                )}
              >
                Plan
              </Text>
            </HStack>
            <Text 
              size="2xl" 
              weight="bold"
              className={cn(
                organization.plan === 'free' && "text-muted-foreground",
                organization.plan === 'pro' && "text-primary-foreground",
                organization.plan === 'enterprise' && "text-secondary-foreground"
              )}
            >
              {organization.plan}
            </Text>
          </View>
        </Grid>
      </CardContent>
      
      <CardFooter>
        <HStack gap={spacing[2] as any}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Users size={16} />}
            onPress={() => {
              haptic('light');
              onManageTeam?.();
            }}
            className="animate-scale-in"
            style={{ flex: 1 }}
          >
            Manage Team
          </Button>
          {organization.plan !== 'enterprise' && (
            <Button
              variant="default"
              size="sm"
              onPress={() => {
                haptic('success');
                onUpgradePlan?.();
              }}
              className="animate-scale-in delay-100"
              style={{ flex: 1 }}
            >
              Upgrade
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Settings size={16} />}
            onPress={() => {
              haptic('light');
              onSettings?.();
            }}
            className="animate-scale-in delay-200"
          >
            Settings
          </Button>
        </HStack>
      </CardFooter>
    </Card>
  );
}