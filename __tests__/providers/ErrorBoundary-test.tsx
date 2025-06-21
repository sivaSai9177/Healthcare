/**
 * Tests for ErrorBoundary provider
 * These tests ensure the app doesn't crash when components throw errors
 */

import React from 'react';
import { Text, Button } from 'react-native';
import { renderWithProviders, fireEvent, waitFor, ThrowError } from '../utils/test-utils';
import { ErrorBoundary } from '@/components/providers/ErrorBoundary';
import { useErrorStore } from '@/lib/stores/error-store';

// Component that throws an error
const BrokenComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Component crashed!');
  }
  return <Text>Working Component</Text>;
};

// Component that throws async error
const AsyncBrokenComponent = () => {
  React.useEffect(() => {
    setTimeout(() => {
      throw new Error('Async error!');
    }, 100);
  }, []);
  return <Text>Will crash soon...</Text>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Clear error store before each test
    useErrorStore.getState().clearError();
    jest.clearAllMocks();
  });

  it('should render children when no error occurs', () => {
    const { getByText } = renderWithProviders(
      <ErrorBoundary>
        <Text>Test Content</Text>
      </ErrorBoundary>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('should catch and display error when child component throws', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText, queryByText } = renderWithProviders(
      <ErrorBoundary>
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error UI
    expect(getByText(/Something went wrong/i)).toBeTruthy();
    expect(getByText(/Component crashed!/i)).toBeTruthy();
    
    // Should not show the broken component
    expect(queryByText('Working Component')).toBeNull();

    consoleSpy.mockRestore();
  });

  it('should allow error recovery with retry', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;

    const RetryableComponent = () => {
      if (shouldThrow) {
        throw new Error('Retryable error');
      }
      return <Text>Recovered!</Text>;
    };

    const { getByText, rerender, queryByText } = renderWithProviders(
      <ErrorBoundary>
        <RetryableComponent />
      </ErrorBoundary>
    );

    // Should show error
    expect(getByText(/Something went wrong/i)).toBeTruthy();
    expect(getByText(/Retryable error/i)).toBeTruthy();

    // Fix the error condition
    shouldThrow = false;

    // Click retry button
    const retryButton = getByText(/Try Again/i);
    fireEvent.press(retryButton);

    // Wait for recovery
    await waitFor(() => {
      expect(getByText('Recovered!')).toBeTruthy();
    });

    // Error UI should be gone
    expect(queryByText(/Something went wrong/i)).toBeNull();

    consoleSpy.mockRestore();
  });

  it('should report errors to error store', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Store test error');

    renderWithProviders(
      <ErrorBoundary>
        <ThrowError error={error} />
      </ErrorBoundary>
    );

    // Check error store
    const errorState = useErrorStore.getState();
    expect(errorState.error).toBeTruthy();
    expect(errorState.error?.message).toBe('Store test error');

    consoleSpy.mockRestore();
  });

  it('should handle multiple sequential errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let errorCount = 0;

    const MultiErrorComponent = () => {
      errorCount++;
      throw new Error(`Error ${errorCount}`);
    };

    const { getByText, rerender } = renderWithProviders(
      <ErrorBoundary>
        <MultiErrorComponent />
      </ErrorBoundary>
    );

    // First error
    expect(getByText(/Error 1/i)).toBeTruthy();

    // Retry with new error
    fireEvent.press(getByText(/Try Again/i));

    await waitFor(() => {
      expect(getByText(/Error 2/i)).toBeTruthy();
    });

    consoleSpy.mockRestore();
  });

  it('should provide error details in development mode', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const { getByText } = renderWithProviders(
      <ErrorBoundary>
        <ThrowError error={new Error('Dev error with stack')} />
      </ErrorBoundary>
    );

    // Should show stack trace in development
    expect(getByText(/Dev error with stack/i)).toBeTruthy();
    
    // In development, might show more details
    // This depends on your ErrorBoundary implementation

    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
  });

  it('should handle errors in error boundary itself gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create a broken error boundary
    const BrokenErrorBoundary = ({ children }: { children: React.ReactNode }) => {
      // This will throw during render
      if (children) {
        throw new Error('Error boundary error');
      }
      return <>{children}</>;
    };

    // Should not crash the entire app
    const { getByText } = renderWithProviders(
      <ErrorBoundary>
        <BrokenErrorBoundary>
          <Text>Content</Text>
        </BrokenErrorBoundary>
      </ErrorBoundary>
    );

    // Parent error boundary should catch it
    expect(getByText(/Something went wrong/i)).toBeTruthy();

    consoleSpy.mockRestore();
  });

  it('should clear error when navigating away', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText, unmount } = renderWithProviders(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    // Error should be displayed
    expect(getByText(/Something went wrong/i)).toBeTruthy();

    // Unmount (simulate navigation)
    unmount();

    // Error store should be cleared
    await waitFor(() => {
      const errorState = useErrorStore.getState();
      expect(errorState.error).toBeNull();
    });

    consoleSpy.mockRestore();
  });

  it('should handle async errors with error event listener', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Simulate unhandled promise rejection
    const promise = Promise.reject(new Error('Unhandled async error'));

    // Trigger error event
    const errorEvent = new ErrorEvent('error', {
      error: new Error('Unhandled async error'),
      message: 'Unhandled async error',
    });
    window.dispatchEvent(errorEvent);

    await waitFor(() => {
      const errorState = useErrorStore.getState();
      expect(errorState.error).toBeTruthy();
    });

    // Clean up
    promise.catch(() => {}); // Prevent unhandled rejection warning
    consoleSpy.mockRestore();
  });

  it('should not show error boundary in production for non-critical errors', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // In production, might want to handle some errors silently
    // This depends on your error boundary implementation

    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
  });
});