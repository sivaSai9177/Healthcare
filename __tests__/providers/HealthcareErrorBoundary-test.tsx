/**
 * Tests for Healthcare-specific Error Boundary
 * Ensures healthcare features handle errors gracefully
 */

import React from 'react';
import { Text } from 'react-native';
import { renderWithProviders, fireEvent, waitFor } from '../utils/test-utils';
import { HealthcareErrorBoundary } from '@/components/providers/HealthcareErrorBoundary';
import { createMockAlert, createMockWebSocketMessage } from '../mocks/factories';

// Mock WebSocket error
class WebSocketError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebSocketError';
  }
}

// Component that simulates healthcare-specific errors
const HealthcareComponent = ({ errorType }: { errorType?: string }) => {
  React.useEffect(() => {
    switch (errorType) {
      case 'websocket':
        throw new WebSocketError('WebSocket connection failed');
      case 'api':
        throw new Error('API request failed: 401 Unauthorized');
      case 'permission':
        throw new Error('Insufficient permissions to view alerts');
      case 'data':
        throw new Error('Invalid alert data format');
      default:
        break;
    }
  }, [errorType]);

  return <Text>Healthcare Component</Text>;
};

describe('HealthcareErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when no error occurs', () => {
    const { getByText } = renderWithProviders(
      <HealthcareErrorBoundary>
        <HealthcareComponent />
      </HealthcareErrorBoundary>
    );

    expect(getByText('Healthcare Component')).toBeTruthy();
  });

  it('should handle WebSocket connection errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText, queryByText } = renderWithProviders(
      <HealthcareErrorBoundary>
        <HealthcareComponent errorType="websocket" />
      </HealthcareErrorBoundary>
    );

    await waitFor(() => {
      // Should show connection error message
      expect(getByText(/Connection Error/i)).toBeTruthy();
      expect(getByText(/real-time updates/i)).toBeTruthy();
    });

    // Should offer reconnection option
    expect(getByText(/Reconnect/i)).toBeTruthy();

    consoleSpy.mockRestore();
  });

  it('should handle API authentication errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText } = renderWithProviders(
      <HealthcareErrorBoundary>
        <HealthcareComponent errorType="api" />
      </HealthcareErrorBoundary>
    );

    await waitFor(() => {
      // Should show auth error
      expect(getByText(/Authentication Error/i)).toBeTruthy();
      expect(getByText(/Please log in again/i)).toBeTruthy();
    });

    // Should offer login option
    expect(getByText(/Go to Login/i)).toBeTruthy();

    consoleSpy.mockRestore();
  });

  it('should handle permission errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText } = renderWithProviders(
      <HealthcareErrorBoundary>
        <HealthcareComponent errorType="permission" />
      </HealthcareErrorBoundary>
    );

    await waitFor(() => {
      // Should show permission error
      expect(getByText(/Access Denied/i)).toBeTruthy();
      expect(getByText(/don't have permission/i)).toBeTruthy();
    });

    consoleSpy.mockRestore();
  });

  it('should handle data validation errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText } = renderWithProviders(
      <HealthcareErrorBoundary>
        <HealthcareComponent errorType="data" />
      </HealthcareErrorBoundary>
    );

    await waitFor(() => {
      // Should show data error
      expect(getByText(/Data Error/i)).toBeTruthy();
      expect(getByText(/Invalid.*data/i)).toBeTruthy();
    });

    consoleSpy.mockRestore();
  });

  it('should attempt automatic reconnection for WebSocket errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let attemptCount = 0;

    const ReconnectingComponent = () => {
      React.useEffect(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new WebSocketError('Connection failed');
        }
      }, []);

      return <Text>Connected!</Text>;
    };

    const { getByText, rerender } = renderWithProviders(
      <HealthcareErrorBoundary>
        <ReconnectingComponent />
      </HealthcareErrorBoundary>
    );

    // Should show error initially
    await waitFor(() => {
      expect(getByText(/Connection Error/i)).toBeTruthy();
    });

    // Click reconnect
    fireEvent.press(getByText(/Reconnect/i));

    // Should retry and eventually succeed
    await waitFor(() => {
      expect(attemptCount).toBeGreaterThan(1);
    });

    consoleSpy.mockRestore();
  });

  it('should maintain alert data during error recovery', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockAlerts = [createMockAlert(), createMockAlert()];
    let shouldError = true;

    const AlertComponent = () => {
      if (shouldError) {
        throw new Error('Temporary error');
      }
      return (
        <>
          {mockAlerts.map(alert => (
            <Text key={alert.id}>{alert.roomNumber}</Text>
          ))}
        </>
      );
    };

    const { getByText, queryByText } = renderWithProviders(
      <HealthcareErrorBoundary>
        <AlertComponent />
      </HealthcareErrorBoundary>
    );

    // Error state
    await waitFor(() => {
      expect(getByText(/Something went wrong/i)).toBeTruthy();
    });

    // Fix error and retry
    shouldError = false;
    fireEvent.press(getByText(/Try Again/i));

    // Should restore and show alerts
    await waitFor(() => {
      expect(getByText(mockAlerts[0].roomNumber)).toBeTruthy();
      expect(getByText(mockAlerts[1].roomNumber)).toBeTruthy();
    });

    consoleSpy.mockRestore();
  });

  it('should log healthcare errors for monitoring', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const logSpy = jest.fn();

    // Mock error logging service
    jest.mock('@/lib/core/debug/unified-logger', () => ({
      unifiedLogger: {
        error: logSpy,
      },
    }));

    renderWithProviders(
      <HealthcareErrorBoundary>
        <HealthcareComponent errorType="api" />
      </HealthcareErrorBoundary>
    );

    await waitFor(() => {
      // Should log error details
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Healthcare Error'),
        expect.objectContaining({
          error: expect.any(Error),
          context: 'HealthcareErrorBoundary',
        })
      );
    });

    consoleSpy.mockRestore();
  });

  it('should show fallback UI for critical healthcare errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const CriticalError = () => {
      throw new Error('CRITICAL: Database connection lost');
    };

    const { getByText } = renderWithProviders(
      <HealthcareErrorBoundary>
        <CriticalError />
      </HealthcareErrorBoundary>
    );

    await waitFor(() => {
      // Should show critical error UI
      expect(getByText(/Critical Error/i)).toBeTruthy();
      expect(getByText(/Database connection/i)).toBeTruthy();
      
      // Should show contact support option
      expect(getByText(/Contact Support/i)).toBeTruthy();
    });

    consoleSpy.mockRestore();
  });

  it('should handle concurrent errors without crashing', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const MultiErrorComponent = () => {
      React.useEffect(() => {
        // Simulate multiple simultaneous errors
        setTimeout(() => {
          throw new WebSocketError('WebSocket error 1');
        }, 10);
        
        setTimeout(() => {
          throw new Error('API error');
        }, 20);
        
        setTimeout(() => {
          throw new WebSocketError('WebSocket error 2');
        }, 30);
      }, []);

      return <Text>Multiple errors incoming...</Text>;
    };

    const { getByText } = renderWithProviders(
      <HealthcareErrorBoundary>
        <MultiErrorComponent />
      </HealthcareErrorBoundary>
    );

    // Should handle first error gracefully
    await waitFor(() => {
      expect(getByText(/Error/i)).toBeTruthy();
    });

    // App should not crash despite multiple errors
    expect(getByText(/Try Again|Reconnect/i)).toBeTruthy();

    consoleSpy.mockRestore();
  });
});