import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';

import TodayScreen from './src/screens/TodayScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { colors, fontSize } from './src/theme';

export type RootTabParamList = {
  Today: undefined;
  Stats: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarLabelStyle: {
              fontSize: fontSize.sm,
              fontWeight: '600',
            },
          }}
        >
          <Tab.Screen
            name="Today"
            component={TodayScreen}
            options={{
              tabBarLabel: 'Today',
              tabBarIcon: ({ color }) => (
                <Text style={{ color, fontSize: fontSize.lg }}>☀️</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Stats"
            component={StatsScreen}
            options={{
              tabBarLabel: 'Stats',
              tabBarIcon: ({ color }) => (
                <Text style={{ color, fontSize: fontSize.lg }}>📊</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarLabel: 'Settings',
              tabBarIcon: ({ color }) => (
                <Text style={{ color, fontSize: fontSize.lg }}>⚙️</Text>
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
