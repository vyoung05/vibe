import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../state/authStore";
import { useAppStore } from "../state/appStore";
import type { User } from "../types";
import { PageContainer } from "../components/PageContainer";
import * as Haptics from "expo-haptics";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const DiscoverPeopleScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const streamers = useAppStore((s) => s.streamers);
  const getSuggestedUsers = useAppStore((s) => s.getSuggestedUsers);
  const followUser = useAppStore((s) => s.followUser);
  const followStreamer = useAppStore((s) => s.followStreamer);

  const [searchQuery, setSearchQuery] = useState("");
  const [followedIds, setFollowedIds] = useState<string[]>([]);

  if (!user) return null;

  const suggestedUsers = getSuggestedUsers(user.id, user.followingUsers || []);

  // Filter streamers not already followed
  const suggestedStreamers = streamers.filter(
    (s) => !user.followedStreamers?.includes(s.id)
  );

  const handleFollowUser = (targetUser: User) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    followUser(user.id, targetUser.id);
    setFollowedIds((prev) => [...prev, targetUser.id]);
    // Sync to authStore for real-time profile updates
    const currentFollowingUsers = user.followingUsers || [];
    updateUser({ followingUsers: [...currentFollowingUsers, targetUser.id] });
  };

  const handleFollowStreamer = (streamerId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    followStreamer(user.id, streamerId);
    setFollowedIds((prev) => [...prev, streamerId]);
    // Sync to authStore for real-time profile updates
    const currentFollowedStreamers = user.followedStreamers || [];
    updateUser({ followedStreamers: [...currentFollowedStreamers, streamerId] });
  };

  const handleContinue = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateUser({ hasCompletedOnboarding: true });
    navigation.reset({
      index: 0,
      routes: [{ name: "MainTabs" }],
    });
  };

  const handleSkip = () => {
    updateUser({ hasCompletedOnboarding: true });
    navigation.reset({
      index: 0,
      routes: [{ name: "MainTabs" }],
    });
  };

  const filteredStreamers = suggestedStreamers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.gamertag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = suggestedUsers.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      <PageContainer>
        {/* Header */}
        <View className="px-6 py-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-2xl font-bold">Discover People</Text>
              <Text className="text-gray-400 text-sm mt-1">
                Follow people to see their content
              </Text>
            </View>
            <Pressable onPress={handleSkip}>
              <Text className="text-gray-400 font-medium">Skip</Text>
            </Pressable>
          </View>
        </View>

        {/* Search */}
        <View className="px-6 mb-4">
          <View className="flex-row items-center bg-[#1C1C24] rounded-xl px-4 py-3">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              placeholder="Search people..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-white ml-3"
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Streamers Section */}
          {filteredStreamers.length > 0 && (
            <View className="mb-6">
              <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-6 mb-3">
                Streamers to Follow
              </Text>
              {filteredStreamers.map((streamer) => {
                const isFollowed = followedIds.includes(streamer.id);
                return (
                  <Pressable
                    key={streamer.id}
                    className="flex-row items-center px-6 py-3"
                  >
                    <Pressable
                      onPress={() =>
                        navigation.navigate("StreamerProfile", { streamerId: streamer.id })
                      }
                      className="flex-row items-center flex-1"
                    >
                      <View className="relative">
                        <Image
                          source={{ uri: streamer.avatar }}
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            borderWidth: 2,
                            borderColor: streamer.isLive ? "#EC4899" : "#374151",
                          }}
                          contentFit="cover"
                        />
                        {streamer.isLive && (
                          <View className="absolute -bottom-1 -right-1 bg-pink-500 rounded-full px-1.5 py-0.5">
                            <Text className="text-white text-[10px] font-bold">LIVE</Text>
                          </View>
                        )}
                      </View>
                      <View className="flex-1 ml-3">
                        <View className="flex-row items-center">
                          <Text className="text-white font-semibold">{streamer.name}</Text>
                        </View>
                        <Text className="text-gray-400 text-sm">@{streamer.gamertag}</Text>
                        <Text className="text-gray-500 text-xs">
                          {streamer.followerCount.toLocaleString()} followers
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => handleFollowStreamer(streamer.id)}
                      disabled={isFollowed}
                      className={`px-5 py-2 rounded-lg ${isFollowed ? "bg-[#1C1C24]" : "bg-purple-600"
                        }`}
                    >
                      <Text
                        className={`font-semibold ${isFollowed ? "text-gray-400" : "text-white"
                          }`}
                      >
                        {isFollowed ? "Following" : "Follow"}
                      </Text>
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Users Section */}
          {filteredUsers.length > 0 && (
            <View className="mb-6">
              <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-6 mb-3">
                People You May Know
              </Text>
              {filteredUsers.map((targetUser) => {
                const isFollowed = followedIds.includes(targetUser.id);
                return (
                  <View
                    key={targetUser.id}
                    className="flex-row items-center px-6 py-3"
                  >
                    <View className="relative">
                      {targetUser.avatar ? (
                        <Image
                          source={{ uri: targetUser.avatar }}
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            borderWidth: 2,
                            borderColor: targetUser.isVerified ? "#A855F7" : "#374151",
                          }}
                          contentFit="cover"
                        />
                      ) : (
                        <View
                          className="w-14 h-14 rounded-full items-center justify-center"
                          style={{
                            backgroundColor: "#1C1C24",
                            borderWidth: 2,
                            borderColor: targetUser.isVerified ? "#A855F7" : "#374151",
                          }}
                        >
                          <Text className="text-white text-xl font-bold">
                            {targetUser.username.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      {targetUser.isInfluencer && (
                        <View className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1">
                          <Ionicons name="star" size={10} color="white" />
                        </View>
                      )}
                    </View>
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center">
                        <Text className="text-white font-semibold">
                          {targetUser.username}
                        </Text>
                        {targetUser.isVerified && (
                          <View className="ml-1.5 bg-purple-500 rounded-full p-0.5">
                            <Ionicons name="checkmark" size={10} color="white" />
                          </View>
                        )}
                        {targetUser.isInfluencer && (
                          <View className="ml-1.5 bg-amber-500/20 rounded-full px-2 py-0.5">
                            <Text className="text-amber-400 text-[10px] font-bold">
                              INFLUENCER
                            </Text>
                          </View>
                        )}
                      </View>
                      {targetUser.bio && (
                        <Text className="text-gray-400 text-sm" numberOfLines={1}>
                          {targetUser.bio}
                        </Text>
                      )}
                      <Text className="text-gray-500 text-xs">
                        {(targetUser.followers?.length || 0).toLocaleString()} followers
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleFollowUser(targetUser)}
                      disabled={isFollowed}
                      className={`px-5 py-2 rounded-lg ${isFollowed ? "bg-[#1C1C24]" : "bg-purple-600"
                        }`}
                    >
                      <Text
                        className={`font-semibold ${isFollowed ? "text-gray-400" : "text-white"
                          }`}
                      >
                        {isFollowed ? "Following" : "Follow"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

          {/* Empty State */}
          {filteredStreamers.length === 0 && filteredUsers.length === 0 && (
            <View className="items-center py-12 px-6">
              <View className="w-20 h-20 rounded-full bg-[#1C1C24] items-center justify-center mb-4">
                <Ionicons name="people-outline" size={40} color="#6B7280" />
              </View>
              <Text className="text-white text-lg font-semibold mb-2">
                No results found
              </Text>
              <Text className="text-gray-400 text-center">
                Try a different search term or check back later for new people to follow
              </Text>
            </View>
          )}

          {/* Bottom Padding */}
          <View className="h-32" />
        </ScrollView>
      </PageContainer>

      {/* Continue Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-[#0A0A0F] border-t border-gray-800 items-center">
        <View className="px-6 py-4 w-full max-w-[800px]">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-400 text-sm">
              {followedIds.length} people followed
            </Text>
            {followedIds.length >= 3 && (
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text className="text-green-500 text-sm ml-1">Great start!</Text>
              </View>
            )}
          </View>
          <Pressable
            onPress={handleContinue}
            className="bg-purple-600 py-4 rounded-xl"
          >
            <Text className="text-white text-center font-bold text-base">
              Continue to DDNS
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};
