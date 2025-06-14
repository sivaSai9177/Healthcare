// Mock implementation of react-native-reanimated for web
// This prevents errors when reanimated APIs are called on web

const View = require('react-native').View;
const React = require('react');

// Mock animated component
const AnimatedView = View;

// Mock hooks and functions
const useSharedValue = (initialValue) => ({ value: initialValue });
const useAnimatedStyle = (styleFactory) => {
  // Return an empty style object that can be safely accessed
  return React.useMemo(() => {
    if (typeof styleFactory === 'function') {
      try {
        return styleFactory() || {};
      } catch {
        return {};
      }
    }
    return {};
  }, []);
};
const withTiming = (toValue) => toValue;
const withSpring = (toValue) => toValue;
const withSequence = () => 0;
const withDelay = (delay, animation) => animation;
const interpolate = (value, inputRange, outputRange) => outputRange[0];
const runOnJS = (fn) => fn;
const runOnUI = (fn) => fn;

// Mock updateProps function to prevent setNativeProps errors
const updateProps = () => {};
const setGestureState = () => {};
const measure = (callback) => callback({
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  pageX: 0,
  pageY: 0,
});

// Mock Extrapolation
const Extrapolation = {
  CLAMP: 'clamp',
  EXTEND: 'extend',
  IDENTITY: 'identity',
};

// Create animated component that properly handles ref and style
const createAnimatedComponent = (Component) => {
  return React.forwardRef((props, ref) => {
    // Filter out animation-specific props that the base component won't understand
    const { entering, exiting, layout, ...restProps } = props;
    
    // Ensure style prop exists and can be accessed
    const style = restProps.style || {};
    
    // Create a component that has a dummy setNativeProps to prevent errors
    const componentRef = React.useRef(null);
    
    React.useImperativeHandle(ref, () => ({
      ...(componentRef.current || {}),
      setNativeProps: () => {}, // Dummy function to prevent errors
    }));
    
    return React.createElement(Component, { ...restProps, style, ref: componentRef });
  });
};

// Default export
module.exports = {
  default: {
    View: AnimatedView,
    Text: View,
    ScrollView: View,
    Image: View,
    createAnimatedComponent,
  },
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  Extrapolate: Extrapolation, // Alias
  runOnJS,
  runOnUI,
  updateProps,
  setGestureState,
  measure,
  cancelAnimation: () => {},
  // Add any other APIs that might be used
  useAnimatedScrollHandler: () => ({}),
  useAnimatedGestureHandler: () => ({}),
  useAnimatedRef: () => ({ 
    current: {
      measure,
      measureInWindow: measure,
      setNativeProps: () => {},
    } 
  }),
  useAnimatedReaction: () => {},
  useDerivedValue: (fn) => useSharedValue(fn()),
  useAnimatedProps: () => ({}),
  // Layout animations
  Layout: {},
  FadeIn: {},
  FadeOut: {},
  SlideInLeft: {},
  SlideInRight: {},
  SlideOutLeft: {},
  SlideOutRight: {},
  ZoomIn: {
    duration: () => ({ delay: () => ({}) }),
  },
  ZoomOut: {
    duration: () => ({ delay: () => ({}) }),
  },
};