import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { Text, View } from 'react-native';
import MainNavigation from './src/navigator/MainNavigation';


export default function App() {
  return (
    <NavigationContainer>
      <MainNavigation />  
    </NavigationContainer>
  );
}
