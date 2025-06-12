/**
 * Web mock for react-native-reanimated
 * Provides safe fallbacks for all Reanimated APIs on web platform
 */

import { View, Text, Image, ScrollView, FlatList, SectionList } from 'react-native';

// Type definitions
type SharedValue<T> = { value: T };
type AnimatedStyle = any;
type AnimatedProps<T> = T;

// Mock shared values
export function useSharedValue<T>(initialValue: T): SharedValue<T> {
  return { value: initialValue };
}

export function useDerivedValue<T>(factory: () => T): SharedValue<T> {
  return { value: factory() };
}

// Mock animated styles
export function useAnimatedStyle<T extends AnimatedStyle>(factory: () => T): T {
  return factory();
}

export function useAnimatedProps<T>(factory: () => T): AnimatedProps<T> {
  return factory();
}

// Mock animation functions
export function withTiming(toValue: number, config?: any, callback?: (finished: boolean) => void): number {
  if (callback) callback(true);
  return toValue;
}

export function withSpring(toValue: number, config?: any, callback?: (finished: boolean) => void): number {
  if (callback) callback(true);
  return toValue;
}

export function withSequence(...animations: any[]): any {
  return animations[animations.length - 1];
}

export function withDelay(delay: number, animation: any): any {
  return animation;
}

export function withRepeat(animation: any, numberOfReps?: number, reverse?: boolean, callback?: (finished: boolean) => void): any {
  if (callback) callback(true);
  return animation;
}

export function cancelAnimation(sharedValue: SharedValue<any>): void {
  // no-op
}

// Mock interpolation
export function interpolate(
  value: number,
  inputRange: number[],
  outputRange: number[],
  extrapolate?: string
): number {
  return value;
}

export function interpolateColor(
  value: number,
  inputRange: number[],
  outputRange: string[]
): string {
  return outputRange[0];
}

// Mock hooks
export function useAnimatedScrollHandler(handler: any): () => void {
  return () => {};
}

export function useAnimatedGestureHandler(handler: any): any {
  return {};
}

export function useAnimatedRef<T>(): { current: T | null } {
  return { current: null };
}

export function useAnimatedReaction<T>(
  prepare: () => T,
  react: (value: T) => void,
  dependencies?: any[]
): void {
  // no-op
}

export function useAnimatedSensor(sensorType: any, config?: any): { sensor: any } {
  return { sensor: {} };
}

// Mock worklet functions
export function runOnJS<T extends (...args: any[]) => any>(fn: T): T {
  return fn;
}

export function runOnUI<T extends (...args: any[]) => any>(fn: T): T {
  return fn;
}

export function makeMutable<T>(value: T): SharedValue<T> {
  return { value };
}

export function isSharedValue(value: any): boolean {
  return false;
}

// Mock entering/exiting animations
const createAnimation = (name: string) => ({
  duration: (ms: number) => createAnimation(name),
  delay: (ms: number) => createAnimation(name),
  springify: () => createAnimation(name),
  damping: (value: number) => createAnimation(name),
  stiffness: (value: number) => createAnimation(name),
  withInitialValues: (values: any) => createAnimation(name),
  withCallback: (callback: any) => createAnimation(name),
  randomDelay: () => createAnimation(name),
});

export const FadeIn = createAnimation('FadeIn');
export const FadeOut = createAnimation('FadeOut');
export const SlideInUp = createAnimation('SlideInUp');
export const SlideInDown = createAnimation('SlideInDown');
export const SlideInLeft = createAnimation('SlideInLeft');
export const SlideInRight = createAnimation('SlideInRight');
export const SlideOutUp = createAnimation('SlideOutUp');
export const SlideOutDown = createAnimation('SlideOutDown');
export const SlideOutLeft = createAnimation('SlideOutLeft');
export const SlideOutRight = createAnimation('SlideOutRight');
export const ZoomIn = createAnimation('ZoomIn');
export const ZoomOut = createAnimation('ZoomOut');
export const RotateInDownLeft = createAnimation('RotateInDownLeft');
export const RotateInDownRight = createAnimation('RotateInDownRight');
export const RotateInUpLeft = createAnimation('RotateInUpLeft');
export const RotateInUpRight = createAnimation('RotateInUpRight');
export const RotateOutDownLeft = createAnimation('RotateOutDownLeft');
export const RotateOutDownRight = createAnimation('RotateOutDownRight');
export const RotateOutUpLeft = createAnimation('RotateOutUpLeft');
export const RotateOutUpRight = createAnimation('RotateOutUpRight');

