import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TabNavigator } from './TabNavigator';
import { FullPlayerScreen } from '../screens/player/FullPlayerScreen';

const Stack = createStackNavigator();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="FullPlayer"
        component={FullPlayerScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
