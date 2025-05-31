/** @type {import('expo/metro-config').MetroConfig} */
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("sql");

// Add wasm asset support
config.resolver.assetExts.push("wasm");
config.resolver.unstable_enablePackageExports = true;

// CORS is handled by Expo CLI, not Metro config 

// Export the config with NativeWind
module.exports = withNativeWind(config, {
  input: "./app/global.css",
  configPath: "./tailwind.config.ts",
});
