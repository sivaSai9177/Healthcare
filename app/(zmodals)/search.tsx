import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import {
  Text,
  Input,
  Card,
  Stack,
  Container,
  Badge,
  Avatar,
  Tabs,
} from '@/components/universal';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSpacing } from '@/hooks/core/useSpacing';

type SearchCategory = 'all' | 'patients' | 'staff' | 'alerts' | 'documents';

interface SearchResult {
  id: string;
  type: SearchCategory;
  title: string;
  subtitle?: string;
  metadata?: string;
  avatar?: string;
  badge?: string;
}

// Mock search results
const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    type: 'patients',
    title: 'John Doe',
    subtitle: 'MRN: 123456',
    metadata: 'Room 203',
    avatar: 'JD',
  },
  {
    id: '2',
    type: 'staff',
    title: 'Dr. Sarah Smith',
    subtitle: 'Cardiologist',
    metadata: 'On duty',
    avatar: 'SS',
    badge: 'active',
  },
  {
    id: '3',
    type: 'alerts',
    title: 'Critical Patient Alert',
    subtitle: 'Room 203 - High Priority',
    metadata: '10 minutes ago',
    badge: 'critical',
  },
  {
    id: '4',
    type: 'documents',
    title: 'Patient Care Protocol v2.1',
    subtitle: 'Updated guidelines for emergency care',
    metadata: 'Last modified: Jan 5, 2025',
  },
];

export default function SearchModal() {
  const backgroundColor = useThemeColor({}, 'background');
  const spacing = useSpacing();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Patient John Doe',
    'Alert critical',
    'Dr. Smith',
    'Room 203',
  ]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, activeCategory]);

  const handleSearch = () => {
    setIsLoading(true);
    // Simulate API search
    setTimeout(() => {
      const filtered = mockSearchResults.filter(
        (result) =>
          (activeCategory === 'all' || result.type === activeCategory) &&
          (result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            result.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setSearchResults(filtered);
      setIsLoading(false);
    }, 300);
  };

  const handleClose = () => {
    router.back();
  };

  const handleResultPress = (result: SearchResult) => {
    // Add to recent searches
    const updatedRecent = [
      `${result.type} ${result.title}`,
      ...recentSearches.filter((s) => s !== `${result.type} ${result.title}`),
    ].slice(0, 5);
    setRecentSearches(updatedRecent);

    // Navigate based on result type
    switch (result.type) {
      case 'patients':
        router.push(`/(zmodals)/patient-details?patientId=${result.id}`);
        break;
      case 'staff':
        router.push(`/(zmodals)/member-details?memberId=${result.id}`);
        break;
      case 'alerts':
        // TODO: Navigate to alert details
// TODO: Replace with structured logging - console.log('Navigate to alert:', result.id);
        router.back();
        break;
      case 'documents':
        // TODO: Navigate to document viewer
// TODO: Replace with structured logging - console.log('Navigate to document:', result.id);
        router.back();
        break;
    }
  };

  const getResultIcon = (type: SearchCategory) => {
    switch (type) {
      case 'patients':
        return '👤';
      case 'staff':
        return '👨‍⚕️';
      case 'alerts':
        return '🚨';
      case 'documents':
        return '📄';
      default:
        return '🔍';
    }
  };

  return (
    <Container style={{ flex: 1, backgroundColor }}>
      <Stack spacing="md" style={{ flex: 1 }}>
        {/* Search Input */}
        <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
          <Stack spacing="md">
            <Input
              placeholder="Search patients, staff, alerts, documents..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              leftIcon="🔍"
              rightIcon={
                searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Text>✕</Text>
                  </TouchableOpacity>
                ) : null
              }
            />

            {/* Category Tabs */}
            <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as SearchCategory)}>
              <Tabs.List>
                <Tabs.Trigger value="all">All</Tabs.Trigger>
                <Tabs.Trigger value="patients">Patients</Tabs.Trigger>
                <Tabs.Trigger value="staff">Staff</Tabs.Trigger>
                <Tabs.Trigger value="alerts">Alerts</Tabs.Trigger>
                <Tabs.Trigger value="documents">Docs</Tabs.Trigger>
              </Tabs.List>
            </Tabs>
          </Stack>
        </View>

        {/* Results */}
        <ScrollView
          contentContainerStyle={{
            padding: spacing.md,
            paddingTop: 0,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Stack spacing="md">
            {/* Loading State */}
            {isLoading && (
              <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                <ActivityIndicator />
              </View>
            )}

            {/* Recent Searches (when no query) */}
            {!searchQuery && !isLoading && (
              <>
                <Text variant="h4">Recent Searches</Text>
                <Stack spacing="sm">
                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSearchQuery(search)}
                    >
                      <Card>
                        <Stack direction="row" spacing="sm" align="center">
                          <Text variant="body" style={{ opacity: 0.5 }}>
                            🕐
                          </Text>
                          <Text variant="body">{search}</Text>
                        </Stack>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </Stack>
              </>
            )}

            {/* Search Results */}
            {searchQuery && !isLoading && (
              <>
                <Stack direction="row" justify="between" align="center">
                  <Text variant="h4">
                    {searchResults.length} Result{searchResults.length !== 1 ? 's' : ''}
                  </Text>
                  <TouchableOpacity onPress={handleClose}>
                    <Text variant="body" style={{ opacity: 0.7 }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </Stack>

                {searchResults.length === 0 ? (
                  <Card>
                    <Stack spacing="sm" align="center" style={{ padding: spacing.xl }}>
                      <Text variant="h4" style={{ opacity: 0.5 }}>
                        No results found
                      </Text>
                      <Text variant="body" style={{ opacity: 0.5 }}>
                        Try adjusting your search or filters
                      </Text>
                    </Stack>
                  </Card>
                ) : (
                  searchResults.map((result) => (
                    <TouchableOpacity
                      key={result.id}
                      onPress={() => handleResultPress(result)}
                      activeOpacity={0.7}
                    >
                      <Card>
                        <Stack direction="row" spacing="md" align="center">
                          {result.avatar ? (
                            <Avatar size="md" fallback={result.avatar} />
                          ) : (
                            <Text variant="h4">{getResultIcon(result.type)}</Text>
                          )}
                          <Stack spacing="xs" style={{ flex: 1 }}>
                            <Stack direction="row" spacing="sm" align="center">
                              <Text variant="body" weight="medium">
                                {result.title}
                              </Text>
                              {result.badge && (
                                <Badge
                                  variant={
                                    result.badge === 'critical'
                                      ? 'destructive'
                                      : result.badge === 'active'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                  size="sm"
                                >
                                  {result.badge}
                                </Badge>
                              )}
                            </Stack>
                            {result.subtitle && (
                              <Text variant="caption" style={{ opacity: 0.7 }}>
                                {result.subtitle}
                              </Text>
                            )}
                            {result.metadata && (
                              <Text variant="caption" style={{ opacity: 0.5 }}>
                                {result.metadata}
                              </Text>
                            )}
                          </Stack>
                          <Text variant="body" style={{ opacity: 0.5 }}>
                            →
                          </Text>
                        </Stack>
                      </Card>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </Stack>
        </ScrollView>
      </Stack>
    </Container>
  );
}