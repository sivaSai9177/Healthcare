import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/ui/card';
import { Button } from '@/components/shadcn/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function ExploreScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333333' }}>
            Explore Features
          </Text>
          <Text style={{ fontSize: 16, color: '#666666', textAlign: 'center', marginTop: 8 }}>
            Discover what you can do with this full-stack starter
          </Text>
        </View>

        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.name || 'User'}!</CardTitle>
            <CardDescription>
              You&apos;re signed in as: {user?.role || 'guest'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Text style={{ color: '#666666', marginBottom: 12 }}>
              This is a full-stack Expo starter with authentication, database, and tRPC integration.
            </Text>
            <Button 
              variant="outline" 
              onPress={() => console.log('Feature coming soon!')}
            >
              <Text>Explore Features</Text>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tech Stack</CardTitle>
            <CardDescription>Built with modern technologies</CardDescription>
          </CardHeader>
          <CardContent style={{ gap: 8 }}>
            <Text style={{ color: '#666666' }}>• React Native + Expo</Text>
            <Text style={{ color: '#666666' }}>• Better Auth + tRPC</Text>
            <Text style={{ color: '#666666' }}>• PostgreSQL + Drizzle ORM</Text>
            <Text style={{ color: '#666666' }}>• Zustand State Management</Text>
            <Text style={{ color: '#666666' }}>• NativeWind + shadcn/ui</Text>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Features</CardTitle>
            <CardDescription>Secure and scalable auth system</CardDescription>
          </CardHeader>
          <CardContent style={{ gap: 8 }}>
            <Text style={{ color: '#666666' }}>✅ Email/Password Authentication</Text>
            <Text style={{ color: '#666666' }}>✅ Google OAuth Integration</Text>
            <Text style={{ color: '#666666' }}>✅ Role-Based Access Control</Text>
            <Text style={{ color: '#666666' }}>✅ Session Management</Text>
            <Text style={{ color: '#666666' }}>✅ Cross-Platform Support</Text>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ready for Development</CardTitle>
            <CardDescription>Start building your app</CardDescription>
          </CardHeader>
          <CardContent>
            <Text style={{ color: '#666666', marginBottom: 12 }}>
              This starter provides a solid foundation for your next app. 
              Add your features, customize the design, and deploy!
            </Text>
            <Text style={{ color: '#666666', fontSize: 14, fontStyle: 'italic' }}>
              Check the README.md for setup instructions and best practices.
            </Text>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}