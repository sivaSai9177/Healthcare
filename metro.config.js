const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add web-specific optimizations
if (process.env.PLATFORM === 'web') {
  config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
}

module.exports = withNativeWind(config, { input: './app/global.css' });