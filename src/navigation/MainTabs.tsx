import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

type TabName = keyof MainTabsParamList;

const TAB_CONFIG: { name: TabName; icon: string; authRequired?: boolean; adminOnly?: boolean }[] = [
  { name: 'Home', icon: 'home' },
  { name: 'Feed', icon: 'albums', authRequired: true },
  { name: 'Search', icon: 'search', authRequired: true },
  { name: 'Music', icon: 'musical-notes' },
  { name: 'Merch', icon: 'shirt' },
  { name: 'Bookings', icon: 'calendar', authRequired: true },
  { name: 'Admin', icon: 'shield-checkmark', adminOnly: true },
  { name: 'Profile', icon: 'person', authRequired: true },
];

const SCREENS: Record<TabName, React.FC> = {
  Home: HomeScreen,
  Feed: HomeFeedScreen,
  Search: SearchScreen,
  Music: MusicScreen,
  Merch: MerchStoreScreen,
  Bookings: BookingsScreen,
  Admin: AdminDashboardScreen,
  Profile: ProfileScreen,
};

export const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAdmin = user?.role === "admin";
  
  const [activeTab, setActiveTab] = useState<TabName>('Home');

  // Filter tabs based on auth state
  const visibleTabs = TAB_CONFIG.filter((tab) => {
    if (tab.adminOnly) return isAdmin;
    if (tab.authRequired) return isAuthenticated;
    return true;
  });

  const ActiveScreen = SCREENS[activeTab];

  return (
    <View style={{ flex: 1, backgroundColor: '#030306' }}>
      {/* Top Navigation Bar */}
      <View 
        style={{ 
          backgroundColor: '#0A0A0F',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.05)',
          paddingTop: insets.top,
        }}
      >
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 8,
          }}
        >
          {visibleTabs.map((tab) => {
            const isFocused = activeTab === tab.name;
            
            return (
              <Pressable
                key={tab.name}
                onPress={() => setActiveTab(tab.name)}
                style={({ hovered }: any) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: isFocused 
                    ? 'rgba(139, 92, 246, 0.15)' 
                    : (Platform.OS === 'web' && hovered ? 'rgba(139, 92, 246, 0.08)' : 'transparent'),
                  borderWidth: 1,
                  borderColor: isFocused 
                    ? 'rgba(139, 92, 246, 0.3)' 
                    : (Platform.OS === 'web' && hovered ? 'rgba(139, 92, 246, 0.15)' : 'transparent'),
                  transform: Platform.OS === 'web' && hovered && !isFocused ? [{ scale: 1.02 }] : [{ scale: 1 }],
                  transition: 'all 0.2s ease',
                })}
              >
                <Ionicons 
                  name={tab.icon as any} 
                  size={18} 
                  color={isFocused ? '#8B5CF6' : '#6B7280'} 
                />
                <Text 
                  style={{ 
                    marginLeft: 8,
                    fontSize: 14,
                    fontWeight: '600',
                    color: isFocused ? '#8B5CF6' : '#6B7280',
                  }}
                >
                  {tab.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Active Screen */}
      <View style={{ flex: 1 }}>
        <ActiveScreen />
      </View>

      {/* Mini Music Player */}
      <MiniMusicPlayer />
    </View>
  );
};