// Mock layout animations
export const Layout = createAnimation('Layout');
export const LinearTransition = createAnimation('LinearTransition');
export const SequencedTransition = createAnimation('SequencedTransition');
export const FadingTransition = createAnimation('FadingTransition');
export const JumpingTransition = createAnimation('JumpingTransition');
export const CurvedTransition = createAnimation('CurvedTransition');
export const EntryExitTransition = createAnimation('EntryExitTransition');

// Mock easing functions
export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  quad: (t: number) => t,
  cubic: (t: number) => t,
  poly: (n: number) => (t: number) => t,
  sin: (t: number) => t,
  circle: (t: number) => t,
  exp: (t: number) => t,
  elastic: (bounciness?: number) => (t: number) => t,
  back: (s?: number) => (t: number) => t,
  bounce: (t: number) => t,
  bezier: (x1: number, y1: number, x2: number, y2: number) => (t: number) => t,
  bezierFn: (x1: number, y1: number, x2: number, y2: number) => (t: number) => t,
  steps: (n: number, end?: boolean) => (t: number) => t,
  in: (easing: (t: number) => number) => easing,
  out: (easing: (t: number) => number) => easing,
  inOut: (easing: (t: number) => number) => easing,
};

// Mock animated components
const AnimatedView = View as any;
const AnimatedText = Text as any;
const AnimatedImage = Image as any;
const AnimatedScrollView = ScrollView as any;
const AnimatedFlatList = FlatList as any;
const AnimatedSectionList = SectionList as any;

export const Animated = {
  View: AnimatedView,
  Text: AnimatedText,
  Image: AnimatedImage,
  ScrollView: AnimatedScrollView,
  FlatList: AnimatedFlatList,
  SectionList: AnimatedSectionList,
  createAnimatedComponent: <T extends React.ComponentType<any>>(component: T): T => component,
};

// Mock measure functions
export function measure(animatedRef: any): {
  width: number;
  height: number;
  x: number;
  y: number;
  pageX: number;
  pageY: number;
} {
  return {
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    pageX: 0,
    pageY: 0,
  };
}

export function scrollTo(animatedRef: any, x: number, y: number, animated: boolean): void {
  // no-op
}

// Mock gesture handler state
export const State = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
};

// Mock native methods
export function setNativeProps(animatedRef: any, props: any): void {
  // no-op
}

export function configureLayoutAnimationBatch(): void {
  // no-op
}

export function configureLayoutAnimation(): void {
  // no-op
}

// Additional exports
export const Extrapolation = {
  CLAMP: 'clamp',
  EXTEND: 'extend',
  IDENTITY: 'identity',
};

export const Extrapolate = Extrapolation;

export function addWhitelistedNativeProps(): void {
  // no-op
}

export function addWhitelistedUIProps(): void {
  // no-op
}

// Default export
export default {
  ...Animated,
  createAnimatedComponent: Animated.createAnimatedComponent,
  
  // Hooks
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedGestureHandler,
  useAnimatedRef,
  useAnimatedReaction,
  useAnimatedSensor,
  
  // Animation functions
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  cancelAnimation,
  
  // Interpolation
  interpolate,
  interpolateColor,
  
  // Worklet functions
  runOnJS,
  runOnUI,
  makeMutable,
  isSharedValue,
  
  // Entering/Exiting animations
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
  SlideOutUp,
  SlideOutDown,
  SlideOutLeft,
  SlideOutRight,
  ZoomIn,
  ZoomOut,
  RotateInDownLeft,
  RotateInDownRight,
  RotateInUpLeft,
  RotateInUpRight,
  RotateOutDownLeft,
  RotateOutDownRight,
  RotateOutUpLeft,
  RotateOutUpRight,
  
  // Layout animations
  Layout,
  LinearTransition,
  SequencedTransition,
  FadingTransition,
  JumpingTransition,
  CurvedTransition,
  EntryExitTransition,
  
  // Easing
  Easing,
  
  // Measure functions
  measure,
  scrollTo,
  
  // State
  State,
  
  // Native methods
  setNativeProps,
  configureLayoutAnimationBatch,
  configureLayoutAnimation,
  
  // Additional exports
  Extrapolation,
  Extrapolate,
  addWhitelistedNativeProps,
  addWhitelistedUIProps,
};