import React from 'react';
import { View, ScrollView, Text as RNText } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme/provider';
import { 
  Container,
  Text,
  Card,
  VStack,
  Box,
} from '@/components/universal';
import { 
  DashboardGrid,
  Widget,
  WidgetGrid,
} from '@/components/universal/layout/WidgetGrid';
import { useResponsive } from '@/hooks/responsive';

export default function TestGridLayout() {
  const theme = useTheme();
  const { isDesktop, isMobile, isTablet, breakpoint } = useResponsive();
  
  const renderTestWidget = (title: string, size: 'small' | 'medium' | 'large' | 'full', color: string) => (
    <Widget size={size}>
      <Card style={{ backgroundColor: color, height: '100%', minHeight: 150 }}>
        <Box p={4}>
          <VStack gap={2}>
            <Text weight="bold">{title}</Text>
            <Text size="sm">Size: {size}</Text>
            <Text size="xs">Desktop: {isDesktop ? 'Yes' : 'No'}</Text>
            <Text size="xs">Breakpoint: {breakpoint}</Text>
          </VStack>
        </Box>
      </Card>
    </Widget>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView>
        <Container>
          <VStack gap={4} p={4}>
            <Text size="xl" weight="bold">Grid Layout Test</Text>
            
            <RNText>Device Info:</RNText>
            <RNText>- Desktop: {isDesktop ? 'Yes' : 'No'}</RNText>
            <RNText>- Tablet: {isTablet ? 'Yes' : 'No'}</RNText>
            <RNText>- Mobile: {isMobile ? 'Yes' : 'No'}</RNText>
            <RNText>- Breakpoint: {breakpoint}</RNText>
            
            <Text size="lg" weight="semibold">Using DashboardGrid:</Text>
            <DashboardGrid>
              {renderTestWidget('Full Width', 'full', '#FFE5E5')}
              {renderTestWidget('Large 1', 'large', '#E5F3FF')}
              {renderTestWidget('Medium 1', 'medium', '#E5FFE5')}
              {renderTestWidget('Medium 2', 'medium', '#FFFFE5')}
              {renderTestWidget('Small 1', 'small', '#FFE5FF')}
              {renderTestWidget('Small 2', 'small', '#E5FFFF')}
              {renderTestWidget('Small 3', 'small', '#F0E5FF')}
            </DashboardGrid>
            
            <Text size="lg" weight="semibold">Using WidgetGrid directly:</Text>
            <WidgetGrid maxWidth={1440} center padding={4} gap={4}>
              {renderTestWidget('Full Width', 'full', '#FFE5E5')}
              {renderTestWidget('Large 1', 'large', '#E5F3FF')}
              {renderTestWidget('Medium 1', 'medium', '#E5FFE5')}
              {renderTestWidget('Medium 2', 'medium', '#FFFFE5')}
              {renderTestWidget('Small 1', 'small', '#FFE5FF')}
              {renderTestWidget('Small 2', 'small', '#E5FFFF')}
              {renderTestWidget('Small 3', 'small', '#F0E5FF')}
            </WidgetGrid>
          </VStack>
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
}