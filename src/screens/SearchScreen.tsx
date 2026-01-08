import React, { useState } from "react";
import { View, Text, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-[#050509]" edges={["top"]}>
      <View className="px-4 py-3">
        {/* Search Bar */}
        <View className="flex-row items-center bg-[#1A1A1F] rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search"
            placeholderTextColor="#6B7280"
            className="flex-1 ml-3 text-white"
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="items-center justify-center flex-1 mt-32">
          <Ionicons name="search-outline" size={64} color="#374151" />
          <Text className="text-gray-400 text-lg mt-4">
            Search for users, posts, and more
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
