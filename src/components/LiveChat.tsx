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
import { Ionicons } from "@expo/vector-icons";
import { useChatStore } from "../state/chatStore";
import { useAuthStore } from "../state/authStore";
import type { ChatMessage } from "../types";

interface Props {
  streamerId: string;
  streamerName: string;
}

// Common emotes
const EMOTES = ["👏", "😂", "❤️", "🔥", "💯", "😍", "🎉", "👑"];

export const LiveChat: React.FC<Props> = ({ streamerId, streamerName }) => {
  const user = useAuthStore((s) => s.user);
  const chatRoom = useChatStore((s) => s.getChatRoom(streamerId));
  const createChatRoom = useChatStore((s) => s.createChatRoom);
  const sendChatMessage = useChatStore((s) => s.sendChatMessage);
  const getChatMessages = useChatStore((s) => s.getChatMessages);
  const incrementParticipantCount = useChatStore((s) => s.incrementParticipantCount);
  const decrementParticipantCount = useChatStore((s) => s.decrementParticipantCount);

  const [message, setMessage] = useState("");
  const [showEmotes, setShowEmotes] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize chat room when component mounts
  useEffect(() => {
    let room = chatRoom;
    if (!room) {
      room = createChatRoom(streamerId, streamerName);
    }

    // Increment participant count
    if (room) {
      incrementParticipantCount(room.id);
    }

    // Decrement when component unmounts
    return () => {
      if (room) {
        decrementParticipantCount(room.id);
      }
    };
  }, []);

  const messages = chatRoom ? getChatMessages(chatRoom.id) : [];

  const handleSendMessage = () => {
    if (!message.trim() || !user || !chatRoom) return;

    sendChatMessage(
      chatRoom.id,
      user.id,
      user.username,
      user.avatar,
      user.tier,
      message.trim(),
      "text"
    );

    setMessage("");
    setShowEmotes(false);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendEmote = (emote: string) => {
    if (!user || !chatRoom) return;

    sendChatMessage(
      chatRoom.id,
      user.id,
      user.username,
      user.avatar,
      user.tier,
      emote,
      "emote",
      emote
    );

    setShowEmotes(false);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = (msg: ChatMessage) => {
    const isOwnMessage = msg.userId === user?.id;
    const tierColor = msg.userTier === "superfan" ? "#EC4899" : "#8B5CF6";

    if (msg.type === "system") {
      return (
        <View key={msg.id} className="items-center my-2">
          <View className="bg-gray-800 px-3 py-1 rounded-full">
            <Text className="text-gray-400 text-xs">{msg.message}</Text>
          </View>
        </View>
      );
    }

    if (msg.type === "emote") {
      return (
        <View key={msg.id} className="flex-row items-center mb-2 px-3">
          <Text className="font-bold mr-2" style={{ color: tierColor }}>
            {msg.username}:
          </Text>
          <Text className="text-3xl">{msg.emote}</Text>
        </View>
      );
    }

    return (
      <View key={msg.id} className="mb-2 px-3">
        <View className="flex-row items-start">
          <Text className="font-bold mr-2" style={{ color: tierColor }}>
            {msg.username}:
          </Text>
          <Text className={`flex-1 ${isOwnMessage ? "text-white" : "text-gray-300"}`}>
            {msg.message}
          </Text>
        </View>
      </View>
    );
  };

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0A0A0F]">
        <Ionicons name="lock-closed" size={48} color="#6B7280" />
        <Text className="text-gray-400 mt-4">Sign in to join the chat</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0A0A0F]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      {/* Chat Header */}
      <View className="bg-[#151520] px-4 py-3 border-b border-gray-800">
        <View className="flex-row items-center justify-between">
          <Text className="text-white font-bold">Live Chat</Text>
          <View className="flex-row items-center">
            <Ionicons name="people" size={16} color="#8B5CF6" />
            <Text className="text-purple-400 text-sm ml-1">
              {chatRoom?.participantCount || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 py-3"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12">
            <Ionicons name="chatbubbles-outline" size={48} color="#4B5563" />
            <Text className="text-gray-400 mt-4">Be the first to say something!</Text>
          </View>
        ) : (
          messages.map(renderMessage)
        )}
      </ScrollView>

      {/* Emote Picker */}
      {showEmotes && (
        <View className="bg-[#151520] border-t border-gray-800 px-4 py-3">
          <View className="flex-row flex-wrap gap-2">
            {EMOTES.map((emote) => (
              <Pressable
                key={emote}
                onPress={() => handleSendEmote(emote)}
                className="bg-[#0A0A0F] px-3 py-2 rounded-lg"
              >
                <Text className="text-2xl">{emote}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Input */}
      <View className="bg-[#151520] px-4 py-3 border-t border-gray-800">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => setShowEmotes(!showEmotes)}
            className="mr-2"
          >
            <Ionicons name="happy-outline" size={24} color="#8B5CF6" />
          </Pressable>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Send a message..."
            placeholderTextColor="#6B7280"
            className="flex-1 bg-[#0A0A0F] text-white px-4 py-2 rounded-full mr-2"
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
          />
          <Pressable
            onPress={handleSendMessage}
            className="bg-purple-600 w-10 h-10 rounded-full items-center justify-center"
          >
            <Ionicons name="send" size={18} color="white" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};
