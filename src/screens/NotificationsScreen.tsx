import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "../state/authStore";
import { useAppStore } from "../state/appStore";
import type { RootStackParamList } from "../navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);
  const getUserNotifications = useAppStore((s) => s.getUserNotifications);
  const markNotificationRead = useAppStore((s) => s.markNotificationRead);

  if (!user) {
    return null;
  }

  const notifications = getUserNotifications(user.id);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "referral":
        return { name: "gift", color: "#8B5CF6" };
      case "achievement":
        return { name: "trophy", color: "#F59E0B" };
      case "follower":
        return { name: "heart", color: "#EC4899" };
      case "booking":
        return { name: "calendar", color: "#10B981" };
      case "live":
        return { name: "radio", color: "#EF4444" };
      default:
        return { name: "notifications", color: "#06B6D4" };
    }
  };

  const handleNotificationPress = (notification: any) => {
    markNotificationRead(notification.id);

    // Navigate to streamer profile if it's a live notification
    if (notification.type === "live" && notification.data?.streamerId) {
      navigation.navigate("StreamerProfile", { streamerId: notification.data.streamerId });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-800">
        <Text className="text-white text-2xl font-bold">Notifications</Text>
      </View>

      <ScrollView className="flex-1">
        {notifications.length === 0 ? (
          <View className="items-center justify-center py-20">
            <View className="w-20 h-20 rounded-full bg-gray-800 items-center justify-center mb-4">
              <Ionicons name="notifications-off" size={40} color="#6B7280" />
            </View>
            <Text className="text-gray-400 text-lg">No notifications yet</Text>
            <Text className="text-gray-600 text-sm mt-2">
              You will be notified when something happens
            </Text>
          </View>
        ) : (
          <View className="p-4">
            {notifications.map((notification) => {
              const icon = getNotificationIcon(notification.type);
              return (
                <Pressable
                  key={notification.id}
                  onPress={() => handleNotificationPress(notification)}
                  className={`mb-3 rounded-xl p-4 border ${
                    notification.read
                      ? "bg-[#151520] border-gray-800"
                      : "bg-purple-500/10 border-purple-500/30"
                  }`}
                >
                  <View className="flex-row items-start">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: icon.color + "40" }}
                    >
                      <Ionicons name={icon.name as any} size={20} color={icon.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold mb-1">{notification.title}</Text>
                      <Text className="text-gray-400 text-sm mb-2">{notification.message}</Text>
                      <Text className="text-gray-600 text-xs">
                        {new Date(notification.createdAt).toLocaleDateString()} at{" "}
                        {new Date(notification.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    {!notification.read && (
                      <View className="w-2 h-2 rounded-full bg-purple-500" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
