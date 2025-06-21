import { act } from '@testing-library/react-native';
import { SharedValue } from 'react-native-reanimated';

/**
 * Mock animation driver for testing animations
 */
export const mockAnimationDriver = () => {
  jest.useFakeTimers();
  
  return {
    runAnimation: (duration: number) => {
      act(() => {
        jest.advanceTimersByTime(duration);
      });
    },
    runAllAnimations: () => {
      act(() => {
        jest.runAllTimers();
      });
    },
    cleanup: () => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    }
  };
};

/**
 * Helper to test animated styles
 */
export const expectAnimatedStyle = (element: any, expectedStyle: any) => {
  const animatedProps = element.props.style;
  expect(animatedProps).toMatchObject(expectedStyle);
};

/**
 * Helper to test shared values
 */
export const expectSharedValue = (sharedValue: SharedValue<any>, expectedValue: any) => {
  expect(sharedValue.value).toBe(expectedValue);
};

/**
 * Mock reanimated worklet
 */
export const runOnUI = (worklet: () => void) => {
  'worklet';
  return worklet();
};

/**
 * Animation test presets
 */
export const AnimationPresets = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: 300,
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
    duration: 300,
  },
  slideInLeft: {
    from: { transform: [{ translateX: -100 }] },
    to: { transform: [{ translateX: 0 }] },
    duration: 300,
  },
  slideInRight: {
    from: { transform: [{ translateX: 100 }] },
    to: { transform: [{ translateX: 0 }] },
    duration: 300,
  },
  scaleIn: {
    from: { transform: [{ scale: 0 }] },
    to: { transform: [{ scale: 1 }] },
    duration: 300,
  },
};

/**
 * Test animation sequence
 */
export const testAnimationSequence = async (
  component: any,
  animations: { style: any; duration: number }[]
) => {
  const driver = mockAnimationDriver();
  
  for (const { style, duration } of animations) {
    driver.runAnimation(duration);
    expectAnimatedStyle(component, style);
  }
  
  driver.cleanup();
};

/**
 * Platform-specific animation test
 */
export const testPlatformAnimation = (
  testName: string,
  iosTest: () => void,
  androidTest: () => void,
  webTest: () => void
) => {
  describe.each([
    ['ios', iosTest],
    ['android', androidTest],
    ['web', webTest],
  ])('%s: ' + testName, (platform, testFn) => {
    beforeEach(() => {
      jest.resetModules();
      jest.doMock('react-native', () => ({
        ...jest.requireActual('react-native'),
        Platform: {
          OS: platform,
          select: (obj: any) => obj[platform] || obj.default,
        },
      }));
    });

    afterEach(() => {
      jest.dontMock('react-native');
    });

    it(`should work on ${platform}`, testFn);
  });
};