import React from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAppStore } from "../state/appStore";
import { StreamerCard } from "../components/StreamerCard";
import { Badge } from "../components/Badge";
import { AnnouncementTicker } from "../components/AnnouncementTicker";
import { StreamerControls } from "../components/StreamerControls";
import type { MainTabsParamList } from "../navigation/MainTabs";
import type { RootStackParamList } from "../navigation/RootNavigator";

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabsParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const streamers = useAppStore((s) => s.streamers);

  const liveStreamers = streamers.filter((s) => s.isLive);
  const offlineStreamers = streamers.filter((s) => !s.isLive);

  return (
    <View className="flex-1 bg-[#050508]">
      <LinearGradient
        colors={["#0A0A15", "#050508"]}
        className="flex-1"
      >
        {/* Announcement Ticker */}
        <View style={{ paddingTop: insets.top }}>
          <AnnouncementTicker />
        </View>

        {/* Streamer Controls */}
        <StreamerControls />

        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="px-6 py-8">
            <Text className="text-white text-3xl font-black tracking-tighter">DDNS</Text>
            <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Day Dreamers Night Streamers</Text>
          </View>

          {/* Live Section */}
          {liveStreamers.length > 0 && (
            <View className="mb-6">
              <View className="px-6 mb-4 flex-row items-center">
                <Badge variant="live">Live Now</Badge>
                <Text className="text-white text-xl font-bold ml-3">
                  {liveStreamers.length} {liveStreamers.length === 1 ? "Streamer" : "Streamers"}
                </Text>
              </View>

              {liveStreamers.map((streamer) => (
                <View key={streamer.id} className="mb-4 px-6">
                  <Pressable
                    onPress={() => navigation.navigate("StreamerProfile", { streamerId: streamer.id })}
                    className="bg-white/5 rounded-[32px] overflow-hidden border border-white/10"
                  >
                    {/* Live Stream Hero */}
                    <View className="relative h-64">
                      <Image
                        source={{ uri: streamer.headerImages[0] || streamer.avatar }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                      <LinearGradient
                        colors={["transparent", "rgba(10, 10, 15, 0.95)"]}
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: "60%",
                        }}
                      />
                      <View className="absolute top-4 right-4">
                        <Badge variant="live">
                          <View className="flex-row items-center">
                            <View className="w-2 h-2 rounded-full bg-white mr-2" />
                            <Text className="text-white text-xs font-bold uppercase">Live</Text>
                          </View>
                        </Badge>
                      </View>

                      {/* Stream Info Overlay */}
                      <View className="absolute bottom-0 left-0 right-0 p-6">
                        <View className="flex-row items-center mb-3">
                          <Image
                            source={{ uri: streamer.avatar }}
                            style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: "#EC4899" }}
                          />
                          <View className="flex-1 ml-4">
                            <Text className="text-white font-bold text-xl">{streamer.name}</Text>
                            <Text className="text-purple-400 text-sm">@{streamer.gamertag}</Text>
                          </View>
                        </View>
                        {streamer.liveTitle && (
                          <Text className="text-white text-base mb-2">{streamer.liveTitle}</Text>
                        )}
                        <View className="flex-row items-center">
                          <Ionicons name="eye" size={16} color="#9CA3AF" />
                          <Text className="text-gray-400 text-sm ml-2">
                            {streamer.followerCount.toLocaleString()} watching
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="p-4 flex-row gap-3">
                      <Pressable
                        onPress={async (e) => {
                          e.stopPropagation();
                          if (streamer.liveStreamUrl) {
                            try {
                              await WebBrowser.openBrowserAsync(streamer.liveStreamUrl);
                            } catch (error) {
                              Alert.alert("Error", "Could not open the stream URL");
                            }
                          } else {
                            navigation.navigate("StreamerProfile", { streamerId: streamer.id });
                          }
                        }}
                        className="flex-1 bg-pink-500 rounded-xl py-3"
                      >
                        <Text className="text-white text-center font-bold">Watch Live</Text>
                      </Pressable>
                      <View className="bg-purple-500/20 rounded-xl px-4 py-3">
                        <Ionicons name="share-social" size={20} color="#8B5CF6" />
                      </View>
                    </View>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Streamers Grid */}
          <View className="px-6">
            <Text className="text-white text-2xl font-bold mb-4">
              {liveStreamers.length > 0 ? "All Streamers" : "Our Streamers"}
            </Text>

            {offlineStreamers.map((streamer) => (
              <StreamerCard
                key={streamer.id}
                streamer={streamer}
                onPress={() => navigation.navigate("StreamerProfile", { streamerId: streamer.id })}
              />
            ))}

            {streamers.length === 0 && (
              <View className="items-center justify-center py-12">
                <Ionicons name="people-outline" size={64} color="#374151" />
                <Text className="text-gray-400 text-center mt-4">No streamers yet</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};
