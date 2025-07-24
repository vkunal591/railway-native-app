import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { Text, View } from 'react-native';
import MainNavigation from './src/navigator/MainNavigation';
import { LocationProvider } from './src/context/LocationContextProvider';


export default function App() {
  return (
    <LocationProvider>
      <NavigationContainer>
        <MainNavigation />
      </NavigationContainer>
    </LocationProvider>
  );
}
