import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

// Wrapper component to provide theme and spacing
export function AuthErrorBoundary(props: Props) {
  const theme = useTheme();
  const { spacing } = useSpacing();
  
  return <AuthErrorBoundaryClass {...props} theme={theme} spacing={spacing} />;
}

interface InternalProps extends Props {
  theme: any;
  spacing: Record<string, number>;
}

class AuthErrorBoundaryClass extends Component<InternalProps, State> {
  constructor(props: InternalProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('Auth Error Boundary caught:', 'AUTH', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      errorInfo,
    });

    haptic('error');
  }

  handleReset = () => {
    haptic('light');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReturnToLogin = () => {
    haptic('light');
    this.handleReset();
    router.replace(ROUTES.auth.login);
  };

  handleClearSession = () => {
    haptic('light');
    this.handleReset();
    router.replace('/clear-session');
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const styles = getStyles(this.props.theme);
      
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Symbol name="lock.shield.fill" size={48} color={this.props.theme.destructive} />
            </View>
            
            <Text style={styles.title}>Authentication Error</Text>
            <Text style={styles.message}>
              We encountered an error with the authentication process. This might be due to an expired session or a configuration issue.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorDetailTitle}>Error Details:</Text>
                <Text style={styles.errorDetailText}>{this.state.error.message}</Text>
              </View>
            )}

            <View style={styles.actions}>
              <Pressable
                style={[styles.button, styles.primaryButton]}
                onPress={this.handleReturnToLogin}
              >
                <Text style={styles.primaryButtonText}>Return to Login</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={this.handleClearSession}
              >
                <Text style={styles.secondaryButtonText}>Clear Session & Retry</Text>
              </Pressable>

              <Pressable
                style={styles.linkButton}
                onPress={this.handleReset}
              >
                <Text style={styles.linkButtonText}>Try Again</Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.muted,
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
  },
  actions: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
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
});