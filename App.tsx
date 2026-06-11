import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';

import TodayScreen from './src/screens/TodayScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AddHabitScreen from './src/screens/AddHabitScreen';
import EditHabitScreen from './src/screens/EditHabitScreen';
import HabitDetailScreen from './src/screens/HabitDetailScreen';
import { colors, fontSize, fontFamily } from './src/theme';
import { requestNotificationPermission } from './src/utils/notificationUtils';
import { useHabitStore } from './src/store/habitStore';

SplashScreen.preventAutoHideAsync();

export type RootStackParamList = {
  MainTabs: undefined;
  AddHabit: undefined;
  EditHabit: { habitId: string };
  HabitDetail: { habitId: string };
};

export type RootTabParamList = {
  Today: undefined;
  Stats: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

type TabIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface TabIconProps {
  name: TabIconName;
  focused: boolean;
}

function TabIcon({ name, focused }: TabIconProps) {
  return (
    <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperActive]}>
      <MaterialCommunityIcons
        name={name}
        size={22}
        color={focused ? colors.tabBarActiveText : colors.tabBarInactiveText}
      />
    </View>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { height: 60 + insets.bottom, paddingBottom: insets.bottom }],
        tabBarActiveTintColor: colors.tabBarActiveText,
        tabBarInactiveTintColor: colors.tabBarInactiveText,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          tabBarLabel: 'Today',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'calendar-check' : 'calendar-check-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'chart-line' : 'chart-line-variant'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'cog' : 'cog-outline'} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      requestNotificationPermission().then((granted) => {
        if (granted) {
          useHabitStore.getState().syncGlobalReminder();
        }
      });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
          <Stack.Screen
            name="AddHabit"
            component={AddHabitScreen}
            options={{ presentation: 'transparentModal', animation: 'none' }}
          />
          <Stack.Screen
            name="EditHabit"
            component={EditHabitScreen}
            options={{ presentation: 'transparentModal', animation: 'none' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: colors.tabBarBorder,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  tabBarLabel: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.semiBold,
    fontWeight: '600',
  },
  tabIconWrapper: {
    paddingVertical: 4,
    borderRadius: 20,
  },
  tabIconWrapperActive: {
    backgroundColor: colors.tabBarActiveBg,
  },
});
