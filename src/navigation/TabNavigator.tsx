import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeStack } from './stacks/HomeStack';
import { PodcastStack } from './stacks/PodcastStack';
import { SearchScreen } from '../screens/search/SearchScreen';
import { LibraryScreen } from '../screens/library/LibraryScreen';
import { MiniPlayer } from '../components/player/MiniPlayer';
import { colors, fontSizes } from '../constants/theme';

const Tab = createBottomTabNavigator();

function TabBarWithPlayer({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{children}</View>
      <MiniPlayer />
    </View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: fontSizes.xs, marginBottom: 4 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, { active: string; inactive: string }> = {
            Home: { active: 'home', inactive: 'home-outline' },
            Search: { active: 'search', inactive: 'search-outline' },
            Library: { active: 'library', inactive: 'library-outline' },
            Podcasts: { active: 'headset', inactive: 'headset-outline' },
          };
          const name = icons[route.name];
          return <Ionicons name={(focused ? name?.active : name?.inactive) as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: 'Inicio' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Buscar' }} />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ tabBarLabel: 'Biblioteca' }} />
      <Tab.Screen name="Podcasts" component={PodcastStack} options={{ tabBarLabel: 'Podcasts' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBar,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingTop: 6,
  },
});
