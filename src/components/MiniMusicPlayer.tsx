import React, { useEffect } from "react";
import { View, Text, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useMusicStore } from "../state/musicStore";
import { useAppStore } from "../state/appStore";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { MainTabsParamList } from "../navigation/MainTabs";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type NavigationProp = BottomTabNavigationProp<MainTabsParamList>;

export const MiniMusicPlayer: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const position = useMusicStore((s) => s.position);
  const duration = useMusicStore((s) => s.duration);
  const pauseTrack = useMusicStore((s) => s.pauseTrack);
  const resumeTrack = useMusicStore((s) => s.resumeTrack);
  const skipNext = useMusicStore((s) => s.skipNext);

  const artists = useAppStore((s) => s.artists);
  const artist = currentTrack ? artists.find((a) => a.id === currentTrack.artistId) : null;

  // Spinning animation for album art
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 10000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!currentTrack) return null;

  const progress = duration > 0 ? position / duration : 0;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      resumeTrack();
    }
  };

  return (
    <Pressable
      onPress={() => navigation.navigate("Music")}
      className="absolute bottom-20 left-0 right-0 bg-[#1C1C24] border-t border-gray-800"
      style={{ height: 80 }}
    >
      {/* Progress bar */}
      <View className="absolute top-0 left-0 right-0 h-0.5 bg-gray-800">
        <View
          className="h-full bg-purple-500"
          style={{ width: `${progress * 100}%` }}
        />
      </View>

      <View className="flex-1 flex-row items-center px-4">
        {/* Album Art with spinning animation */}
        <Animated.View style={[animatedStyle]}>
          <Image
            source={{ uri: currentTrack.coverArt }}
            style={{ width: 50, height: 50, borderRadius: 8 }}
            contentFit="cover"
          />
        </Animated.View>

        {/* Track Info */}
        <View className="flex-1 ml-3">
          <Text className="text-white font-bold text-sm" numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
            {artist?.name || "Unknown Artist"}
          </Text>
          <Text className="text-gray-500 text-[10px] mt-0.5">
            {formatTime(position)} / {formatTime(duration)}
          </Text>
        </View>

        {/* Controls */}
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={togglePlayPause}
            className="w-10 h-10 items-center justify-center bg-purple-600 rounded-full"
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={20}
              color="white"
            />
          </Pressable>

          <Pressable
            onPress={skipNext}
            className="w-10 h-10 items-center justify-center"
          >
            <Ionicons name="play-skip-forward" size={24} color="#8B5CF6" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};
