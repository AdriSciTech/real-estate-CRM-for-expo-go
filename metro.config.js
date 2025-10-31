// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .cjs and .mjs files (required for Tamagui)
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs', 'mjs'];

// Tamagui specific configuration
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Reset cache on restart
config.resetCache = true;

module.exports = config;