// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for web
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  "web.js",
  "web.jsx",
  "web.ts",
  "web.tsx",
];

// Handle SSR/SSG for web exports
config.transformer.asyncRequireModulePath = require.resolve(
  "metro-runtime/src/modules/asyncRequire"
);
config.transformer.assetRegistryPath = require.resolve(
  "react-native/Libraries/Image/AssetRegistry"
);

module.exports = config;
