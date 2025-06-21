// Mock React Native modules for testing
const React = require('react');

// Mock components
const View = ({ children, ...props }) => React.createElement('View', props, children);
const Text = ({ children, ...props }) => React.createElement('Text', props, children);
const Pressable = ({ children, onPress, ...props }) => {
  return React.createElement('Pressable', {
    ...props,
    onPress: (props.disabled || props.accessibilityState?.disabled) ? undefined : onPress,
  }, children);
};
const ActivityIndicator = (props) => React.createElement('ActivityIndicator', props);
const ScrollView = ({ children, ...props }) => React.createElement('ScrollView', props, children);
const FlatList = ({ data, renderItem, ...props }) => React.createElement('FlatList', props);
const TouchableOpacity = ({ children, ...props }) => React.createElement('TouchableOpacity', props, children);

// Mock Platform
const Platform = {
  OS: 'ios',
  select: (obj) => obj[Platform.OS] || obj.default,
  Version: 14,
  isPad: false,
  isTV: false,
  isTVOS: false,
};

// Mock StyleSheet
const StyleSheet = {
  create: (styles) => styles,
  compose: (style1, style2) => [style1, style2].filter(Boolean),
  flatten: (styles) => {
    if (!styles) return {};
    if (Array.isArray(styles)) {
      return styles.reduce((acc, style) => ({ ...acc, ...StyleSheet.flatten(style) }), {});
    }
    return styles;
  },
  hairlineWidth: 1,
  absoluteFillObject: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
};

// Mock Dimensions
const Dimensions = {
  get: (dimension) => {
    if (dimension === 'window') {
      return { width: 375, height: 812, scale: 2, fontScale: 1 };
    }
    if (dimension === 'screen') {
      return { width: 375, height: 812, scale: 2, fontScale: 1 };
    }
    return { width: 0, height: 0, scale: 1, fontScale: 1 };
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock Animated
const Animated = {
  Value: class {
    constructor(value) {
      this._value = value;
    }
    setValue(value) {
      this._value = value;
    }
    addListener(callback) {
      callback({ value: this._value });
      return { remove: () => {} };
    }
    removeListener() {}
    removeAllListeners() {}
    stopAnimation() {}
    interpolate(config) {
      return new Animated.Value(this._value);
    }
  },
  timing: (value, config) => ({
    start: (callback) => {
      if (config.toValue !== undefined) {
        value.setValue(config.toValue);
      }
      callback && callback({ finished: true });
    },
    stop: () => {},
  }),
  spring: (value, config) => ({
    start: (callback) => {
      if (config.toValue !== undefined) {
        value.setValue(config.toValue);
      }
      callback && callback({ finished: true });
    },
    stop: () => {},
  }),
  sequence: (animations) => ({
    start: (callback) => {
      animations.forEach(anim => anim.start && anim.start());
      callback && callback({ finished: true });
    },
    stop: () => {},
  }),
  parallel: (animations) => ({
    start: (callback) => {
      animations.forEach(anim => anim.start && anim.start());
      callback && callback({ finished: true });
    },
    stop: () => {},
  }),
  View: View,
  Text: Text,
  Image: View,
  ScrollView: ScrollView,
  createAnimatedComponent: (Component) => Component,
};

// Mock other utilities
const PixelRatio = {
  get: () => 2,
  getFontScale: () => 1,
  getPixelSizeForLayoutSize: (size) => size * 2,
  roundToNearestPixel: (size) => Math.round(size * 2) / 2,
};

const AppState = {
  currentState: 'active',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

const Linking = {
  openURL: jest.fn(),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
};

const Alert = {
  alert: jest.fn(),
};

const Keyboard = {
  dismiss: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
};

const Clipboard = {
  getString: jest.fn(() => Promise.resolve('')),
  setString: jest.fn(),
};

const StatusBar = {
  setBarStyle: jest.fn(),
  setBackgroundColor: jest.fn(),
  setHidden: jest.fn(),
  setNetworkActivityIndicatorVisible: jest.fn(),
  setTranslucent: jest.fn(),
};

module.exports = {
  // Components
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image: View,
  SafeAreaView: View,
  KeyboardAvoidingView: View,
  Modal: View,
  TextInput: View,
  Switch: View,
  RefreshControl: View,
  Button: View,
  
  // APIs
  Platform,
  StyleSheet,
  Dimensions,
  Animated,
  PixelRatio,
  AppState,
  Linking,
  Alert,
  Keyboard,
  Clipboard,
  StatusBar,
  
  // Other utilities
  NativeModules: {},
  DeviceEventEmitter: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    emit: jest.fn(),
  },
  
  // Constants
  UIManager: {
    getViewManagerConfig: jest.fn(),
  },
  
  // Methods
  findNodeHandle: jest.fn(),
  unstable_batchedUpdates: (callback) => callback(),
};