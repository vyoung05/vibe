module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      function importMetaEnv() {
        return {
          visitor: {
            MemberExpression(path) {
              const { node } = path;
              if (
                node.object &&
                node.object.type === 'MetaProperty' &&
                node.object.meta &&
                node.object.meta.name === 'import' &&
                node.object.property &&
                node.object.property.name === 'meta' &&
                node.property &&
                node.property.name === 'env'
              ) {
                path.replaceWithSourceString('process.env');
              }
            },
          },
        };
      },
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
          },
        },
      ],
    ],
  };
};
