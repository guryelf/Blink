import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import DomainScreen from '../screens/DomainScreen';
import ResultScreen from '../screens/ResultScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: '#ffffff' }
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Blink Domains' }} />
      <Stack.Screen name="Domain" component={DomainScreen} options={{ title: 'Select Image' }} />
      <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Analysis Result' }} />
    </Stack.Navigator>
  );
};

export default RootNavigator;
