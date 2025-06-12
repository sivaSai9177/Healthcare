import {
  withTiming,
  withSpring,
  withDelay,
  LayoutAnimation,
  SharedValue,
} from 'react-native-reanimated';
import { DURATIONS, EASINGS } from './constants';
import { getSpringConfig, getTimingConfig } from './utils';

/**
 * Layout animation utilities for smooth transitions
 */

export type LayoutAnimationFunction = (targetValues: any) => LayoutAnimation;

// Basic layout animations
export const Layout = {
  duration: (ms: number): LayoutAnimationFunction => {
    return (targetValues: any) => {
      'worklet';
      return {
        initialValues: targetValues,
        animations: targetValues,
        callback: () => {},
      };
    };
  },
  
  springify: (): LayoutAnimationFunction => {
    return (targetValues: any) => {
      'worklet';
      return {
        initialValues: targetValues,
        animations: Object.keys(targetValues).reduce((acc, key) => {
          acc[key] = withSpring(targetValues[key], getSpringConfig('default'));
          return acc;
        }, {} as any),
        callback: () => {},
      };
    };
  },
  
  delay: (ms: number): LayoutAnimationFunction => {
    return (targetValues: any) => {
      'worklet';
      return {
        initialValues: targetValues,
        animations: Object.keys(targetValues).reduce((acc, key) => {
          acc[key] = withDelay(ms, withTiming(targetValues[key], getTimingConfig()));
          return acc;
        }, {} as any),
        callback: () => {},
      };
    };
  },
};

// Stagger animations for lists
export const createStaggerAnimation = (
  baseDelay: number = 50,
  duration: number = DURATIONS.normal
): LayoutAnimationFunction => {
  let index = 0;
  
  return (targetValues: any) => {
    'worklet';
    const delay = index * baseDelay;
    index++;
    
    return {
      initialValues: targetValues,
      animations: Object.keys(targetValues).reduce((acc, key) => {
        acc[key] = withDelay(
          delay,
          withTiming(targetValues[key], { duration, easing: EASINGS.easeOut })
        );
        return acc;
      }, {} as any),
      callback: () => {
        index = 0; // Reset for next use
      },
    };
  };
};