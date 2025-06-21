// Mock for react-native-reanimated
const React = require('react');
const RN = require('react-native');

const Animated = {
  createAnimatedComponent: (Component) => Component,
  View: RN.View,
  ScrollView: RN.ScrollView,
  FlatList: RN.FlatList,
  Image: RN.Image,
  Text: RN.Text,
};

module.exports = {
  __esModule: true,
  default: Animated,
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withSpring: jest.fn((value) => value),
  withTiming: jest.fn((value) => value),
  withSequence: jest.fn((...args) => args[0]),
  withDelay: jest.fn((_, value) => value),
  runOnJS: jest.fn((fn) => fn),
  runOnUI: jest.fn((fn) => fn),
  processColor: jest.fn((color) => color),
  Easing: {
    linear: jest.fn(),
    ease: jest.fn(),
    quad: jest.fn(),
    cubic: jest.fn(),
    poly: jest.fn(() => jest.fn()),
    sin: jest.fn(),
    circle: jest.fn(),
    exp: jest.fn(),
    bounce: jest.fn(),
    back: jest.fn(() => jest.fn()),
    bezier: jest.fn(() => jest.fn()),
    in: jest.fn(() => jest.fn()),
    out: jest.fn(() => jest.fn()),
    inOut: jest.fn(() => jest.fn()),
  },
  interpolate: jest.fn((value, inputRange, outputRange) => value),
  Extrapolate: {
    EXTEND: 'extend',
    CLAMP: 'clamp',
    IDENTITY: 'identity',
  },
  makeMutable: jest.fn((val) => ({ value: val })),
  interpolateColor: jest.fn((value, inputRange, outputRange) => outputRange[0]),
  useAnimatedScrollHandler: jest.fn(() => ({})),
  useAnimatedGestureHandler: jest.fn(() => ({})),
  FadeIn: {
    delay: jest.fn(() => ({
      springify: jest.fn(() => ({})),
      duration: jest.fn(() => ({})),
    })),
    springify: jest.fn(() => ({})),
    duration: jest.fn(() => ({})),
  },
  FadeOut: {
    delay: jest.fn(() => ({
      springify: jest.fn(() => ({})),
      duration: jest.fn(() => ({})),
    })),
    springify: jest.fn(() => ({})),
    duration: jest.fn(() => ({})),
  },
  FadeInUp: {
    delay: jest.fn(() => ({
      springify: jest.fn(() => ({})),
      duration: jest.fn(() => ({})),
    })),
    springify: jest.fn(() => ({})),
    duration: jest.fn(() => ({})),
  },
  FadeInDown: {
    delay: jest.fn(() => ({
      springify: jest.fn(() => ({})),
      duration: jest.fn(() => ({})),
    })),
    springify: jest.fn(() => ({})),
    duration: jest.fn(() => ({})),
  },
  SlideInDown: {
    delay: jest.fn(() => ({
      springify: jest.fn(() => ({})),
      duration: jest.fn(() => ({})),
    })),
    springify: jest.fn(() => ({})),
    duration: jest.fn(() => ({})),
  },
  Layout: {
    springify: jest.fn(() => ({})),
    duration: jest.fn(() => ({})),
  },
  createAnimatedPropAdapter: jest.fn(),
  configureLayoutAnimationBatch: jest.fn(),
  globalThis: {},
  ...Animated, // Spread Animated properties at the top level too
};