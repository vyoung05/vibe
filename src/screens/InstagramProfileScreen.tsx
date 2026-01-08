import React from "react";
import { View, Text, Image, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { mockPosts } from "../data/mockPosts";

export function InstagramProfileScreen() {
  // Mock user data - in real app, get from auth store
  const user = {
    id: "user1",
    username: "alexgaming",
    avatarUrl: "https://i.pravatar.cc/150?img=11",
    bio: "Pro gamer | Content creator\n🎮 Diamond rank | 🏆 Tournament winner",
    postsCount: 15,
    followersCount: 3420,
    followingCount: 567,
  };

  // Get user's posts
  const userPosts = mockPosts.filter((post) => post.user.id === user.id);

  const StatItem = ({ label, value }: { label: string; value: number }) => (
    <View className="items-center">
      <Text className="text-white text-lg font-bold">
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
      </Text>
      <Text className="text-gray-400 text-sm">{label}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#050509]" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-white text-xl font-semibold">
            {user.username}
          </Text>
          <View className="flex-row">
            <Pressable className="mr-4">
              <Ionicons name="add-circle-outline" size={26} color="#FFFFFF" />
            </Pressable>
            <Pressable>
              <Ionicons name="menu-outline" size={26} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* Profile Info */}
        <View className="px-4 py-4">
          <View className="flex-row items-center mb-4">
            <Image
              source={{ uri: user.avatarUrl }}
              className="w-20 h-20 rounded-full"
            />
            <View className="flex-1 flex-row justify-around ml-6">
              <StatItem label="Posts" value={user.postsCount} />
              <StatItem label="Followers" value={user.followersCount} />
              <StatItem label="Following" value={user.followingCount} />
            </View>
          </View>

          {/* Bio */}
          <Text className="text-white text-sm mb-4">{user.bio}</Text>

          {/* Action Buttons */}
          <View className="flex-row">
            <Pressable className="flex-1 bg-[#1A1A1F] py-2 rounded-lg mr-2">
              <Text className="text-white text-center font-semibold">
                Edit Profile
              </Text>
            </Pressable>
            <Pressable className="flex-1 bg-[#1A1A1F] py-2 rounded-lg ml-2">
              <Text className="text-white text-center font-semibold">
                Share Profile
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row border-t border-gray-800">
          <Pressable className="flex-1 items-center py-3 border-b-2 border-white">
            <Ionicons name="grid-outline" size={24} color="#FFFFFF" />
          </Pressable>
          <Pressable className="flex-1 items-center py-3">
            <Ionicons name="videocam-outline" size={24} color="#6B7280" />
          </Pressable>
          <Pressable className="flex-1 items-center py-3">
            <Ionicons name="person-outline" size={24} color="#6B7280" />
          </Pressable>
        </View>

        {/* Posts Grid */}
        <View className="flex-row flex-wrap">
          {userPosts.map((post, index) => (
            <View
              key={post.id}
              className="w-1/3 aspect-square border border-[#050509]"
            >
              <Image
                source={{ uri: post.imageUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
