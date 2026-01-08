import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { cn } from "../utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "live" | "superfan" | "free" | "default";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "default", className }) => {
  if (variant === "live") {
    return (
      <View className={cn("overflow-hidden rounded-full", className)}>
        <LinearGradient
          colors={["#EC4899", "#EF4444"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 12, paddingVertical: 4 }}
        >
          <Text className="text-white text-xs font-bold uppercase tracking-wide">
            {children}
          </Text>
        </LinearGradient>
      </View>
    );
  }

  if (variant === "superfan") {
    return (
      <View className={cn("overflow-hidden rounded-full", className)}>
        <LinearGradient
          colors={["#8B5CF6", "#06B6D4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 12, paddingVertical: 4 }}
        >
          <Text className="text-white text-xs font-bold uppercase tracking-wide">
            {children}
          </Text>
        </LinearGradient>
      </View>
    );
  }

  if (variant === "free") {
    return (
      <View className={cn("bg-gray-700 rounded-full px-3 py-1", className)}>
        <Text className="text-gray-300 text-xs font-semibold uppercase tracking-wide">
          {children}
        </Text>
      </View>
    );
  }

  return (
    <View className={cn("bg-gray-800 rounded-full px-3 py-1", className)}>
      <Text className="text-gray-400 text-xs font-medium">
        {children}
      </Text>
    </View>
  );
};
