// components/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { createLogger, exportLogs } from '@/lib/core/debug';
import { showErrorAlert } from '@/lib/core/alert';
import { useThemeStore } from '@/lib/stores/theme-store';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

const logger = createLogger('ErrorBoundary');

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    logger.error('Error caught by boundary', error);
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Error details', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    this.setState({
      errorInfo,
    });

    // In production, report to error tracking service
    if (!__DEV__) {
      this.reportError(error, errorInfo);
    }
  }

  reportError(error: Error, errorInfo: React.ErrorInfo) {
    // TODO: Send to crash reporting service
    logger.error('Production error:', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  resetError = () => {
    logger.info('Resetting error boundary');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  exportDebugInfo = () => {
    const logs = exportLogs();
    const errorDetails = `
Error: ${this.state.error?.toString()}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}

Logs:
${logs}
`;

    if (Platform.OS === 'web') {
      // Create a blob and download
      const blob = new Blob([errorDetails], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-debug-${Date.now()}.txt`;
      a.click();
    } else {
      // On mobile, show alert with option to copy
      showErrorAlert('Debug Info', 'Debug information has been logged to console');
      logger.debug('Error details exported', errorDetails);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.resetError);
      }

      return <DefaultErrorUI error={this.state.error!} resetError={this.resetError} onExportDebug={this.exportDebugInfo} />;
    }

    return this.props.children;
  }
}

// Hook for functional components to trigger error boundary
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  if (error) {
    throw error;
  }

  return (error: Error) => {
    setError(error);
  };
}

// Default error UI component
function DefaultErrorUI({ error, resetError, onExportDebug }: { error: Error; resetError: () => void; onExportDebug?: () => void }) {
  // Get theme directly from store to avoid hook rules violation
  const theme = useThemeStore.getState().theme || {
    // Fallback to default theme colors
    background: '#ffffff',
    foreground: '#000000',
    muted: '#f4f4f5',
    mutedForeground: '#71717a',
    primary: '#0ea5e9',
    primaryForeground: '#ffffff',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
  }
  
  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: theme.background,
            borderRadius: 12,
            padding: 24,
            maxWidth: 500,
            width: '100%',
            boxShadow: `0px 2px 4px ${theme.mutedForeground}1A`,
            elevation: 3,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: theme.destructive,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            Oops! Something went wrong
          </Text>

          <Text
            style={{
              fontSize: 16,
              color: theme.mutedForeground,
              marginBottom: 24,
              textAlign: 'center',
            }}
          >
            We apologize for the inconvenience. The app encountered an unexpected error.
          </Text>

          {__DEV__ && (
            <View
              style={{
                backgroundColor: theme.destructive + '20',
                borderRadius: 8,
                padding: 16,
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: theme.destructive,
                  marginBottom: 8,
                }}
              >
                Error Details (Development Only):
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: theme.destructive,
                  fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
                }}
              >
                {error?.toString()}
              </Text>
            </View>
          )}

          <View style={{ gap: 12 }}>
            <Pressable
              onPress={resetError}
              style={{
                backgroundColor: theme.primary,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: theme.primaryForeground, fontSize: 16, fontWeight: '600' }}>
                Try Again
              </Text>
            </Pressable>

            {__DEV__ && onExportDebug && (
              <Pressable
                onPress={onExportDebug}
                style={{
                  backgroundColor: theme.muted,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: theme.mutedForeground, fontSize: 16, fontWeight: '600' }}>
                  Export Debug Info
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}