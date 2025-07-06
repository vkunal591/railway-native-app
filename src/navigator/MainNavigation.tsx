// src/navigator/MainNavigation.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/authScreens/LoginScreen';
import SplashScreen from '../screens/splashScreens/SplashScreen';
import BottomTabNavigator from './BottomTabNavigator';
import ProjectFormScreen from '../components/common/ProjectForm';
import TrackingFormScreen from '../components/common/TrackingFrom';

const Stack = createNativeStackNavigator();

const MainNavigation = () => {
  return (
    <Stack.Navigator initialRouteName='SplashScreen' screenOptions={{ headerShown: false }}>
      {/* Splash Always First */}
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="HomeScreen" component={BottomTabNavigator} />
      <Stack.Screen name="ProjectFormScreen" component={ProjectFormScreen} />
      <Stack.Screen name="TrackingFromScreen" component={TrackingFormScreen} />


    </Stack.Navigator>
  );
};

export default MainNavigation;
