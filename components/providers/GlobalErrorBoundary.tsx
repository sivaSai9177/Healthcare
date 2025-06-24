import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { log } from '@/lib/core/debug/unified-logger';
import { useAuthStore } from '@/lib/stores/auth-store';
import { router } from 'expo-router';
import { Symbol } from '@/components/universal/display/Symbols';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  showDetails: boolean;
}

class GlobalErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private errorReportQueue: { error: Error; timestamp: Date }[] = [];
  
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    log.error('Global error boundary caught error', 'ERROR_BOUNDARY', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Add to error report queue
    this.errorReportQueue.push({
      error,
      timestamp: new Date()
    });

    // Store error in AsyncStorage for crash reporting
    this.persistError(error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Vibrate on mobile to indicate error
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  private async persistError(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        version: Platform.Version
      };

      await AsyncStorage.setItem(
        'last_app_crash',
        JSON.stringify(errorData)
      );
    } catch (e) {
      console.error('Failed to persist error:', e);
    }
  }

  private handleResetError = async () => {
    // Clear error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });

    // Clear persisted error
    await AsyncStorage.removeItem('last_app_crash');

    // Optionally navigate to home
    if (this.state.errorCount > 2) {
      router.replace('/');
    }
  };

  private handleSignOut = async () => {
    try {
      // Clear auth state
      const signOut = useAuthStore.getState().signOut;
      await signOut();
      
      // Clear all storage
      await AsyncStorage.clear();
      
      // Navigate to login
      router.replace('/login');
    } catch (e) {
      console.error('Error during sign out:', e);
      // Force reload as last resort
      if (Platform.OS === 'web') {
        window.location.href = '/login';
      }
    }
  };

  private handleReload = () => {
    if (Platform.OS === 'web') {
      window.location.reload();
    } else {
      // On native, we need to restart the app
      // This is typically handled by the native crash reporter
      this.handleResetError();
    }
  };

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state;

      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <SafeAreaView className="flex-1 bg-red-50">
          <ScrollView 
            className="flex-1" 
            contentContainerClassName="p-6"
            showsVerticalScrollIndicator={false}
          >
            <View className="items-center mb-6">
              <Symbol name="error" size={64} color="#EF4444" />
            </View>

            <Text className="text-2xl font-bold text-red-800 text-center mb-2">
              Oops! Something went wrong
            </Text>

            <Text className="text-base text-red-600 text-center mb-6">
              {error?.message || 'An unexpected error occurred'}
            </Text>

            <View className="bg-white rounded-lg p-4 mb-6 shadow-sm">
              <Text className="text-sm text-gray-600 mb-3">
                We apologize for the inconvenience. The error has been logged and our team will investigate.
              </Text>

              <Text className="text-sm text-gray-500">
                Error ID: {Date.now().toString(36).toUpperCase()}
              </Text>
            </View>

            {/* Error Details Toggle */}
            <TouchableOpacity
              onPress={this.toggleDetails}
              className="flex-row items-center justify-center mb-4"
            >
              <Text className="text-blue-600 text-sm mr-1">
                {showDetails ? 'Hide' : 'Show'} technical details
              </Text>
              <Symbol 
                name={showDetails ? 'expand_less' : 'expand_more'} 
                size={20} 
                color="#2563EB" 
              />
            </TouchableOpacity>

            {/* Technical Details */}
            {showDetails && (
              <View className="bg-gray-100 rounded-lg p-4 mb-6">
                <Text className="font-mono text-xs text-gray-700 mb-2">
                  {error?.stack || 'No stack trace available'}
                </Text>
                {errorInfo?.componentStack && (
                  <Text className="font-mono text-xs text-gray-600 mt-2">
                    Component Stack:{'\n'}
                    {errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View className="space-y-3">
              <TouchableOpacity
                onPress={this.handleResetError}
                className="bg-blue-600 rounded-lg py-3 px-4 items-center"
              >
                <Text className="text-white font-semibold">
                  Try Again
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={this.handleReload}
                className="bg-gray-200 rounded-lg py-3 px-4 items-center"
              >
                <Text className="text-gray-700 font-medium">
                  Reload App
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={this.handleSignOut}
                className="border border-red-300 rounded-lg py-3 px-4 items-center"
              >
                <Text className="text-red-600 font-medium">
                  Sign Out & Reset
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error count warning */}
            {this.state.errorCount > 1 && (
              <View className="mt-6 bg-yellow-100 rounded-lg p-3">
                <Text className="text-sm text-yellow-800 text-center">
                  This error has occurred {this.state.errorCount} times. 
                  Consider signing out and signing back in.
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

// Healthcare-specific error boundary
export class HealthcareErrorBoundary extends GlobalErrorBoundary {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    super.componentDidCatch(error, errorInfo);

    // Additional healthcare-specific error handling
    if (error.message.includes('alert') || error.message.includes('patient')) {
      log.error('Healthcare module error', 'HEALTHCARE_ERROR', {
        error: error.message,
        module: 'healthcare',
        critical: true
      });

      // TODO: Send critical healthcare errors to monitoring service immediately
    }
  }

  render() {
    if (this.state.hasError) {
      const isHealthcareError = this.state.error?.message.includes('alert') || 
                               this.state.error?.message.includes('patient');

      if (isHealthcareError) {
        return (
          <SafeAreaView className="flex-1 bg-red-50">
            <View className="flex-1 items-center justify-center p-6">
              <Symbol name="emergency" size={64} color="#EF4444" />
              <Text className="text-xl font-bold text-red-800 text-center mt-4 mb-2">
                Healthcare System Error
              </Text>
              <Text className="text-base text-red-600 text-center mb-6">
                A critical error occurred in the healthcare module
              </Text>
              <TouchableOpacity
                onPress={() => router.replace('/home')}
                className="bg-red-600 rounded-lg py-3 px-6"
              >
                <Text className="text-white font-semibold">
                  Return to Dashboard
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        );
      }
    }

    return super.render();
  }
}

// Network error boundary for API failures
export class NetworkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> | null {
    // Only catch network errors
    if (error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('TRPC')) {
      return { hasError: true, error };
    }
    return null;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('TRPC')) {
      log.warn('Network error caught', 'NETWORK_ERROR', {
        error: error.message,
        url: (error as any).url
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center p-6 bg-gray-50">
          <Symbol name="wifi_off" size={48} color="#6B7280" />
          <Text className="text-lg font-semibold text-gray-800 mt-4 mb-2">
            Connection Problem
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Unable to connect to the server. Please check your internet connection.
          </Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false })}
            className="bg-blue-600 rounded-lg py-2 px-4"
          >
            <Text className="text-white font-medium">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;