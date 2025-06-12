module.exports = (api) => {
  api.cache(true);
  
  const plugins = [
    ["@babel/plugin-transform-runtime", {
      helpers: true,
      regenerator: true,
    }],
    ["inline-import", { extensions: [".sql"] }],
    "./babel-plugin-import-meta.js",
  ];
  
  // Only include reanimated plugin on native platforms
  // Check multiple conditions to ensure we're not on web
  const isWeb = process.env.PLATFORM === 'web' || 
                process.env.EXPO_PUBLIC_PLATFORM === 'web' ||
                process.env.BABEL_ENV === 'web';
                
  if (!isWeb) {
    plugins.push([
      "react-native-reanimated/plugin",
      {
        // This prevents the plugin from adding web-incompatible code
        globals: ['__reanimatedWorkletInit', '__reanimatedModuleProxy'],
      }
    ]);
  }
  
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          // Enable import.meta transformation for web bundling
          unstable_transformImportMeta: true,
        },
      ],
      "nativewind/babel",
    ],
    plugins,
    // Add helpers
    env: {
      production: {
        plugins: ['transform-remove-console']
      }
    }
  };
};
