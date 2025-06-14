import React from 'react';
import { View } from 'react-native';
import { Breadcrumb, BreadcrumbItem } from '@/components/universal';
import { useRouter } from 'expo-router';
import { Button } from '@/components/universal';

export default function TestBreadcrumbScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 p-8">
      <View className="mb-8">
        <Breadcrumb>
          <BreadcrumbItem href="/">Home</BreadcrumbItem>
          <BreadcrumbItem href="/settings">Settings</BreadcrumbItem>
          <BreadcrumbItem current>Profile</BreadcrumbItem>
        </Breadcrumb>
      </View>
      
      <Button 
        variant="outline" 
        onPress={() => router.back()}
        className="self-start"
      >
        Go Back
      </Button>
    </View>
  );
}