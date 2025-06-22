import React from 'react';
import { View, ScrollView, Text as RNText, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme/provider';
import { 
  Container,
  Text,
  Card,
  VStack,
  HStack,
  Box,
  StatusGlassCard,
  Button,
  Skeleton,
} from '@/components/universal';
import { useResponsive } from '@/hooks/responsive';
import { useSpacing } from '@/lib/stores/spacing-store';

export default function TestResponsiveLayout() {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const { isDesktop, isMobile, isTablet, breakpoint } = useResponsive();
  const windowDimensions = Dimensions.get('window');
  
  const content = (
    <VStack gap={spacing[4]}>
      {/* Debug Info */}
      <Card>
        <Box p={4}>
          <VStack gap={2}>
            <Text size="xl" weight="bold">Responsive Layout Test</Text>
            <Text>Window Width: {windowDimensions.width}px</Text>
            <Text>Window Height: {windowDimensions.height}px</Text>
            <Text>Breakpoint: {breakpoint}</Text>
            <Text>isDesktop: {isDesktop ? 'true' : 'false'}</Text>
            <Text>isTablet: {isTablet ? 'true' : 'false'}</Text>
            <Text>isMobile: {isMobile ? 'true' : 'false'}</Text>
          </VStack>
        </Box>
      </Card>
      
      {/* Test Healthcare Dashboard Layout */}
      <Text size="lg" weight="bold">Healthcare Dashboard Layout Test</Text>
      
      {/* Header */}
      <Card>
        <Box p={4}>
          <Text weight="bold">Header Section (Full Width)</Text>
        </Box>
      </Card>
      
      {/* Main Content Area - Mimics Shift Status + Metrics */}
      <View style={{
        flexDirection: isDesktop ? 'row' : 'column',
        flexWrap: 'wrap',
        gap: spacing[4],
        marginHorizontal: isDesktop ? -spacing[2] : 0,
      }}>
        {/* Shift Status */}
        <View style={{ 
          flex: isDesktop ? 0 : 1,
          minWidth: isDesktop ? 350 : undefined,
          width: isDesktop ? '40%' : '100%',
          paddingHorizontal: isDesktop ? spacing[2] : 0,
        }}>
          <StatusGlassCard>
            <Box p={4}>
              <VStack gap={2}>
                <Text weight="bold">Shift Status</Text>
                <Text size="sm">Width: {isDesktop ? '40%' : '100%'}</Text>
                <Text size="sm">Min Width: {isDesktop ? '350px' : 'none'}</Text>
                <Skeleton height={80} />
              </VStack>
            </Box>
          </StatusGlassCard>
        </View>
        
        {/* Metrics Overview */}
        <View style={{ 
          flex: isDesktop ? 1 : 1,
          minWidth: isDesktop ? 400 : undefined,
          paddingHorizontal: isDesktop ? spacing[2] : 0,
        }}>
          <Card>
            <Box p={4}>
              <VStack gap={2}>
                <Text weight="bold">Metrics Overview</Text>
                <Text size="sm">Flex: 1</Text>
                <Text size="sm">Min Width: {isDesktop ? '400px' : 'none'}</Text>
                <Skeleton height={300} />
              </VStack>
            </Box>
          </Card>
        </View>
      </View>
      
      {/* Alert Summary */}
      <Card>
        <Box p={4}>
          <Text weight="bold">Alert Summary (Full Width)</Text>
          <Skeleton height={150} />
        </Box>
      </Card>
      
      {/* Bottom Section - Quick Actions + Active Patients */}
      <View style={{
        flexDirection: isDesktop ? 'row' : 'column',
        flexWrap: 'wrap',
        gap: spacing[4],
        marginHorizontal: isDesktop ? -spacing[2] : 0,
      }}>
        {/* Quick Actions */}
        <View style={{ 
          flex: isDesktop ? 0 : 1,
          minWidth: isDesktop ? 350 : undefined,
          width: isDesktop ? '40%' : '100%',
          paddingHorizontal: isDesktop ? spacing[2] : 0,
        }}>
          <StatusGlassCard>
            <Box p={4}>
              <VStack gap={2}>
                <Text weight="bold">Quick Actions</Text>
                <Text size="sm">Width: {isDesktop ? '40%' : '100%'}</Text>
                <Button variant="glass" fullWidth>Action 1</Button>
                <Button variant="glass" fullWidth>Action 2</Button>
              </VStack>
            </Box>
          </StatusGlassCard>
        </View>
        
        {/* Active Patients */}
        <View style={{ 
          flex: 1,
          minWidth: isDesktop ? 400 : undefined,
          paddingHorizontal: isDesktop ? spacing[2] : 0,
        }}>
          <Card>
            <Box p={4}>
              <VStack gap={2}>
                <Text weight="bold">Active Patients</Text>
                <Text size="sm">Flex: 1</Text>
                <Skeleton height={300} />
              </VStack>
            </Box>
          </Card>
        </View>
      </View>
    </VStack>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          flexGrow: 1,
          padding: spacing[6],
          width: '100%',
          alignItems: 'center'
        }}
      >
        <View style={{ width: '100%', maxWidth: 1440 }}>
          {content}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}