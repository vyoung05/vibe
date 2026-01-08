import React, { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { useAppStore } from "../state/appStore";
import type { Announcement } from "../types";

export const AnnouncementTicker: React.FC = () => {
  const announcements = useAppStore((s) => s.announcements);
  const dismissAnnouncement = useAppStore((s) => s.dismissAnnouncement);

  // Filter active announcements
  const activeAnnouncements = announcements.filter((a: Announcement) => {
    if (!a.isActive) return false;
    const now = new Date().getTime();
    const expires = new Date(a.expiresAt).getTime();
    return now < expires;
  });

  const translateX = useSharedValue(0);

  useEffect(() => {
    if (activeAnnouncements.length > 0) {
      translateX.value = 400; // Start from right
      translateX.value = withRepeat(
        withTiming(-1000, {
          duration: 15000,
          easing: Easing.linear,
        }),
        -1, // Infinite repeat
        false
      );
    }

    return () => {
      cancelAnimation(translateX);
    };
  }, [activeAnnouncements.length]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (activeAnnouncements.length === 0) {
    return null;
  }

  const currentAnnouncement = activeAnnouncements[0];

  return (
    <View className="bg-purple-600 overflow-hidden">
      <View className="flex-row items-center h-10 px-4">
        <Ionicons name="megaphone" size={16} color="white" />
        <View className="flex-1 ml-2 overflow-hidden">
          <Animated.View style={animatedStyle}>
            <Text className="text-white font-medium" numberOfLines={1}>
              {currentAnnouncement.message}
            </Text>
          </Animated.View>
        </View>
        <Pressable
          onPress={() => dismissAnnouncement(currentAnnouncement.id)}
          className="ml-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color="white" />
        </Pressable>
      </View>
    </View>
  );
};
