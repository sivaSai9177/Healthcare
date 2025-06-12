const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Customize the config before returning it.
  config.resolve = config.resolve || {};
  config.resolve.alias = config.resolve.alias || {};
  
  // Mock react-native-reanimated for web
  config.resolve.alias['react-native-reanimated'] = require.resolve('./lib/core/platform/reanimated-web-mock.ts');
  
  // Exclude scripts from resolution
  config.resolve.modules = config.resolve.modules || [];
  if (!config.resolve.modules.includes('node_modules')) {
    config.resolve.modules.push('node_modules');
  }
  
  // Add exclusion for scripts in module resolution
  config.resolve.fallback = config.resolve.fallback || {};
  config.resolve.fallback.scripts = false;
  
  // Externalize modules that use import.meta
  config.externals = config.externals || [];
  if (!Array.isArray(config.externals)) {
    config.externals = [config.externals];
  }
  config.externals.push({
    'jiti': 'commonjs jiti',
    'drizzle-kit': 'commonjs drizzle-kit',
    'drizzle-orm': 'commonjs drizzle-orm',
  });
  
  // Exclude scripts folder from bundling (matches metro config)
  config.module = config.module || {};
  config.module.rules = config.module.rules || [];
  config.module.rules.push({
    test: /scripts\/.*/,
    loader: 'null-loader'
  });
  
  // Exclude .cleanup-archive folder
  config.module.rules.push({
    test: /\.cleanup-archive\/.*/,
    loader: 'null-loader'
  });
  
  return config;
};