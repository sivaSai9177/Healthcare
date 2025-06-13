module.exports = (api) => {
  api.cache(true);
  
  const plugins = [
    ["inline-import", { extensions: [".sql"] }],
    // Transform import.meta for Metro compatibility
    "./babel-plugin-transform-import-meta",
    // Add babel helpers
    "./babel-plugin-add-module-helpers",
  ];
  
  // Always include reanimated plugin but with web-safe config
  plugins.push([
    "react-native-reanimated/plugin",
    {
      // This prevents the plugin from adding web-incompatible code
      globals: ['__reanimatedWorkletInit', '__reanimatedModuleProxy'],
    }
  ]);
  
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          // Ensure proper module handling
          lazyImports: true,
        },
      ],
      "nativewind/babel",
    ],
    plugins,
  };
};
