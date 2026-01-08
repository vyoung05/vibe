import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export const MerchScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <LinearGradient colors={["#0A0A0F", "#151520"]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 100 }}>
          <View className="px-6 py-4">
            <Text className="text-white text-3xl font-bold mb-2">Merch</Text>
            <Text className="text-gray-400 text-sm">Official DDNS merchandise</Text>
          </View>

          <View className="px-6 py-12 items-center">
            <Ionicons name="cart-outline" size={80} color="#374151" />
            <Text className="text-gray-400 text-lg mt-4">Coming Soon</Text>
            <Text className="text-gray-500 text-center mt-2">
              Official merchandise will be available soon
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};
