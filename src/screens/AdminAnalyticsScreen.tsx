import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAppStore } from "../state/appStore";
import { useAnalyticsStore } from "../state/analyticsStore";
import { streamerAchievements } from "../data/streamerAchievements";
import type { RootStackParamList } from "../navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const AdminAnalyticsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const streamers = useAppStore((s) => s.streamers);
  const getAnalyticsSummary = useAnalyticsStore((s) => s.getAnalyticsSummary);

  const [sortBy, setSortBy] = useState<"followers" | "streams" | "viewers">("followers");

  // Get all streamers with their analytics
  const streamersWithAnalytics = streamers.map((streamer) => ({
    ...streamer,
    analytics: getAnalyticsSummary(streamer.id),
  }));

  // Sort streamers based on selected metric
  const sortedStreamers = [...streamersWithAnalytics].sort((a, b) => {
    switch (sortBy) {
      case "followers":
        return b.followerCount - a.followerCount;
      case "streams":
        return b.analytics.totalStreams - a.analytics.totalStreams;
      case "viewers":
        return b.analytics.peakViewers - a.analytics.peakViewers;
      default:
        return 0;
    }
  });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const getAchievementLevel = (streamer: typeof streamers[0]) => {
    const achievements = streamer.streamerAchievements || [];
    const levels = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
      diamond: 0,
    };

    achievements.forEach((achId) => {
      const ach = streamerAchievements.find((a) => a.id === achId);
      if (ach) {
        levels[ach.level]++;
      }
    });

    // Return highest level with count
    if (levels.diamond > 0) return { level: "Diamond", count: levels.diamond, color: "#B9F2FF" };
    if (levels.platinum > 0) return { level: "Platinum", count: levels.platinum, color: "#E5E4E2" };
    if (levels.gold > 0) return { level: "Gold", count: levels.gold, color: "#FFD700" };
    if (levels.silver > 0) return { level: "Silver", count: levels.silver, color: "#C0C0C0" };
    if (levels.bronze > 0) return { level: "Bronze", count: levels.bronze, color: "#CD7F32" };
    return { level: "None", count: 0, color: "#6B7280" };
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-800 flex-row items-center">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-white text-lg font-bold">All Streamer Analytics</Text>
          <Text className="text-gray-400 text-sm">{streamers.length} streamers</Text>
        </View>
      </View>

      {/* Sort Selector */}
      <View className="px-4 py-4">
        <Text className="text-gray-400 text-sm mb-2">Sort by</Text>
        <View className="flex-row bg-[#151520] rounded-xl p-1">
          {(["followers", "streams", "viewers"] as const).map((sort) => (
            <Pressable
              key={sort}
              onPress={() => setSortBy(sort)}
              className={`flex-1 py-2 rounded-lg ${sortBy === sort ? "bg-purple-600" : ""}`}
            >
              <Text
                className={`text-center font-medium capitalize ${
                  sortBy === sort ? "text-white" : "text-gray-400"
                }`}
              >
                {sort}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="px-4">
        {sortedStreamers.map((streamer, index) => {
          const achievementLevel = getAchievementLevel(streamer);

          return (
            <Pressable
              key={streamer.id}
              onPress={() =>
                navigation.navigate("StreamerAnalytics", { streamerId: streamer.id })
              }
              className="bg-[#151520] rounded-xl p-4 mb-3 border border-gray-800"
            >
              {/* Rank Badge */}
              <View
                className="absolute top-4 right-4 w-8 h-8 rounded-full items-center justify-center"
                style={{
                  backgroundColor:
                    index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : index === 2 ? "#CD7F32" : "#374151",
                }}
              >
                <Text className="text-white font-bold text-sm">#{index + 1}</Text>
              </View>

              {/* Streamer Info */}
              <View className="flex-row items-center mb-3 pr-10">
                <View className="w-12 h-12 rounded-full bg-purple-600 items-center justify-center mr-3">
                  <Text className="text-white font-bold text-lg">
                    {streamer.name[0].toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">{streamer.name}</Text>
                  <Text className="text-gray-400 text-sm">@{streamer.gamertag}</Text>
                </View>
                {streamer.isLive && (
                  <View className="bg-red-600 px-2 py-1 rounded-full">
                    <Text className="text-white text-xs font-bold">LIVE</Text>
                  </View>
                )}
              </View>

              {/* Achievement Level */}
              {achievementLevel.count > 0 && (
                <View className="flex-row items-center mb-3">
                  <View
                    className="px-3 py-1 rounded-full flex-row items-center"
                    style={{ backgroundColor: `${achievementLevel.color}20` }}
                  >
                    <Ionicons name="trophy" size={14} color={achievementLevel.color} />
                    <Text
                      className="text-sm font-bold ml-1"
                      style={{ color: achievementLevel.color }}
                    >
                      {achievementLevel.level} ({achievementLevel.count})
                    </Text>
                  </View>
                </View>
              )}

              {/* Stats Grid */}
              <View className="flex-row flex-wrap gap-3">
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-gray-500 text-xs mb-1">Followers</Text>
                  <Text className="text-white font-bold">
                    {streamer.followerCount.toLocaleString()}
                  </Text>
                </View>
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-gray-500 text-xs mb-1">Total Streams</Text>
                  <Text className="text-white font-bold">{streamer.analytics.totalStreams}</Text>
                </View>
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-gray-500 text-xs mb-1">Peak Viewers</Text>
                  <Text className="text-white font-bold">{streamer.analytics.peakViewers}</Text>
                </View>
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-gray-500 text-xs mb-1">Stream Time</Text>
                  <Text className="text-white font-bold">
                    {formatDuration(streamer.analytics.totalStreamTime)}
                  </Text>
                </View>
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-gray-500 text-xs mb-1">Avg Viewers</Text>
                  <Text className="text-white font-bold">{streamer.analytics.averageViewers}</Text>
                </View>
                <View className="flex-1 min-w-[45%]">
                  <Text className="text-gray-500 text-xs mb-1">Engagement</Text>
                  <Text className="text-white font-bold">
                    {streamer.analytics.engagementRate.toFixed(1)}
                  </Text>
                </View>
              </View>

              {/* View Details Arrow */}
              <View className="mt-3 pt-3 border-t border-gray-800 flex-row items-center justify-between">
                <Text className="text-purple-400 text-sm font-medium">View Full Analytics</Text>
                <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};
