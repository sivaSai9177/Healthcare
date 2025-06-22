import React from 'react';
import { ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Container, 
  VStack, 
  Text, 
  Card, 
  Heading1, 
  Button,
  HStack,
  Badge,
} from '@/components/universal';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme/provider';

export default function TestTextSelection() {
  const router = useRouter();
  const theme = useTheme();
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView>
        <Container className="py-8">
          <VStack gap={6}>
            <HStack justifyContent="space-between" alignItems="center">
              <Heading1>Text Selection Test</Heading1>
              <Button 
                onPress={() => router.back()} 
                variant="outline"
                size="sm"
              >
                Back
              </Button>
            </HStack>
            
            <Card className="p-6">
              <VStack gap={4}>
                <Text size="lg" weight="semibold">
                  WebKit Text Selection Feature
                </Text>
                
                <Text>
                  Platform: {Platform.OS}
                </Text>
                
                <Badge variant="secondary">
                  Default selectable on Web
                </Badge>
              </VStack>
            </Card>
            
            <Card className="p-6">
              <VStack gap={4}>
                <Text size="md" weight="semibold">
                  Default Text (Selectable on Web)
                </Text>
                <Text>
                  This text should be selectable on web browsers by default. 
                  Try selecting and copying this text on web. On native platforms, 
                  it won't be selectable unless explicitly set.
                </Text>
              </VStack>
            </Card>
            
            <Card className="p-6">
              <VStack gap={4}>
                <Text size="md" weight="semibold">
                  Explicitly Non-Selectable Text
                </Text>
                <Text selectable={false}>
                  This text is explicitly set to non-selectable. Even on web, 
                  you shouldn't be able to select or copy this text.
                </Text>
              </VStack>
            </Card>
            
            <Card className="p-6">
              <VStack gap={4}>
                <Text size="md" weight="semibold">
                  Explicitly Selectable Text
                </Text>
                <Text selectable={true}>
                  This text is explicitly set to selectable. It should be 
                  selectable on all platforms, including native mobile apps.
                </Text>
              </VStack>
            </Card>
            
            <Card className="p-6">
              <VStack gap={4}>
                <Text size="md" weight="semibold">
                  Important Information
                </Text>
                <Text>
                  Patient ID: PAT-2024-001234
                </Text>
                <Text>
                  Hospital: St. Mary's Medical Center
                </Text>
                <Text>
                  Department: Cardiology Ward 3
                </Text>
                <Text colorTheme="mutedForeground" size="sm">
                  All of this information should be easily copyable on web.
                </Text>
              </VStack>
            </Card>
          </VStack>
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
}