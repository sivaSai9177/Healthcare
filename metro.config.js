const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Ensure projectRoot is set
config.projectRoot = projectRoot;
config.watchFolders = [projectRoot];

// Exclude scripts folder from bundling
config.resolver.blockList = config.resolver.blockList || [];
// Use blocklist to exclude scripts directory and build tools
const exclusionList = require('metro-config/src/defaults/exclusionList');
config.resolver.blockList = exclusionList([
  /scripts\/.*/,
  /\.cleanup-archive\/.*/,
  /.*\.test\.(js|jsx|ts|tsx)$/,
  /.*\.spec\.(js|jsx|ts|tsx)$/,
  // Exclude build tools that use import.meta
  /node_modules\/jiti\/.*/,
  /node_modules\/sucrase\/.*/,
  /node_modules\/acorn\/.*/,
  /node_modules\/@eslint\/.*/,
  /node_modules\/eslint\/.*/,
  /node_modules\/esbuild-register\/.*/,
  /node_modules\/cjs-module-lexer\/.*/,
  /node_modules\/.*\.config\.js$/,
]);

// Add web-specific optimizations
if (process.env.PLATFORM === 'web') {
  config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
}

// Ensure certain modules are resolved correctly
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Prevent build tools from being resolved
  const buildTools = ['jiti', 'sucrase', 'acorn', 'esbuild-register', 'cjs-module-lexer'];
  if (buildTools.some(tool => moduleName.includes(tool))) {
    return { type: 'empty' };
  }
  
  // Default resolution
  return context.resolveRequest(context, moduleName, platform);
};

// Override server settings
// Remove 'host' as it's not a valid metro option

// Production optimizations
if (process.env.NODE_ENV === 'production') {
  // Enable minification
  config.transformer.minifierConfig = {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
    compress: {
      drop_console: true,
      reduce_funcs: false,
    },
  };
  
  // Optimize bundle
  config.transformer.optimizationSizeLimit = 250000; // 250KB
}

module.exports = withNativeWind(config, { input: './app/global.css' });