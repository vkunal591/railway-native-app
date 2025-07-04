const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const { withNativeWind } = require("nativewind/metro");

const baseConfig = getDefaultConfig(__dirname);

const config = mergeConfig(baseConfig, {
  transformer: {
    // Ensure asset support for .css if not present
    assetPlugins: baseConfig.transformer?.assetPlugins || [],
  },
});

module.exports = withNativeWind(config, { input: "./global.css" });
