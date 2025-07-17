// src/navigator/MainNavigation.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/authScreens/LoginScreen';
import SplashScreen from '../screens/splashScreens/SplashScreen';
import BottomTabNavigator from './BottomTabNavigator';
import TrackingFormScreen from '../components/common/TrackingFrom';
import LocationPickerScreen from '../screens/otherScreen/LocationPickerScreen';
import ProjectFormScreen from '../screens/otherScreen/ProjectFormScreen';

const Stack = createNativeStackNavigator();

const MainNavigation = () => {
  return (
    <Stack.Navigator initialRouteName='SplashScreen' screenOptions={{ headerShown: false }}>
      {/* Splash Always First */}
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="HomeScreen" component={BottomTabNavigator} />
      <Stack.Screen name="TrackingFromScreen" component={TrackingFormScreen} />
      <Stack.Screen name="ProjectFormScreen" component={ProjectFormScreen} />
      <Stack.Screen name="LocationPicker" component={LocationPickerScreen} />

    </Stack.Navigator>
  );
};

export default MainNavigation;
