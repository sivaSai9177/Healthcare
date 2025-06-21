module.exports = (api) => {
  api.cache(true);
  
  const plugins = [
    ["inline-import", { extensions: [".sql"] }],
  ];
  
  // Always include reanimated plugin but with web-safe config
  // Must be the last plugin
  plugins.push([
    "react-native-reanimated/plugin",
    {
      // This prevents the plugin from adding web-incompatible code
      globals: ['__reanimatedWorkletInit', '__reanimatedModuleProxy'],
      // Add web-safe configuration
      processNestedWorklets: true,
      // Disable worklet string evaluation on web
      evaluateWorkletStringRepresentation: false,
    }
  ]);
  
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          unstable_transformImportMeta: true,
          // Ensure proper module resolution
          lazyImports: true,
        },
      ],
      "nativewind/babel",
    ],
    plugins,
  };
};
