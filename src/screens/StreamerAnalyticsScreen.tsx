import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAnalyticsStore } from "../state/analyticsStore";
import { useAppStore } from "../state/appStore";
import type { RootStackParamList } from "../navigation/RootNavigator";

type AnalyticsScreenProps = NativeStackScreenProps<RootStackParamList, "StreamerAnalytics">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const StreamerAnalyticsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AnalyticsScreenProps["route"]>();
  const { streamerId } = route.params;

  const streamers = useAppStore((s) => s.streamers);
  const getAnalyticsSummary = useAnalyticsStore((s) => s.getAnalyticsSummary);
  const getDailyStats = useAnalyticsStore((s) => s.getDailyStats);
  const getStreamerAnalytics = useAnalyticsStore((s) => s.getStreamerAnalytics);
  const generateMockAnalytics = useAnalyticsStore((s) => s.generateMockAnalytics);
  const clearStreamerAnalytics = useAnalyticsStore((s) => s.clearStreamerAnalytics);

  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d");

  // Find streamer or create fallback for admin
  let streamer = streamers.find((s) => s.id === streamerId);

  // If no streamer found (e.g., admin user), create a fallback streamer object
  if (!streamer) {
    streamer = {
      id: streamerId,
      name: "Admin Dashboard",
      gamertag: "admin",
      avatar: "https://i.pravatar.cc/300?img=99",
      headerImages: [],
      bio: "Administrator Account",
      isLive: false,
      socialLinks: {},
      schedule: [],
      followerCount: 0,
      referralCode: "ADMIN",
    };
  }

  const summary = getAnalyticsSummary(streamerId);
  const recentStreams = getStreamerAnalytics(streamerId).slice(-10).reverse();
  const dailyStats = getDailyStats(streamerId, timeRange === "7d" ? 7 : 30);

  // Do NOT auto-generate mock data - start with zeros
  // User can click refresh button to generate sample data if needed

  const handleRefresh = () => {
    // Clear existing data and generate new mock data
    clearStreamerAnalytics(streamerId);
    setTimeout(() => {
      generateMockAnalytics(streamerId);
    }, 100);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const StatCard = ({ icon, label, value, trend, color }: any) => (
    <View className="bg-[#151520] rounded-xl p-4 flex-1 border border-gray-800">
      <View className="flex-row items-center mb-2">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: `${color}20` }}
        >
          <Ionicons name={icon} size={20} color={color} />
        </View>
        {trend !== undefined && (
          <View
            className={`px-2 py-1 rounded-full ${
              trend >= 0 ? "bg-green-500/20" : "bg-red-500/20"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                trend >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {trend >= 0 ? "+" : ""}
              {trend}%
            </Text>
          </View>
        )}
      </View>
      <Text className="text-gray-400 text-sm mb-1">{label}</Text>
      <Text className="text-white text-2xl font-bold">{value}</Text>
    </View>
  );

  const SimpleBarChart = ({ data }: { data: number[] }) => {
    const maxValue = Math.max(...data, 1);
    const chartHeight = 100;

    return (
      <View className="flex-row items-end justify-between h-[100px] px-2">
        {data.map((value, index) => {
          const height = (value / maxValue) * chartHeight;
          return (
            <View
              key={index}
              className="flex-1 items-center justify-end mx-0.5"
            >
              <LinearGradient
                colors={["#8B5CF6", "#EC4899"]}
                style={{
                  width: "100%",
                  height: Math.max(height, 2),
                  borderRadius: 4,
                }}
              />
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-800 flex-row items-center">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-white text-lg font-bold">Analytics</Text>
          <Text className="text-gray-400 text-sm">{streamer.name}</Text>
        </View>
        <Pressable
          onPress={handleRefresh}
          className="bg-purple-600/20 px-3 py-2 rounded-lg"
        >
          <Ionicons name="refresh" size={20} color="#8B5CF6" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Time Range Selector */}
        <View className="px-4 py-4">
          <View className="flex-row bg-[#151520] rounded-xl p-1">
            {(["7d", "30d", "all"] as const).map((range) => (
              <Pressable
                key={range}
                onPress={() => setTimeRange(range)}
                className={`flex-1 py-2 rounded-lg ${
                  timeRange === range ? "bg-purple-600" : ""
                }`}
              >
                <Text
                  className={`text-center font-medium ${
                    timeRange === range ? "text-white" : "text-gray-400"
                  }`}
                >
                  {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "All Time"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Overview Stats */}
        <View className="px-4 mb-6">
          <Text className="text-white text-lg font-bold mb-3">Overview</Text>
          <View className="flex-row gap-3 mb-3">
            <StatCard
              icon="people"
              label="Total Followers"
              value={summary.totalFollowers.toLocaleString()}
              trend={summary.followerGrowth > 0 ? Math.round((summary.followerGrowth / summary.totalFollowers) * 100) : 0}
              color="#EC4899"
            />
            <StatCard
              icon="eye"
              label="Avg Viewers"
              value={summary.averageViewers}
              color="#06B6D4"
            />
          </View>
          <View className="flex-row gap-3">
            <StatCard
              icon="flash"
              label="Peak Viewers"
              value={summary.peakViewers}
              color="#F59E0B"
            />
            <StatCard
              icon="chatbubbles"
              label="Total Messages"
              value={summary.totalMessages.toLocaleString()}
              color="#8B5CF6"
            />
          </View>
        </View>

        {/* Engagement Metrics */}
        <View className="px-4 mb-6">
          <Text className="text-white text-lg font-bold mb-3">Performance</Text>
          <View className="bg-[#151520] rounded-xl p-4 border border-gray-800">
            <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-800">
              <View>
                <Text className="text-gray-400 text-sm">Total Streams</Text>
                <Text className="text-white text-2xl font-bold">
                  {summary.totalStreams}
                </Text>
              </View>
              <View>
                <Text className="text-gray-400 text-sm">Stream Time</Text>
                <Text className="text-white text-2xl font-bold">
                  {formatDuration(summary.totalStreamTime)}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-gray-400 text-sm">Avg Duration</Text>
                <Text className="text-white text-xl font-bold">
                  {formatDuration(Math.round(summary.averageStreamDuration))}
                </Text>
              </View>
              <View>
                <Text className="text-gray-400 text-sm">Engagement Rate</Text>
                <Text className="text-white text-xl font-bold">
                  {summary.engagementRate.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Viewer Trend Chart */}
        {dailyStats.length > 0 && (
          <View className="px-4 mb-6">
            <Text className="text-white text-lg font-bold mb-3">Viewer Trend</Text>
            <View className="bg-[#151520] rounded-xl p-4 border border-gray-800">
              <SimpleBarChart data={dailyStats.map((s) => s.views)} />
              <View className="flex-row justify-between mt-3 px-2">
                <Text className="text-gray-500 text-xs">
                  {dailyStats[0]?.date.split("_")[1]}
                </Text>
                <Text className="text-gray-500 text-xs">Today</Text>
              </View>
            </View>
          </View>
        )}

        {/* Messages Chart */}
        {dailyStats.length > 0 && (
          <View className="px-4 mb-6">
            <Text className="text-white text-lg font-bold mb-3">Message Activity</Text>
            <View className="bg-[#151520] rounded-xl p-4 border border-gray-800">
              <SimpleBarChart data={dailyStats.map((s) => s.messages)} />
              <View className="flex-row justify-between mt-3 px-2">
                <Text className="text-gray-500 text-xs">
                  {dailyStats[0]?.date.split("_")[1]}
                </Text>
                <Text className="text-gray-500 text-xs">Today</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Streams */}
        <View className="px-4 mb-6">
          <Text className="text-white text-lg font-bold mb-3">Recent Streams</Text>
          {recentStreams.length === 0 ? (
            <View className="bg-[#151520] rounded-xl p-8 border border-gray-800 items-center">
              <Ionicons name="analytics-outline" size={48} color="#374151" />
              <Text className="text-gray-400 mt-3">No stream data yet</Text>
            </View>
          ) : (
            recentStreams.map((stream) => (
              <View
                key={stream.id}
                className="bg-[#151520] rounded-xl p-4 mb-3 border border-gray-800"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-white font-bold text-base mb-1">
                      {stream.streamTitle}
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      {new Date(stream.startTime).toLocaleDateString()} •{" "}
                      {stream.platform || "Unknown"}
                    </Text>
                  </View>
                  {stream.duration && (
                    <View className="bg-purple-600/20 px-3 py-1 rounded-full">
                      <Text className="text-purple-400 text-sm font-medium">
                        {formatDuration(stream.duration)}
                      </Text>
                    </View>
                  )}
                </View>
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs mb-1">Peak Viewers</Text>
                    <Text className="text-white font-bold">{stream.peakViewers}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs mb-1">Avg Viewers</Text>
                    <Text className="text-white font-bold">{stream.averageViewers}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs mb-1">Messages</Text>
                    <Text className="text-white font-bold">{stream.totalMessages}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs mb-1">New Followers</Text>
                    <Text className="text-white font-bold">{stream.newFollowers}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
