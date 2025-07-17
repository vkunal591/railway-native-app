module.exports = {
  assets: ['./src/assets/fonts'],
  dependencies: {
    'react-native-reanimated': {
      platforms: {
        android: null, // disables Android auto-linking temporarily
      },
    },
  },
};
