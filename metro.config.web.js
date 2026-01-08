const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add web-specific configurations
config.resolver.sourceExts.push('web.tsx', 'web.ts', 'web.jsx', 'web.js');

module.exports = config;

