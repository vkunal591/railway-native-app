// src/navigator/MainNavigation.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/authScreens/LoginScreen';
import SplashScreen from '../screens/splashScreens/SplashScreen';
import BottomTabNavigator from './BottomTabNavigator';
import TrackingFormScreen from '../components/common/TrackingFrom';
import LocationPickerScreen from '../screens/otherScreen/LocationPickerScreen';
import ProjectFormScreen from '../screens/otherScreen/ProjectFormScreen';
import TrackingScreen from '../screens/adminScreens/TrackingScreen';
import MapRouteScreen from '../screens/otherScreen/MapRouteScreen';
import UserFormScreen from '../components/common/UserFromScreen';
import ResetPassword from '../screens/authScreens/ResetPassword';

const Stack = createNativeStackNavigator();

const MainNavigation = () => {
  return (
    <Stack.Navigator initialRouteName='SplashScreen' screenOptions={{ headerShown: false }}>
      {/* Splash Always First */}
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="HomeScreen" component={BottomTabNavigator} />
      <Stack.Screen name="TrackingFromScreen" component={TrackingFormScreen} />
      <Stack.Screen name="TrackingScreen" component={TrackingScreen} />
      <Stack.Screen name="MapRouteScreen" component={MapRouteScreen} />
      <Stack.Screen name="ProjectFormScreen" component={ProjectFormScreen} />
      <Stack.Screen name="LocationPicker" component={LocationPickerScreen} />
      <Stack.Screen name="UserFormScreen" component={UserFormScreen} />
      <Stack.Screen name="ResetPasswordScreen" component={ResetPassword} />



    </Stack.Navigator>
  );
};

export default MainNavigation;
