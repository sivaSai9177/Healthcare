import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter, usePathname, useSegments } from 'expo-router';
import { Button, Text, View } from 'react-native';

// Component that uses Expo Router
function NavigationTestComponent() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();

  return (
    <View>
      <Text testID="pathname">Current path: {pathname}</Text>
      <Text testID="segments">Segments: {segments.join('/')}</Text>
      <Button
        testID="navigate-button"
        title="Navigate to Healthcare"
        onPress={() => router.push('/healthcare/dashboard')}
      />
      <Button
        testID="back-button"
        title="Go Back"
        onPress={() => router.back()}
      />
    </View>
  );
}

describe('Navigation with Expo Router', () => {
  beforeEach(() => {
    // Reset router mocks before each test
    const expoRouter = require('expo-router');
    expoRouter.__resetMocks();
  });

  it('should display current pathname', () => {
    const { getByTestId } = render(<NavigationTestComponent />);
    
    expect(getByTestId('pathname')).toHaveTextContent('Current path: /');
  });

  it('should navigate to a new route', () => {
    const { getByTestId } = render(<NavigationTestComponent />);
    const router = require('expo-router').router;
    
    const navigateButton = getByTestId('navigate-button');
    fireEvent.press(navigateButton);
    
    expect(router.push).toHaveBeenCalledWith('/healthcare/dashboard');
  });

  it('should go back when back button is pressed', () => {
    const { getByTestId } = render(<NavigationTestComponent />);
    const router = require('expo-router').router;
    
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);
    
    expect(router.back).toHaveBeenCalled();
  });

  it('should show updated pathname after navigation', () => {
    const expoRouter = require('expo-router');
    
    // Set mock pathname
    expoRouter.__setMockPathname('/healthcare/dashboard');
    
    const { getByTestId } = render(<NavigationTestComponent />);
    
    expect(getByTestId('pathname')).toHaveTextContent('Current path: /healthcare/dashboard');
    expect(getByTestId('segments')).toHaveTextContent('Segments: healthcare/dashboard');
  });
});

// Test custom matchers for Expo Router
describe('Expo Router custom matchers', () => {
  it('should support pathname assertions', () => {
    const expoRouter = require('expo-router');
    expoRouter.__setMockPathname('/healthcare/alerts');
    
    const pathname = expoRouter.usePathname();
    expect(pathname).toBe('/healthcare/alerts');
  });

  it('should support segment assertions', () => {
    const expoRouter = require('expo-router');
    expoRouter.__setMockPathname('/healthcare/alerts/123');
    
    const segments = expoRouter.useSegments();
    expect(segments).toEqual(['healthcare', 'alerts', '123']);
  });

  it('should support params assertions', () => {
    const expoRouter = require('expo-router');
    expoRouter.__setMockParams({ id: '123', type: 'critical' });
    
    const params = expoRouter.useLocalSearchParams();
    expect(params).toEqual({ id: '123', type: 'critical' });
  });
});