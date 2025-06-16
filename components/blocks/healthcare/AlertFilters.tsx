import React from 'react';
import { View } from 'react-native';
import { HStack } from '@/components/universal/layout';
import { Input, Select } from '@/components/universal/form';
import { Button } from '@/components/universal/interaction';
import { Text } from '@/components/universal/typography';
import { 
  Search, 
  Filter,
  X,
} from '@/components/universal/display/Symbols';
import { SpacingScale } from '@/lib/design';
import { useSpacing } from '@/lib/stores/spacing-store';
import { useResponsive } from '@/hooks/responsive';
import { URGENCY_LEVEL_CONFIG, ALERT_TYPE_CONFIG } from '@/types/healthcare';

export interface AlertFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  urgencyFilter: string;
  onUrgencyChange: (urgency: string) => void;
  typeFilter?: string;
  onTypeChange?: (type: string) => void;
  statusFilter?: string;
  onStatusChange?: (status: string) => void;
  onReset?: () => void;
}

export function AlertFilters({
  searchQuery,
  onSearchChange,
  urgencyFilter,
  onUrgencyChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  onReset,
}: AlertFiltersProps) {
  const { spacing } = useSpacing();
  const { isMobile } = useResponsive();
  
  const hasActiveFilters = !!(
    searchQuery ||
    (urgencyFilter && urgencyFilter !== 'all') ||
    (typeFilter && typeFilter !== 'all') ||
    (statusFilter && statusFilter !== 'all')
  );
  
  return (
    <View>
      <HStack gap={spacing[2] as SpacingScale} align="center" style={{ flexWrap: 'wrap' }}>
        {/* Search Input */}
        <View style={{ flex: 1, minWidth: 200 }}>
          <Input
            placeholder="Search by room or description..."
            value={searchQuery}
            onChangeText={onSearchChange}
            leftIcon={<Search size={20} />}
          />
        </View>
        
        {/* Urgency Filter */}
        <Select 
          value={urgencyFilter} 
          onValueChange={onUrgencyChange}
          placeholder="Urgency"
          options={[
            { label: 'All Levels', value: 'all' },
            ...Object.entries(URGENCY_LEVEL_CONFIG).map(([level, config]) => ({
              label: config.label,
              value: level,
            }))
          ]}
          style={{ width: isMobile ? 120 : 140 }}
        />
        
        {/* Type Filter */}
        {onTypeChange && (
          <Select 
            value={typeFilter || 'all'} 
            onValueChange={onTypeChange}
            placeholder="Type"
            options={[
              { label: 'All Types', value: 'all' },
              ...Object.entries(ALERT_TYPE_CONFIG).map(([type, config]) => ({
                label: `${config.icon} ${type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
                value: type,
              }))
            ]}
            style={{ width: isMobile ? 140 : 160 }}
          />
        )}
        
        {/* Status Filter */}
        {onStatusChange && (
          <Select 
            value={statusFilter || 'all'} 
            onValueChange={onStatusChange}
            placeholder="Status"
            options={[
              { label: 'All Status', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Acknowledged', value: 'acknowledged' },
              { label: 'Resolved', value: 'resolved' },
            ]}
            style={{ width: isMobile ? 120 : 140 }}
          />
        )}
        
        {/* Reset Button */}
        {hasActiveFilters && onReset && (
          <Button
            variant="ghost"
            size="sm"
            onPress={onReset}
          >
            <X size={16} />
            <Text>Clear</Text>
          </Button>
        )}
      </HStack>
    </View>
  );
}