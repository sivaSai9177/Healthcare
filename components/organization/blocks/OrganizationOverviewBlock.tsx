import React from 'react';
import { View } from 'react-native';
import { Card } from '@/components/universal/Card';
import { Text } from '@/components/universal/Text';
import { Badge } from '@/components/universal/Badge';
import { Button } from '@/components/universal/Button';
import { Grid } from '@/components/universal/Grid';
import { Avatar } from '@/components/universal/Avatar';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { Building2, Users, Shield, Settings } from '@/components/universal/Symbols';

interface OrganizationOverviewBlockProps {
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
  const { colors } = useTheme();
  const spacing = useSpacing();
  
  // Golden ratio dimensions: 377x233px
  const goldenWidth = 377;
  const goldenHeight = 233;
  
  const planColors = {
    free: { bg: colors.muted, text: colors.mutedForeground },
    pro: { bg: colors.primary, text: colors.primaryForeground },
    enterprise: { bg: colors.accent, text: colors.accentForeground },
  };
  
  return (
    <Card
      animated
      animationType="lift"
      style={{
        width: '100%',
        maxWidth: goldenWidth,
        minHeight: goldenHeight,
      }}
    >
      <Card.Header>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
          {organization.logo ? (
            <Avatar 
              src={organization.logo} 
              alt={organization.name}
              size="lg"
              fallback={organization.name.substring(0, 2).toUpperCase()}
            />
          ) : (
            <View 
              style={{
                width: 64,
                height: 64,
                borderRadius: spacing.md,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={32} color={colors.primaryForeground} />
            </View>
          )}
          
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Card.Title>{organization.name}</Card.Title>
              <Badge variant="secondary" size="sm">
                {organization.plan.toUpperCase()}
              </Badge>
            </View>
            {organization.industry && (
              <Text variant="muted" size="sm">{organization.industry}</Text>
            )}
          </View>
        </View>
      </Card.Header>
      
      <Card.Content>
        <Grid cols={2} gap={spacing.md}>
          <View style={[
            {
              padding: spacing.md,
              borderRadius: spacing.sm,
              backgroundColor: colors.muted,
            }
          ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Users size={16} color={colors.mutedForeground} />
              <Text variant="muted" size="sm">Members</Text>
            </View>
            <Text size="2xl" weight="bold">{organization.memberCount}</Text>
          </View>
          
          <View style={[
            {
              padding: spacing.md,
              borderRadius: spacing.sm,
              backgroundColor: planColors[organization.plan].bg,
            }
          ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Shield size={16} color={planColors[organization.plan].text} />
              <Text 
                size="sm"
                style={{ color: planColors[organization.plan].text }}
              >
                Plan
              </Text>
            </View>
            <Text 
              size="2xl" 
              weight="bold"
              style={{ color: planColors[organization.plan].text }}
            >
              {organization.plan}
            </Text>
          </View>
        </Grid>
      </Card.Content>
      
      <Card.Footer>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Users size={16} />}
            onPress={onManageTeam}
            style={{ flex: 1 }}
          >
            Manage Team
          </Button>
          {organization.plan !== 'enterprise' && (
            <Button
              variant="solid"
              size="sm"
              onPress={onUpgradePlan}
              style={{ flex: 1 }}
            >
              Upgrade
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Settings size={16} />}
            onPress={onSettings}
          >
            Settings
          </Button>
        </View>
      </Card.Footer>
    </Card>
  );
}