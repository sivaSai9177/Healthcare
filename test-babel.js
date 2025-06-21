// Suppress common Expo Go warnings - MUST be first import
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

let _slicedToArray = (function () { function sliceIterator(arr, i) { let _arr = []; let _n = true; let _d = false; let _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

let _extends = Object.assign || function (target) { for (let i = 1; i < arguments.length; i++) { let source = arguments[i]; for (let key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports["default"] = RootLayout;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { let newObj = {}; if (obj != null) { for (let key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

require("@/lib/core/platform/suppress-warnings");

// Import crypto polyfill early for React Native

require("@/lib/core/crypto");

// Setup window debugger for browser console access

require("@/lib/core/debug/setup-window-logger");

// Import router debugging (will initialize after navigation is ready)

let _libCoreDebugRouterDebug = require("@/lib/core/debug/router-debug");

// Import console interceptor

let _componentsBlocksDebugUtilsConsoleInterceptor = require("@/components/blocks/debug/utils/console-interceptor");

let _expoFont = require("expo-font");

let _expoRouter = require("expo-router");

let _expoSplashScreen = require("expo-splash-screen");

let SplashScreen = _interopRequireWildcard(_expoSplashScreen);

let _expoStatusBar = require("expo-status-bar");

let _react = require("react");

let _react2 = _interopRequireDefault(_react);

let _reactNativeSafeAreaContext = require("react-native-safe-area-context");

let _reactNative = require("react-native");

let _libNavigationTransitions = require("@/lib/navigation/transitions");

let _libUiAnimationsAnimationContext = require("@/lib/ui/animations/AnimationContext");

let _libCoreDebugUnifiedLogger = require('@/lib/core/debug/unified-logger');

let _libStoresThemeStore = require('@/lib/stores/theme-store');

let _componentsProvidersErrorBoundary = require("@/components/providers/ErrorBoundary");

let _componentsProvidersErrorProvider = require("@/components/providers/ErrorProvider");

let _componentsBlocksErrorsErrorBanner = require("@/components/blocks/errors/ErrorBanner");

let _componentsRootErrorStoreSetup = require("@/components/RootErrorStoreSetup");

let _componentsProvidersGlobalErrorBoundary = require("@/components/providers/GlobalErrorBoundary");

let _componentsProvidersGlobalErrorBoundary2 = _interopRequireDefault(_componentsProvidersGlobalErrorBoundary);

let _componentsBlocksDebugDebugPanelDebugPanel = require("@/components/blocks/debug/DebugPanel/DebugPanel");

let _componentsProvidersSyncProvider = require("@/components/providers/SyncProvider");

let _componentsProvidersSessionProvider = require("@/components/providers/SessionProvider");

let _componentsProvidersHospitalProvider = require("@/components/providers/HospitalProvider");

let _componentsProvidersThemeStyleInjector = require("@/components/providers/ThemeStyleInjector");

let _componentsProvidersThemeSync = require("@/components/providers/ThemeSync");

// SpacingProvider removed - now using Zustand store

let _libThemeProvider = require("@/lib/theme/provider");

let _libApiTrpc = require("@/lib/api/trpc");

let _libCoreSecureStorage = require("@/lib/core/secure-storage");

// AnimationProvider removed - animations are now handled by components directly

// Import CSS for web platform

require('./global.css');

// Import reanimated for all platforms

require('react-native-reanimated');

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Debug component to track mount/unmount (disabled to reduce console noise)
let LayoutDebugger = function LayoutDebugger() {
  return null;
};

// StatusBar component that responds to theme changes
let ThemedStatusBar = function ThemedStatusBar() {
  let colorScheme = (0, _libStoresThemeStore.useThemeStore)(function (state) {
    return state.getEffectiveColorScheme();
  });
  return _react2["default"].createElement(_expoStatusBar.StatusBar, { style: colorScheme === 'dark' ? 'light' : 'dark' });
};

function RootLayout() {
  _libCoreDebugUnifiedLogger.logger.system.info('RootLayout rendering', {
    platform: _reactNative.Platform.OS,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    apiUrl: process.env.EXPO_PUBLIC_API_URL
  });

  let _useFonts = (0, _expoFont.useFonts)({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf")
  });

  let _useFonts2 = _slicedToArray(_useFonts, 2);

  let loaded = _useFonts2[0];
  let error = _useFonts2[1];

  let _useState = (0, _react.useState)(_reactNative.Platform.OS === 'web');

  let _useState2 = _slicedToArray(_useState, 2);

  let storageReady = _useState2[0];
  let setStorageReady = _useState2[1];

  _libCoreDebugUnifiedLogger.logger.system.info('RootLayout state', {
    fontLoaded: loaded,
    fontError: error,
    storageReady: storageReady,
    platform: _reactNative.Platform.OS
  });

  (0, _react.useEffect)(function () {
    // Initialize storage on mobile
    if (_reactNative.Platform.OS !== 'web') {
      (0, _libCoreSecureStorage.initializeSecureStorage)().then(function () {
        setStorageReady(true);
      });
    }
  }, []);

  (0, _react.useEffect)(function () {
    if (loaded && storageReady) {
      SplashScreen.hideAsync();
      _libCoreDebugUnifiedLogger.logger.debug('[App] All resources loaded, hiding splash screen', 'SYSTEM');

      // Initialize debugging tools after navigation is ready
      if (__DEV__) {
        // Start console interception immediately
        (0, _componentsBlocksDebugUtilsConsoleInterceptor.startConsoleInterception)();
        _libCoreDebugUnifiedLogger.logger.debug('[App] Console interception started', 'SYSTEM');

        // Initialize router debugger after a delay
        setTimeout(function () {
          try {
            (0, _libCoreDebugRouterDebug.initializeRouterDebugger)();
            _libCoreDebugUnifiedLogger.logger.debug('[App] Router debugger initialized', 'SYSTEM');
          } catch (error) {
            _libCoreDebugUnifiedLogger.logger.error('[App] Failed to initialize router debugger', 'SYSTEM', error);
          }
        }, 500); // Increased delay to ensure navigation is ready
      }
    }
  }, [loaded, storageReady]);

  // Add error handling
  if (error) {
    _libCoreDebugUnifiedLogger.logger.system.error('Font loading error', error);
  }

  // Wait for both fonts and storage to be ready
  if (!loaded || !storageReady) {
    _libCoreDebugUnifiedLogger.logger.system.info('Waiting for resources', { loaded: loaded, storageReady: storageReady });
    return null;
  }

  _libCoreDebugUnifiedLogger.logger.system.info('Resources ready, rendering app');

  return _react2["default"].createElement(
    _componentsProvidersGlobalErrorBoundary2["default"],
    null,
    _react2["default"].createElement(
      _reactNativeSafeAreaContext.SafeAreaProvider,
      { style: { flex: 1 } },
      _react2["default"].createElement(
        _componentsProvidersErrorBoundary.ErrorBoundary,
        null,
        _react2["default"].createElement(
          _libApiTrpc.TRPCProvider,
          { dehydratedState: undefined },
          _react2["default"].createElement(
            _componentsProvidersErrorProvider.ErrorProvider,
            null,
            _react2["default"].createElement(
              _componentsProvidersSyncProvider.SyncProvider,
              null,
              _react2["default"].createElement(
                _componentsProvidersSessionProvider.SessionProvider,
                null,
                _react2["default"].createElement(
                  _componentsProvidersHospitalProvider.HospitalProvider,
                  null,
                  _react2["default"].createElement(
                    _libThemeProvider.EnhancedThemeProvider,
                    null,
                    _react2["default"].createElement(_componentsProvidersThemeSync.ThemeSync, null),
                    _react2["default"].createElement(
                      _libUiAnimationsAnimationContext.AnimationProvider,
                      null,
                      _react2["default"].createElement(
                        _componentsProvidersThemeStyleInjector.ThemeStyleInjector,
                        null,
                        _react2["default"].createElement(_componentsRootErrorStoreSetup.RootErrorStoreSetup, null),
                        _react2["default"].createElement(_componentsBlocksErrorsErrorBanner.ErrorBanner, null),
                        _react2["default"].createElement(
                          _expoRouter.Stack,
                          {
                            screenOptions: _extends({}, _libNavigationTransitions.stackScreenOptions["default"], {
                              headerShown: false
                            })
                          },
                          _react2["default"].createElement(_expoRouter.Stack.Screen, {
                            name: "(public)",
                            options: {
                              headerShown: false,
                              animation: 'fade'
                            }
                          }),
                          _react2["default"].createElement(_expoRouter.Stack.Screen, {
                            name: "(app)",
                            options: {
                              headerShown: false,
                              animation: 'fade'
                            }
                          }),
                          _react2["default"].createElement(_expoRouter.Stack.Screen, {
                            name: "(modals)",
                            options: {
                              presentation: 'modal',
                              headerShown: false
                            }
                          }),
                          _react2["default"].createElement(_expoRouter.Stack.Screen, {
                            name: "index",
                            options: {
                              animation: 'fade',
                              animationDuration: 300
                            }
                          }),
                          _react2["default"].createElement(_expoRouter.Stack.Screen, {
                            name: "auth-callback",
                            options: { animation: 'fade' }
                          }),
                          _react2["default"].createElement(_expoRouter.Stack.Screen, {
                            name: "+not-found",
                            options: {
                              animation: 'fade',
                              animationDuration: 200
                            }
                          })
                        ),
                        _react2["default"].createElement(ThemedStatusBar, null),
                        _react2["default"].createElement(LayoutDebugger, null)
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  );
}

module.exports = exports["default"];
/* Public routes */ /* Authenticated app routes */ /* Modal routes */ /* Legacy index route for backward compatibility */ /* Auth callback route */ /* 404 handler */ /* <ConsolidatedDebugPanel /> */
