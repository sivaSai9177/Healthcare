import { renderHook, act } from '@testing-library/react-hooks';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 500 });
    
    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now value should be updated
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 500 } }
    );

    // Make rapid changes
    rerender({ value: 'second', delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    rerender({ value: 'third', delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    rerender({ value: 'final', delay: 500 });

    // Advance time to just before the delay
    act(() => {
      jest.advanceTimersByTime(499);
    });

    // Should still be initial value
    expect(result.current).toBe('first');

    // Advance the remaining time
    act(() => {
      jest.advanceTimersByTime(1);
    });

    // Should now be the final value
    expect(result.current).toBe('final');
  });

  it('should handle different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    );

    rerender({ value: 'updated', delay: 1000 });

    act(() => {
      jest.advanceTimersByTime(999);
    });

    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current).toBe('updated');
  });

  it('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 0 } }
    );

    rerender({ value: 'updated', delay: 0 });

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(result.current).toBe('updated');
  });

  it('should handle changing delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'updated', delay: 1000 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should still be initial because delay changed to 1000
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('should work with different data types', () => {
    // Number
    const { result: numberResult, rerender: rerenderNumber } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 42, delay: 500 } }
    );

    rerenderNumber({ value: 100, delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(numberResult.current).toBe(100);

    // Object
    const { result: objectResult, rerender: rerenderObject } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: { a: 1 }, delay: 500 } }
    );

    const newObject = { b: 2 };
    rerenderObject({ value: newObject, delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(objectResult.current).toBe(newObject);

    // Array
    const { result: arrayResult, rerender: rerenderArray } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: [1, 2, 3], delay: 500 } }
    );

    const newArray = [4, 5, 6];
    rerenderArray({ value: newArray, delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(arrayResult.current).toBe(newArray);

    // Boolean
    const { result: boolResult, rerender: rerenderBool } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: true, delay: 500 } }
    );

    rerenderBool({ value: false, delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(boolResult.current).toBe(false);

    // Null/undefined
    const { result: nullResult, rerender: rerenderNull } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: null as null | string, delay: 500 } }
    );

    rerenderNull({ value: 'not null', delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(nullResult.current).toBe('not null');
  });

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    const { rerender, unmount } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'updated', delay: 500 });
    
    // Unmount before timeout completes
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('should handle negative delay as zero', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: -100 } }
    );

    rerender({ value: 'updated', delay: -100 });

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(result.current).toBe('updated');
  });

  it('should handle very large delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: Number.MAX_SAFE_INTEGER } }
    );

    rerender({ value: 'updated', delay: Number.MAX_SAFE_INTEGER });

    act(() => {
      jest.advanceTimersByTime(1000000); // Advance 1 million ms
    });

    // Should still be initial value
    expect(result.current).toBe('initial');
  });

  it('should maintain referential equality for unchanged objects', () => {
    const obj = { key: 'value' };
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: obj, delay: 500 } }
    );

    const firstResult = result.current;

    // Rerender with same object reference
    rerender({ value: obj, delay: 500 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe(firstResult);
  });

  it('should handle synchronous value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'A', delay: 500 } }
    );

    // Multiple synchronous changes
    rerender({ value: 'B', delay: 500 });
    rerender({ value: 'C', delay: 500 });
    rerender({ value: 'D', delay: 500 });

    expect(result.current).toBe('A');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should debounce to the last value
    expect(result.current).toBe('D');
  });
});