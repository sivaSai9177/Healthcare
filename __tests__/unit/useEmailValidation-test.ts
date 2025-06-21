import { renderHook, act } from '@testing-library/react-hooks';
import { useEmailValidation } from '@/hooks/useEmailValidation';
import { logger } from '@/lib/core/debug/logger';

// Mock dependencies
jest.mock('@/lib/core/debug/logger', () => ({
  logger: {
    auth: {
      error: jest.fn(),
    },
  },
}));

jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string, delay: number) => {
    // Simple mock that returns the value after a delay
    const [debouncedValue, setDebouncedValue] = jest.requireActual('react').useState(value);
    
    jest.requireActual('react').useEffect(() => {
      const timer = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(timer);
    }, [value, delay]);
    
    return debouncedValue;
  },
}));

describe('useEmailValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Email format validation', () => {
    it('should validate correct email format', () => {
      const { result } = renderHook(() => 
        useEmailValidation('test@example.com')
      );

      expect(result.current.isValidEmail).toBe(true);
    });

    it('should invalidate incorrect email formats', () => {
      const testCases = [
        '',
        'a',
        'ab', // Less than 3 characters
        'notanemail',
        'missing@',
        '@nodomain.com',
        'spaces in@email.com',
        'double@@domain.com',
        'trailing.dot.@domain.com',
        '.leadingdot@domain.com',
      ];

      testCases.forEach(email => {
        const { result } = renderHook(() => useEmailValidation(email));
        expect(result.current.isValidEmail).toBe(false);
      });
    });

    it('should validate various valid email formats', () => {
      const validEmails = [
        'simple@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
        '123@example.com',
        'a@b.c',
      ];

      validEmails.forEach(email => {
        const { result } = renderHook(() => useEmailValidation(email));
        expect(result.current.isValidEmail).toBe(true);
      });
    });
  });

  describe('Email existence checking', () => {
    it('should check email existence when valid email is provided', async () => {
      const onCheckEmail = jest.fn().mockResolvedValue({ exists: true });
      
      const { result } = renderHook(() => 
        useEmailValidation('test@example.com', { onCheckEmail })
      );

      // Wait for debounce
      await act(async () => {
        jest.advanceTimersByTime(500);
        await Promise.resolve();
      });

      expect(onCheckEmail).toHaveBeenCalledWith('test@example.com');
      expect(result.current.emailExists).toBe(true);
      expect(result.current.isCheckingEmail).toBe(false);
    });

    it('should not check email existence for invalid emails', async () => {
      const onCheckEmail = jest.fn();
      
      renderHook(() => 
        useEmailValidation('invalidemail', { onCheckEmail })
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
        await Promise.resolve();
      });

      expect(onCheckEmail).not.toHaveBeenCalled();
    });

    it('should handle email check errors', async () => {
      const error = new Error('Network error');
      const onCheckEmail = jest.fn().mockRejectedValue(error);
      
      const { result } = renderHook(() => 
        useEmailValidation('test@example.com', { onCheckEmail })
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
        await Promise.resolve();
      });

      expect(logger.auth.error).toHaveBeenCalledWith('Email check failed', error);
      expect(result.current.emailExists).toBe(null);
      expect(result.current.isCheckingEmail).toBe(false);
    });

    it('should prevent duplicate requests for the same email', async () => {
      const onCheckEmail = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ exists: true }), 100))
      );
      
      const { rerender } = renderHook(
        ({ email }) => useEmailValidation(email, { onCheckEmail }),
        { initialProps: { email: 'test@example.com' } }
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Trigger multiple rerenders with same email
      rerender({ email: 'test@example.com' });
      rerender({ email: 'test@example.com' });

      await act(async () => {
        jest.advanceTimersByTime(600);
        await Promise.resolve();
      });

      // Should only call once
      expect(onCheckEmail).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid email changes correctly', async () => {
      const onCheckEmail = jest.fn()
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({ exists: false });
      
      const { result, rerender } = renderHook(
        ({ email }) => useEmailValidation(email, { onCheckEmail, debounceDelay: 200 }),
        { initialProps: { email: 'first@example.com' } }
      );

      // Change email before first check completes
      rerender({ email: 'second@example.com' });

      await act(async () => {
        jest.advanceTimersByTime(200);
        await Promise.resolve();
      });

      // Should only check the second email
      expect(onCheckEmail).toHaveBeenCalledTimes(1);
      expect(onCheckEmail).toHaveBeenCalledWith('second@example.com');
    });
  });

  describe('Debouncing behavior', () => {
    it('should use custom debounce delay', async () => {
      const onCheckEmail = jest.fn().mockResolvedValue({ exists: true });
      
      const { result } = renderHook(() => 
        useEmailValidation('test@example.com', { 
          onCheckEmail, 
          debounceDelay: 1000 
        })
      );

      // Should not check immediately
      expect(onCheckEmail).not.toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(999);
      });

      // Still shouldn't check
      expect(onCheckEmail).not.toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(1);
        await Promise.resolve();
      });

      // Now it should check
      expect(onCheckEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return debounced email value', () => {
      const { result, rerender } = renderHook(
        ({ email }) => useEmailValidation(email),
        { initialProps: { email: 'initial@example.com' } }
      );

      expect(result.current.debouncedEmail).toBe('initial@example.com');

      rerender({ email: 'updated@example.com' });

      // Immediately after change, debounced value should be old
      expect(result.current.debouncedEmail).toBe('initial@example.com');
    });
  });

  describe('Loading states', () => {
    it('should set isCheckingEmail during check', async () => {
      let resolveCheck: (value: any) => void;
      const checkPromise = new Promise(resolve => { resolveCheck = resolve; });
      const onCheckEmail = jest.fn().mockReturnValue(checkPromise);
      
      const { result } = renderHook(() => 
        useEmailValidation('test@example.com', { onCheckEmail })
      );

      expect(result.current.isCheckingEmail).toBe(false);

      await act(async () => {
        jest.advanceTimersByTime(500);
        await Promise.resolve();
      });

      expect(result.current.isCheckingEmail).toBe(true);

      await act(async () => {
        resolveCheck!({ exists: true });
        await Promise.resolve();
      });

      expect(result.current.isCheckingEmail).toBe(false);
    });
  });

  describe('Minimum length handling', () => {
    it('should respect custom minimum length', async () => {
      const onCheckEmail = jest.fn().mockResolvedValue({ exists: true });
      
      const { result, rerender } = renderHook(
        ({ email }) => useEmailValidation(email, { 
          onCheckEmail, 
          minLength: 5 
        }),
        { initialProps: { email: 'a@b.c' } }
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
        await Promise.resolve();
      });

      // Email is valid but equals minLength, should check
      expect(onCheckEmail).toHaveBeenCalledWith('a@b.c');
      expect(result.current.emailExists).toBe(true);

      // Test email shorter than minLength
      onCheckEmail.mockClear();
      rerender({ email: 'a@b' });

      await act(async () => {
        jest.advanceTimersByTime(500);
        await Promise.resolve();
      });

      expect(onCheckEmail).not.toHaveBeenCalled();
      expect(result.current.emailExists).toBe(null);
    });

    it('should reset state when email is cleared', async () => {
      const onCheckEmail = jest.fn().mockResolvedValue({ exists: true });
      
      const { result, rerender } = renderHook(
        ({ email }) => useEmailValidation(email, { onCheckEmail }),
        { initialProps: { email: 'test@example.com' } }
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
        await Promise.resolve();
      });

      expect(result.current.emailExists).toBe(true);

      // Clear email
      rerender({ email: '' });

      await act(async () => {
        jest.advanceTimersByTime(500);
        await Promise.resolve();
      });

      expect(result.current.emailExists).toBe(null);
      expect(result.current.isCheckingEmail).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle email check returning non-boolean exists', async () => {
      const onCheckEmail = jest.fn().mockResolvedValue({ exists: 'yes' as any });
      
      const { result } = renderHook(() => 
        useEmailValidation('test@example.com', { onCheckEmail })
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
        await Promise.resolve();
      });

      // Should still set the value even if it's not boolean
      expect(result.current.emailExists).toBe('yes');
    });

    it('should handle concurrent email changes during check', async () => {
      let checkCount = 0;
      const onCheckEmail = jest.fn().mockImplementation((email) => {
        checkCount++;
        const currentCount = checkCount;
        return new Promise(resolve => 
          setTimeout(() => resolve({ 
            exists: currentCount === 1 
          }), 100)
        );
      });
      
      const { result, rerender } = renderHook(
        ({ email }) => useEmailValidation(email, { onCheckEmail }),
        { initialProps: { email: 'first@example.com' } }
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Change email while first check is in progress
      rerender({ email: 'second@example.com' });

      await act(async () => {
        jest.advanceTimersByTime(600);
        await Promise.resolve();
      });

      // Result should reflect the second check only
      expect(result.current.emailExists).toBe(false);
      expect(onCheckEmail).toHaveBeenCalledTimes(2);
    });

    it('should clean up properly on unmount', async () => {
      const onCheckEmail = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ exists: true }), 1000))
      );
      
      const { unmount } = renderHook(() => 
        useEmailValidation('test@example.com', { onCheckEmail })
      );

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Unmount while check is in progress
      unmount();

      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      // Should not cause any errors
      expect(logger.auth.error).not.toHaveBeenCalled();
    });
  });
});