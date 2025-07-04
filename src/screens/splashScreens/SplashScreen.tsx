import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

const SplashScreen = ({ navigation }: any) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Home'); // or your next screen
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/animations/train.gif')}
        style={styles.gif}
        resizeMode="contain"
      />
      <Text style={styles.title}>Railway Tracking System</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gif: {
    width: 250,
    height: 250,
    borderRadius: 20
  },
  title: {
    color: 'skyblue',
    fontSize: 22,
    marginTop: 20,
    fontWeight: 'bold',
  },
});

export default SplashScreen;
