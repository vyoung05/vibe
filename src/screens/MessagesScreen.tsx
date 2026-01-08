import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "../state/authStore";
import { useChatStore } from "../state/chatStore";
import type { RootStackParamList } from "../navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const MessagesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);
  const getConversations = useChatStore((s) => s.getConversations);

  if (!user) {
    return null;
  }

  const conversations = getConversations(user.id);

  const handleOpenConversation = (otherUserId: string, otherUserName: string) => {
    navigation.navigate("Chat", {
      userId: otherUserId,
      username: otherUserName,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-800">
        <Text className="text-white text-2xl font-bold">Messages</Text>
      </View>

      <ScrollView className="flex-1">
        {conversations.length === 0 ? (
          <View className="items-center justify-center py-20">
            <View className="w-20 h-20 rounded-full bg-gray-800 items-center justify-center mb-4">
              <Ionicons name="chatbubbles-outline" size={40} color="#6B7280" />
            </View>
            <Text className="text-gray-400 text-lg">No messages yet</Text>
            <Text className="text-gray-600 text-sm mt-2 text-center px-6">
              Start a conversation by visiting a streamer profile
            </Text>
          </View>
        ) : (
          <View className="p-4">
            {conversations.map((conversation) => {
              const otherUserId = conversation.participants.find((id) => id !== user.id);
              const otherUserIndex = conversation.participants.findIndex((id) => id !== user.id);
              const otherUserName = conversation.participantNames[otherUserIndex] || "Unknown";
              const otherUserAvatar = conversation.participantAvatars[otherUserIndex];

              return (
                <Pressable
                  key={conversation.id}
                  onPress={() => handleOpenConversation(otherUserId!, otherUserName)}
                  className="mb-3 bg-[#151520] rounded-xl p-4 border border-gray-800"
                >
                  <View className="flex-row items-center">
                    {/* Avatar */}
                    <View className="w-12 h-12 rounded-full bg-purple-600 items-center justify-center mr-3">
                      {otherUserAvatar ? (
                        <Text className="text-white font-bold text-lg">
                          {otherUserName[0].toUpperCase()}
                        </Text>
                      ) : (
                        <Ionicons name="person" size={24} color="white" />
                      )}
                    </View>

                    {/* Content */}
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-white font-bold">{otherUserName}</Text>
                        {conversation.lastMessage && (
                          <Text className="text-gray-500 text-xs">
                            {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                      {conversation.lastMessage && (
                        <Text className="text-gray-400 text-sm" numberOfLines={1}>
                          {conversation.lastMessage.senderId === user.id ? "You: " : ""}
                          {conversation.lastMessage.message}
                        </Text>
                      )}
                    </View>

                    {/* Unread Badge */}
                    {conversation.unreadCount > 0 && (
                      <View className="bg-purple-600 w-6 h-6 rounded-full items-center justify-center ml-2">
                        <Text className="text-white text-xs font-bold">
                          {conversation.unreadCount}
                        </Text>
                      </View>
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
