import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Symbol } from '@/components/universal/display/Symbols';
import { logger } from '@/lib/core/debug/unified-logger';
import { ROUTES } from '@/lib/navigation/routes';
import { haptic } from '@/lib/ui/haptics';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  errorCount: number;
}

// Wrapper component to provide theme and spacing
export function HealthcareErrorBoundary(props: Props) {
  const theme = useTheme();
  const { spacing } = useSpacing();
  
  return <HealthcareErrorBoundaryClass {...props} theme={theme} spacing={spacing} />;
}

interface InternalProps extends Props {
  theme: any;
  spacing: Record<string, number>;
}

class HealthcareErrorBoundaryClass extends Component<InternalProps, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: InternalProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('Healthcare Error Boundary caught:', 'HEALTHCARE', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.retryCount,
    });

    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    haptic('error');
  }

  handleReset = () => {
    haptic('light');
    this.retryCount++;
    
    if (this.retryCount > this.maxRetries) {
      logger.warn('Healthcare error boundary: Max retries exceeded');
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReturnHome = () => {
    haptic('light');
    this.handleReset();
    router.replace(ROUTES.APP.HOME);
  };

  handleReportIssue = () => {
    haptic('light');
    // In a real app, this would open a support ticket or feedback form
    logger.info('User reported healthcare error', {
      error: this.state.error?.message,
      errorCount: this.state.errorCount,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isRecurringError = this.state.errorCount > 2;
      const isMaxRetriesExceeded = this.retryCount >= this.maxRetries;
      const styles = getStyles(this.props.theme);

      return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Symbol 
                name="cross.case.fill" 
                size={48} 
                color={this.props.theme.destructive} 
              />
            </View>
            
            <Text style={styles.title}>Healthcare Module Error</Text>
            <Text style={styles.message}>
              We encountered an error in the healthcare system. Your data is safe, but we need to restart this section.
            </Text>

            {isRecurringError && (
              <View style={styles.warningBox}>
                <Symbol name="exclamationmark.triangle.fill" size="sm" color="#F59E0B" />
                <Text style={styles.warningText}>
                  This error has occurred multiple times. Consider contacting support if it persists.
                </Text>
              </View>
            )}

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorDetailTitle}>Error Details:</Text>
                <Text style={styles.errorDetailText}>{this.state.error.message}</Text>
                <Text style={styles.errorDetailText}>Retry Count: {this.retryCount}/{this.maxRetries}</Text>
              </View>
            )}

            <View style={styles.actions}>
              {!isMaxRetriesExceeded && (
                <Pressable
                  style={[styles.button, styles.primaryButton]}
                  onPress={this.handleReset}
                >
                  <Symbol name="arrow.clockwise" size="sm" color="white" style={styles.buttonIcon} />
                  <Text style={styles.primaryButtonText}>Try Again</Text>
                </Pressable>
              )}

              <Pressable
                style={[
                  styles.button, 
                  isMaxRetriesExceeded ? styles.primaryButton : styles.secondaryButton
                ]}
                onPress={this.handleReturnHome}
              >
                <Symbol 
                  name="house" 
                  size="sm" 
                  color={isMaxRetriesExceeded ? 'white' : this.props.theme.foreground} 
                  style={styles.buttonIcon} 
                />
                <Text style={[
                  isMaxRetriesExceeded ? styles.primaryButtonText : styles.secondaryButtonText
                ]}>
                  Return to Home
                </Text>
              </Pressable>

              <Pressable
                style={styles.linkButton}
                onPress={this.handleReportIssue}
              >
                <Text style={styles.linkButtonText}>Report This Issue</Text>
              </Pressable>
            </View>

            {isMaxRetriesExceeded && (
              <Text style={styles.maxRetriesText}>
                Maximum retry attempts reached. Please return home and try again later.
              </Text>
            )}
          </View>
        </ScrollView>
      );
    }

    return this.props.children;
  }
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.muted,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.foreground,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: theme.mutedForeground,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7', // Amber 100
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: theme.foreground,
    lineHeight: 20,
  },
  errorDetails: {
    backgroundColor: theme.muted,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  errorDetailTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.foreground,
    marginBottom: 4,
  },
  errorDetailText: {
    fontSize: 12,
    color: theme.mutedForeground,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  actions: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButton: {
    backgroundColor: theme.primary,
  },
  primaryButtonText: {
    color: theme.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  secondaryButtonText: {
    color: theme.foreground,
    fontSize: 16,
    fontWeight: '500',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkButtonText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  maxRetriesText: {
    marginTop: 16,
    fontSize: 12,
    color: theme.mutedForeground,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});