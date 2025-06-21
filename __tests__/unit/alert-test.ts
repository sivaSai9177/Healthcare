import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Alert, Platform } from 'react-native';
import { showAlert, showSuccessAlert, showErrorAlert } from '../../lib/core/alert';

// Mock React Native Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
}));

describe('Alert Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('showAlert', () => {
    it('should show basic alert with title and message', () => {
      showAlert('Test Title', 'Test Message');

      expect(Alert.alert).toHaveBeenCalledWith(
        'Test Title',
        'Test Message',
        [{ text: 'OK', style: 'default' }],
        { cancelable: true }
      );
    });

    it('should show alert with custom buttons', () => {
      const buttons = [
        { text: 'Cancel', style: 'cancel' as const },
        { text: 'Confirm', style: 'default' as const, onPress: jest.fn() },
      ];

      showAlert('Confirm Action', 'Are you sure?', buttons);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Confirm Action',
        'Are you sure?',
        buttons,
        { cancelable: true }
      );
    });

    it('should show alert with options', () => {
      const options = { cancelable: false };

      showAlert('Important', 'Cannot be dismissed', [], options);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Important',
        'Cannot be dismissed',
        [{ text: 'OK', style: 'default' }],
        { cancelable: false }
      );
    });

    it('should handle button callbacks', () => {
      const onPress = jest.fn();
      const buttons = [{ text: 'OK', onPress }];

      showAlert('Test', 'Message', buttons);

      // Get the buttons passed to Alert.alert
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const passedButtons = alertCall[2];

      // Simulate button press
      passedButtons[0].onPress();

      expect(onPress).toHaveBeenCalled();
    });

    it('should handle null/undefined message gracefully', () => {
      showAlert('Title Only');

      expect(Alert.alert).toHaveBeenCalledWith(
        'Title Only',
        undefined,
        [{ text: 'OK', style: 'default' }],
        { cancelable: true }
      );
    });
  });

  describe('showSuccessAlert', () => {
    it('should show success alert with default title', () => {
      showSuccessAlert('Operation completed successfully');

      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Operation completed successfully',
        [{ text: 'OK', style: 'default' }],
        { cancelable: true }
      );
    });

    it('should show success alert with custom title', () => {
      showSuccessAlert('Data saved', 'Save Complete');

      expect(Alert.alert).toHaveBeenCalledWith(
        'Save Complete',
        'Data saved',
        [{ text: 'OK', style: 'default' }],
        { cancelable: true }
      );
    });

    it('should handle success alert with callback', () => {
      const onDismiss = jest.fn();
      
      showSuccessAlert('Success!', 'Great', onDismiss);

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const passedButtons = alertCall[2];

      // Simulate OK button press
      passedButtons[0].onPress();

      expect(onDismiss).toHaveBeenCalled();
    });
  });

  describe('showErrorAlert', () => {
    it('should show error alert with default title', () => {
      showErrorAlert('Something went wrong');

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Something went wrong',
        [{ text: 'OK', style: 'default' }],
        { cancelable: true }
      );
    });

    it('should show error alert with custom title', () => {
      showErrorAlert('Network connection failed', 'Connection Error');

      expect(Alert.alert).toHaveBeenCalledWith(
        'Connection Error',
        'Network connection failed',
        [{ text: 'OK', style: 'default' }],
        { cancelable: true }
      );
    });

    it('should handle error alert with callback', () => {
      const onDismiss = jest.fn();
      
      showErrorAlert('Error occurred', 'Oops', onDismiss);

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const passedButtons = alertCall[2];

      // Simulate OK button press
      passedButtons[0].onPress();

      expect(onDismiss).toHaveBeenCalled();
    });

    it('should format error objects as messages', () => {
      const error = new Error('Test error message');
      
      showErrorAlert(error.message);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Test error message',
        [{ text: 'OK', style: 'default' }],
        { cancelable: true }
      );
    });
  });

  describe('Platform Behavior', () => {
    it('should work on iOS', () => {
      (Platform.OS as any) = 'ios';
      
      showAlert('iOS Alert', 'iOS Message');

      expect(Alert.alert).toHaveBeenCalled();
    });

    it('should work on Android', () => {
      (Platform.OS as any) = 'android';
      
      showAlert('Android Alert', 'Android Message');

      expect(Alert.alert).toHaveBeenCalled();
    });

    it('should handle web platform gracefully', () => {
      (Platform.OS as any) = 'web';
      
      // On web, Alert.alert might not be available
      // The implementation should handle this gracefully
      showAlert('Web Alert', 'Web Message');

      // Should not throw error
      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  describe('Alert Composition', () => {
    it('should handle confirmation dialogs', () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      showAlert(
        'Delete Item',
        'Are you sure you want to delete this item?',
        [
          { text: 'Cancel', style: 'cancel', onPress: onCancel },
          { text: 'Delete', style: 'destructive', onPress: onConfirm },
        ]
      );

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];

      expect(buttons).toHaveLength(2);
      expect(buttons[0].text).toBe('Cancel');
      expect(buttons[0].style).toBe('cancel');
      expect(buttons[1].text).toBe('Delete');
      expect(buttons[1].style).toBe('destructive');
    });

    it('should handle input alerts with text input', () => {
      // Note: React Native Alert doesn't support text input directly
      // This test verifies the alert is shown with appropriate message
      showAlert(
        'Enter Name',
        'Please enter your name:',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OK', onPress: (value) => {} },
        ]
      );

      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle alert when Alert.alert is not available', () => {
      // Temporarily remove Alert.alert
      const originalAlert = Alert.alert;
      (Alert.alert as any) = undefined;

      // Should not throw
      expect(() => showAlert('Test', 'Message')).not.toThrow();

      // Restore
      Alert.alert = originalAlert;
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      
      showAlert('Long Message', longMessage);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Long Message',
        longMessage,
        expect.any(Array),
        expect.any(Object)
      );
    });

    it('should handle special characters in messages', () => {
      const specialMessage = 'Line 1\nLine 2\tTabbed\r\nSpecial: @#$%^&*()';
      
      showAlert('Special', specialMessage);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Special',
        specialMessage,
        expect.any(Array),
        expect.any(Object)
      );
    });
  });

  describe('Alert Chaining', () => {
    it('should handle sequential alerts', () => {
      showSuccessAlert('First success');
      showErrorAlert('Then error');
      showAlert('Finally', 'Regular alert');

      expect(Alert.alert).toHaveBeenCalledTimes(3);
    });

    it('should handle nested alert callbacks', () => {
      const showSecondAlert = jest.fn(() => {
        showAlert('Second', 'Nested alert');
      });

      showAlert('First', 'Initial alert', [
        { text: 'Next', onPress: showSecondAlert },
      ]);

      const firstAlertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
      firstAlertButtons[0].onPress();

      expect(showSecondAlert).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledTimes(2);
    });
  });
});