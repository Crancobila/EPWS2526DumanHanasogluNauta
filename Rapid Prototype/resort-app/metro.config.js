// Prefer React Native/browser entry points so axios doesn't pull Node crypto.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ensure package "exports" (including react-native conditions) are respected.
config.resolver.unstable_enablePackageExports = true;

// Prefer react-native/browser over node "main".
config.resolver.resolverMainFields = ["react-native", "browser", "main"];

module.exports = config;
