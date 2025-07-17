import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Fetch, TokenStorage } from '../../utils/apiUtils';
import { ImagePath } from '../../constants/ImagePath';

const SplashScreen = ({ navigation }: any) => {
  useEffect(() => {
    const checkUser = async () => {
      try {
        const token = await TokenStorage.getToken();
        console.log(token)
        if (!token) {
          navigation.replace('LoginScreen');
          return;
        }

        // Call your "get my user" API
        const response: any = await Fetch('/api/auth/get-current-user');

        const result = response.data
        console.log(result, "dfdsfd")
        if (response.success) {
          // Optionally store user data again
          TokenStorage.setUserData(result);
          navigation.navigate('HomeScreen'); // Go to main app
        } else {
          TokenStorage.removeToken();
          navigation.navigate('LoginScreen');
        }
      } catch (error) {
        console.log('Error fetching user:', error);
        TokenStorage.removeToken();
        navigation.navigate('LoginScreen');
      }
    };

    checkUser();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={ImagePath.location2}
        style={styles.gif}
        resizeMode="contain"
      />
      <Text style={styles.title}>U-Track</Text>
      <ActivityIndicator size="large" color="skyblue" style={{ marginTop: 20 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#004080',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gif: {
    width: 80,
    height: 120,
    borderRadius: 20,
    tintColor:"#fff"
  },
  title: {
    color: 'white',
    fontSize: 40,
    marginTop: 20,
    fontWeight: 'bold',
  },
});

export default SplashScreen;
