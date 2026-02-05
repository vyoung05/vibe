import React, { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Badge } from "./Badge";
import type { Streamer } from "../types";

interface StreamerCardProps {
  streamer: Streamer;
  onPress: () => void;
}

export const StreamerCard: React.FC<StreamerCardProps> = ({ streamer, onPress }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Web hover handlers
  const hoverProps = Platform.OS === "web" ? {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  } : {};

  return (
    <Pressable 
      onPress={onPress} 
      className="mb-4"
      style={Platform.OS === "web" ? {
        transform: isHovered ? [{ scale: 1.02 }, { translateY: -4 }] : [{ scale: 1 }, { translateY: 0 }],
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      } : {}}
      {...hoverProps}
    >
      <View 
        className="bg-white/5 rounded-[32px] overflow-hidden"
        style={{
          borderWidth: 1,
          borderColor: isHovered && Platform.OS === "web" ? "rgba(168, 85, 247, 0.4)" : "rgba(255, 255, 255, 0.1)",
          shadowColor: isHovered && Platform.OS === "web" ? "#A855F7" : "#000",
          shadowOffset: { width: 0, height: isHovered ? 12 : 4 },
          shadowOpacity: isHovered && Platform.OS === "web" ? 0.3 : 0.1,
          shadowRadius: isHovered && Platform.OS === "web" ? 24 : 8,
        }}
      >
        {/* Header Image */}
        <View className="relative h-40">
          <Image
            source={{ uri: streamer.headerImages[0] || streamer.avatar }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(10, 10, 15, 0.9)"]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "50%",
            }}
          />
          {streamer.isLive && (
            <View className="absolute top-3 right-3">
              <Badge variant="live">Live</Badge>
            </View>
          )}
        </View>

        {/* Content */}
        <View className="p-4">
          <View className="flex-row items-center mb-2">
            <Image
              source={{ uri: streamer.avatar }}
              style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }}
            />
            <View className="flex-1">
              <Text className="text-white font-black text-lg tracking-tight">{streamer.name}</Text>
              <Text className="text-purple-400 text-sm font-bold">@{streamer.gamertag}</Text>
            </View>
          </View>

          <Text className="text-gray-400 text-sm mb-3" numberOfLines={2}>
            {streamer.bio}
          </Text>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-gray-500 text-xs">{streamer.followerCount.toLocaleString()} followers</Text>
            </View>
            {!streamer.isLive && streamer.lastLiveDate && (
              <Text className="text-gray-600 text-xs">Last live {streamer.lastLiveDate}</Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};
