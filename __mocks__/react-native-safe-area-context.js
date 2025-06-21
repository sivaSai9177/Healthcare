const React = require('react');

const inset = { top: 0, right: 0, bottom: 0, left: 0 };

module.exports = {
  SafeAreaProvider: ({ children }) => children,
  SafeAreaConsumer: ({ children }) => children(inset),
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => inset,
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
  initialWindowMetrics: {
    insets: inset,
    frame: { x: 0, y: 0, width: 375, height: 812 },
  },
  withSafeAreaInsets: (Component) => Component,
};