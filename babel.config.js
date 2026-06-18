module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // react-native-reanimated DEBE ir al último
      'react-native-reanimated/plugin',
    ],
  };
};
