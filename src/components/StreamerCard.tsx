import React from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Badge } from "./Badge";
import type { Streamer } from "../types";

interface StreamerCardProps {
  streamer: Streamer;
  onPress: () => void;
}

export const StreamerCard: React.FC<StreamerCardProps> = ({ streamer, onPress }) => {
  return (
    <Pressable onPress={onPress} className="mb-4">
      <View className="bg-[#151520] rounded-2xl overflow-hidden border border-gray-800">
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
              <Text className="text-white font-bold text-lg">{streamer.name}</Text>
              <Text className="text-purple-400 text-sm">@{streamer.gamertag}</Text>
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
