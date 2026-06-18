import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PodcastsScreen } from '../../screens/podcasts/PodcastsScreen';
import { PodcastDetailScreen } from '../../screens/podcasts/PodcastDetailScreen';

const Stack = createStackNavigator();

export function PodcastStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PodcastsMain" component={PodcastsScreen} />
      <Stack.Screen name="PodcastDetail" component={PodcastDetailScreen} />
    </Stack.Navigator>
  );
}
