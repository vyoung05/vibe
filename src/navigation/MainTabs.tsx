import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { HomeScreen } from "../screens/HomeScreen";
import { HomeFeedScreen } from "../screens/HomeFeedScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { MusicScreen } from "../screens/MusicScreen";
import { MerchStoreScreen } from "../screens/MerchStoreScreen";
import { BookingsScreen } from "../screens/BookingsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { AdminDashboardScreen } from "../screens/AdminDashboardScreen";
import { MiniMusicPlayer } from "../components/MiniMusicPlayer";
import { useAuthStore } from "../state/authStore";

export type MainTabsParamList = {
  Home: undefined;
  Feed: undefined;
  Search: undefined;
  Music: undefined;
  Merch: undefined;
  Bookings: undefined;
  Admin: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export const MainTabs: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#0A0A0F",
            borderTopColor: "#1F1F2E",
            borderTopWidth: 1,
            height: 85,
            paddingTop: 8,
            paddingBottom: 28,
          },
          tabBarActiveTintColor: "#8B5CF6",
          tabBarInactiveTintColor: "#6B7280",
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
        }}
      >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Feed"
        component={HomeFeedScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Music"
        component={MusicScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="musical-notes" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Merch"
        component={MerchStoreScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shirt" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Admin"
        component={AdminDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark" size={size} color={color} />
          ),
          tabBarActiveTintColor: "#EC4899",
          tabBarButton: isAdmin ? undefined : () => null,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      </Tab.Navigator>
      <MiniMusicPlayer />
    </View>
  );
};
