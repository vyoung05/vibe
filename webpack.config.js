const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          '@react-navigation',
          'react-native-reanimated',
          'nativewind',
          'react-native-css-interop',
        ],
      },
    },
    argv
  );

  // Customize the config before returning it.
  return config;
};

