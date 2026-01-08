import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuthStore } from "../state/authStore";
import { useChatStore } from "../state/chatStore";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { DirectMessage } from "../types";

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, "Chat">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ChatScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ChatScreenProps["route"]>();
  const { userId: otherUserId, username: otherUsername } = route.params;

  const user = useAuthStore((s) => s.user);
  const sendDirectMessage = useChatStore((s) => s.sendDirectMessage);
  const getConversation = useChatStore((s) => s.getConversation);
  const getDirectMessages = useChatStore((s) => s.getDirectMessages);
  const markConversationRead = useChatStore((s) => s.markConversationRead);

  const [message, setMessage] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  // Get conversation ID and messages
  const conversationId = user ? [user.id, otherUserId].sort().join("-") : "";
  const conversation = user ? getConversation(user.id, otherUserId) : undefined;
  const messages = conversation ? getDirectMessages(conversation.id) : [];

  // Mark conversation as read when component mounts
  useEffect(() => {
    if (conversationId && user) {
      markConversationRead(conversationId, user.id);
    }
  }, [conversationId, user?.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  const handleSendMessage = () => {
    if (!message.trim() || !user) return;

    sendDirectMessage(
      user.id,
      otherUserId,
      user.username,
      user.avatar,
      message.trim()
    );

    setMessage("");

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = (msg: DirectMessage) => {
    const isOwnMessage = msg.senderId === user?.id;

    return (
      <View
        key={msg.id}
        className={`mb-3 px-4 ${isOwnMessage ? "items-end" : "items-start"}`}
      >
        <View
          className={`max-w-[75%] px-4 py-2 rounded-2xl ${
            isOwnMessage
              ? "bg-purple-600 rounded-br-sm"
              : "bg-[#151520] rounded-bl-sm"
          }`}
        >
          <Text className="text-white">{msg.message}</Text>
        </View>
        <Text className="text-gray-500 text-xs mt-1">
          {new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-800 flex-row items-center">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <View className="w-10 h-10 rounded-full bg-purple-600 items-center justify-center mr-3">
          <Text className="text-white font-bold text-lg">
            {otherUsername[0].toUpperCase()}
          </Text>
        </View>
        <Text className="text-white text-lg font-bold">{otherUsername}</Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 py-4"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <View className="w-20 h-20 rounded-full bg-gray-800 items-center justify-center mb-4">
                <Ionicons name="chatbubble-outline" size={40} color="#6B7280" />
              </View>
              <Text className="text-gray-400 text-lg">No messages yet</Text>
              <Text className="text-gray-600 text-sm mt-2 text-center px-6">
                Start the conversation with {otherUsername}
              </Text>
            </View>
          ) : (
            messages.map(renderMessage)
          )}
        </ScrollView>

        {/* Input */}
        <View className="bg-[#151520] px-4 py-3 border-t border-gray-800">
          <View className="flex-row items-center">
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={`Message ${otherUsername}...`}
              placeholderTextColor="#6B7280"
              className="flex-1 bg-[#0A0A0F] text-white px-4 py-2 rounded-full mr-2"
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
              multiline
              maxLength={500}
            />
            <Pressable
              onPress={handleSendMessage}
              disabled={!message.trim()}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                message.trim() ? "bg-purple-600" : "bg-gray-700"
              }`}
            >
              <Ionicons name="send" size={18} color="white" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
