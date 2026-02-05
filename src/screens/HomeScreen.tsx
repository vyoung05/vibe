import React from "react";
import { View, Text, ScrollView, Pressable, Alert, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "../state/authStore";
import { useAppStore } from "../state/appStore";
import { Badge } from "../components/Badge";
import { AnnouncementTicker } from "../components/AnnouncementTicker";
import { StreamerControls } from "../components/StreamerControls";
import { PageContainer } from "../components/PageContainer";
import type { MainTabsParamList } from "../navigation/MainTabs";
import type { RootStackParamList } from "../navigation/RootNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const streamers = useAppStore((s) => s.streamers);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const liveStreamers = streamers.filter((s) => s.isLive);
  const offlineStreamers = streamers.filter((s) => !s.isLive);
  const featuredStreamers = streamers.slice(0, 3);

  return (
    <View className="flex-1 bg-[#030306]">
      {/* Background Gradient Orbs */}
      <View className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden">
        <View 
          className="absolute w-96 h-96 rounded-full opacity-20"
          style={{
            top: -100,
            left: -100,
            backgroundColor: '#8B5CF6',
            transform: [{ scale: 1.5 }],
            shadowColor: '#8B5CF6',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 100,
          }}
        />
        <View 
          className="absolute w-80 h-80 rounded-full opacity-15"
          style={{
            top: 200,
            right: -150,
            backgroundColor: '#EC4899',
            transform: [{ scale: 1.5 }],
          }}
        />
      </View>

      {/* Announcement Ticker */}
      <View style={{ paddingTop: insets.top }}>
        <AnnouncementTicker />
      </View>

      {/* Streamer Controls */}
      <StreamerControls />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <PageContainer>
          {/* Hero Header */}
          <View className="px-6 pt-8 pb-6">
            <View className="flex-row items-center justify-between">
              {/* Logo & Tagline */}
              <View>
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center mr-3">
                    <Text className="text-white text-xl font-black">D</Text>
                  </View>
                  <Text className="text-white text-3xl font-black tracking-tight">DDNS</Text>
                </View>
                <Text className="text-gray-500 text-xs font-medium tracking-wide mt-2 ml-1">
                  Day Dreamers Night Streamers
                </Text>
              </View>

              {/* Auth Buttons */}
              {!isAuthenticated && (
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => navigation.navigate("SignIn")}
                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10"
                  >
                    <Text className="text-white text-sm font-semibold">Sign In</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => navigation.navigate("SignUp")}
                    className="px-4 py-2.5 rounded-xl overflow-hidden"
                    style={{ backgroundColor: '#8B5CF6' }}
                  >
                    <Text className="text-white text-sm font-semibold">Join Free</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Welcome Banner for Guests */}
            {!isAuthenticated && (
              <View className="mt-6 rounded-2xl overflow-hidden">
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.15)', 'rgba(236, 72, 153, 0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="p-5 border border-purple-500/20 rounded-2xl"
                >
                  <Text className="text-white text-lg font-bold mb-1">
                    Welcome to the Stream 🎮
                  </Text>
                  <Text className="text-gray-400 text-sm leading-5">
                    Join our community of creators and fans. Watch streams, discover music, and grab exclusive merch.
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* Live Now Section */}
          {liveStreamers.length > 0 && (
            <View className="mb-8">
              <View className="px-6 mb-4 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
                  <Text className="text-white text-xl font-bold">Live Now</Text>
                </View>
                <Badge variant="live">
                  {liveStreamers.length} {liveStreamers.length === 1 ? "Stream" : "Streams"}
                </Badge>
              </View>

              {liveStreamers.map((streamer) => (
                <View key={streamer.id} className="mb-4 px-6">
                  <Pressable
                    onPress={() => navigation.navigate("StreamerProfile", { streamerId: streamer.id })}
                    className="rounded-3xl overflow-hidden"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                  >
                    {/* Live Stream Hero */}
                    <View className="relative h-56">
                      <Image
                        source={{ uri: streamer.headerImages[0] || streamer.avatar }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                      <LinearGradient
                        colors={["transparent", "rgba(3, 3, 6, 0.98)"]}
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: "70%",
                        }}
                      />
                      
                      {/* Live Badge */}
                      <View className="absolute top-4 left-4 flex-row items-center bg-red-500 rounded-lg px-3 py-1.5">
                        <View className="w-2 h-2 rounded-full bg-white mr-2" />
                        <Text className="text-white text-xs font-bold">LIVE</Text>
                      </View>

                      {/* Viewer Count */}
                      <View className="absolute top-4 right-4 flex-row items-center bg-black/50 rounded-lg px-3 py-1.5">
                        <Ionicons name="eye" size={14} color="#fff" />
                        <Text className="text-white text-xs font-medium ml-1.5">
                          {streamer.followerCount.toLocaleString()}
                        </Text>
                      </View>

                      {/* Stream Info */}
                      <View className="absolute bottom-0 left-0 right-0 p-5">
                        <View className="flex-row items-center">
                          <Image
                            source={{ uri: streamer.avatar }}
                            style={{ 
                              width: 48, 
                              height: 48, 
                              borderRadius: 24, 
                              borderWidth: 2, 
                              borderColor: '#EC4899' 
                            }}
                          />
                          <View className="flex-1 ml-3">
                            <Text className="text-white font-bold text-lg">{streamer.name}</Text>
                            <Text className="text-purple-400 text-sm">@{streamer.gamertag}</Text>
                          </View>
                          <Pressable
                            onPress={async (e) => {
                              e.stopPropagation();
                              if (streamer.liveStreamUrl) {
                                try {
                                  await WebBrowser.openBrowserAsync(streamer.liveStreamUrl);
                                } catch (error) {
                                  Alert.alert("Error", "Could not open the stream URL");
                                }
                              }
                            }}
                            className="bg-pink-500 rounded-xl px-5 py-2.5"
                          >
                            <Text className="text-white font-bold text-sm">Watch</Text>
                          </Pressable>
                        </View>
                        {streamer.liveTitle && (
                          <Text className="text-gray-300 text-sm mt-3" numberOfLines={1}>
                            {streamer.liveTitle}
                          </Text>
                        )}
                      </View>
                    </View>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Featured Streamers - Horizontal Scroll */}
          {featuredStreamers.length > 0 && (
            <View className="mb-8">
              <View className="px-6 mb-4 flex-row items-center justify-between">
                <Text className="text-white text-xl font-bold">Featured Creators</Text>
                <Pressable className="flex-row items-center">
                  <Text className="text-purple-400 text-sm font-medium mr-1">See All</Text>
                  <Ionicons name="chevron-forward" size={16} color="#A78BFA" />
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
              >
                {featuredStreamers.map((streamer, index) => (
                  <Pressable
                    key={streamer.id}
                    onPress={() => navigation.navigate("StreamerProfile", { streamerId: streamer.id })}
                    style={{ width: SCREEN_WIDTH * 0.7, maxWidth: 300 }}
                  >
                    <View className="rounded-2xl overflow-hidden border border-white/5"
                      style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      {/* Card Image */}
                      <View className="relative h-36">
                        <Image
                          source={{ uri: streamer.headerImages[0] || streamer.avatar }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                        <LinearGradient
                          colors={["transparent", "rgba(3, 3, 6, 0.95)"]}
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: "60%",
                          }}
                        />
                        {/* Rank Badge */}
                        <View 
                          className="absolute top-3 left-3 w-7 h-7 rounded-lg items-center justify-center"
                          style={{ backgroundColor: index === 0 ? '#F59E0B' : index === 1 ? '#9CA3AF' : '#CD7F32' }}
                        >
                          <Text className="text-white text-xs font-bold">#{index + 1}</Text>
                        </View>
                      </View>

                      {/* Card Content */}
                      <View className="p-4">
                        <View className="flex-row items-center">
                          <Image
                            source={{ uri: streamer.avatar }}
                            style={{ 
                              width: 40, 
                              height: 40, 
                              borderRadius: 20,
                              borderWidth: 2,
                              borderColor: 'rgba(139, 92, 246, 0.5)'
                            }}
                          />
                          <View className="flex-1 ml-3">
                            <Text className="text-white font-bold text-base">{streamer.name}</Text>
                            <Text className="text-gray-500 text-xs">
                              {streamer.followerCount.toLocaleString()} followers
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* All Streamers Grid */}
          <View className="px-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-bold">
                {liveStreamers.length > 0 ? "All Creators" : "Our Creators"}
              </Text>
              <View className="flex-row items-center bg-white/5 rounded-lg px-3 py-1.5">
                <Ionicons name="people" size={14} color="#6B7280" />
                <Text className="text-gray-400 text-xs font-medium ml-1.5">
                  {streamers.length} total
                </Text>
              </View>
            </View>

            {/* Streamer Cards - Improved Design */}
            {offlineStreamers.map((streamer) => (
              <Pressable 
                key={streamer.id} 
                onPress={() => navigation.navigate("StreamerProfile", { streamerId: streamer.id })}
                className="mb-4"
              >
                <View 
                  className="rounded-2xl overflow-hidden border border-white/5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                >
                  {/* Header Image */}
                  <View className="relative h-32">
                    <Image
                      source={{ uri: streamer.headerImages[0] || streamer.avatar }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(3, 3, 6, 0.95)"]}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: "70%",
                      }}
                    />
                    {streamer.isLive && (
                      <View className="absolute top-3 right-3">
                        <Badge variant="live">Live</Badge>
                      </View>
                    )}
                  </View>

                  {/* Content */}
                  <View className="p-4 -mt-8 relative z-10">
                    <View className="flex-row items-end">
                      <View className="relative">
                        <Image
                          source={{ uri: streamer.avatar }}
                          style={{ 
                            width: 56, 
                            height: 56, 
                            borderRadius: 16,
                            borderWidth: 3,
                            borderColor: '#030306'
                          }}
                        />
                        {streamer.isVerified && (
                          <View className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-purple-500 items-center justify-center border-2 border-[#030306]">
                            <Ionicons name="checkmark" size={10} color="#fff" />
                          </View>
                        )}
                      </View>
                      <View className="flex-1 ml-3 pb-1">
                        <Text className="text-white font-bold text-lg">{streamer.name}</Text>
                        <Text className="text-purple-400 text-sm">@{streamer.gamertag}</Text>
                      </View>
                    </View>

                    <Text className="text-gray-400 text-sm mt-3 leading-5" numberOfLines={2}>
                      {streamer.bio}
                    </Text>

                    <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-white/5">
                      <View className="flex-row items-center">
                        <Ionicons name="people-outline" size={14} color="#6B7280" />
                        <Text className="text-gray-500 text-xs ml-1.5">
                          {streamer.followerCount.toLocaleString()} followers
                        </Text>
                      </View>
                      {streamer.lastLiveDate && (
                        <View className="flex-row items-center">
                          <Ionicons name="time-outline" size={14} color="#6B7280" />
                          <Text className="text-gray-600 text-xs ml-1.5">
                            Last live {streamer.lastLiveDate}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}

            {streamers.length === 0 && (
              <View className="items-center justify-center py-16">
                <View className="w-20 h-20 rounded-full bg-white/5 items-center justify-center mb-4">
                  <Ionicons name="people-outline" size={40} color="#374151" />
                </View>
                <Text className="text-gray-400 text-center text-lg font-medium">No streamers yet</Text>
                <Text className="text-gray-600 text-center text-sm mt-1">Check back soon!</Text>
              </View>
            )}
          </View>

          {/* Bottom CTA for Guests */}
          {!isAuthenticated && (
            <View className="px-6 mt-8">
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.2)', 'rgba(236, 72, 153, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-2xl p-6 border border-purple-500/20"
              >
                <Text className="text-white text-xl font-bold mb-2">
                  Ready to Join? 🚀
                </Text>
                <Text className="text-gray-400 text-sm mb-4">
                  Create your account and become part of the DDNS community.
                </Text>
                <Pressable
                  onPress={() => navigation.navigate("SignUp")}
                  className="bg-purple-500 rounded-xl py-3.5 items-center"
                >
                  <Text className="text-white font-bold">Create Free Account</Text>
                </Pressable>
              </LinearGradient>
            </View>
          )}
        </PageContainer>
      </ScrollView>
    </View>
  );
};
