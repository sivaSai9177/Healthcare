const React = require('react');

module.exports = {
  StatusBar: ({ children }) => children || null,
  setStatusBarHidden: jest.fn(),
  setStatusBarStyle: jest.fn(),
  setStatusBarTranslucent: jest.fn(),
  setStatusBarBackgroundColor: jest.fn(),
  setStatusBarNetworkActivityIndicatorVisible: jest.fn(),
};