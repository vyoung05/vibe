import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../state/appStore";
import { useAuthStore } from "../state/authStore";
import { useAnalyticsStore } from "../state/analyticsStore";
import { useChatStore } from "../state/chatStore";

export const StreamerControls: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const streamers = useAppStore((s) => s.streamers);
  const updateStreamer = useAppStore((s) => s.updateStreamer);
  const notifyFollowersGoLive = useAppStore((s) => s.notifyFollowersGoLive);
  const addNotification = useAppStore((s) => s.addNotification);
  const addAnnouncement = useAppStore((s) => s.addAnnouncement);
  const startStream = useAnalyticsStore((s) => s.startStream);
  const endStream = useAnalyticsStore((s) => s.endStream);
  const checkAchievements = useAnalyticsStore((s) => s.checkAchievements);
  const getChatRoom = useChatStore((s) => s.getChatRoom);
  const getChatMessages = useChatStore((s) => s.getChatMessages);

  const [showGoLiveModal, setShowGoLiveModal] = useState(false);
  const [liveTitle, setLiveTitle] = useState("");
  const activeStreamId = useRef<string | null>(null);

  // Check if current user is a streamer
  // Check both s.id (legacy) and s.userId (linked accounts)
  const userStreamer = streamers.find((s) => s.id === user?.id || s.userId === user?.id);

  if (!userStreamer) return null;

  const handleToggleLive = () => {
    if (userStreamer.isLive) {
      // End stream and record analytics
      if (activeStreamId.current) {
        const chatRoom = getChatRoom(userStreamer.id);
        const messages = getChatMessages(chatRoom?.id || "");

        // Calculate metrics
        const peakViewers = chatRoom?.participantCount || 0;
        const averageViewers = Math.floor(peakViewers * 0.7); // Mock calculation
        const totalMessages = messages.length;
        const newFollowers = Math.floor(Math.random() * 10); // Mock - would track real follower growth

        endStream(activeStreamId.current, peakViewers, averageViewers, totalMessages, newFollowers);
        activeStreamId.current = null;

        // Check for new achievements
        const currentAchievements = userStreamer.streamerAchievements || [];
        const newAchievements = checkAchievements(userStreamer.id, currentAchievements);

        if (newAchievements.length > 0) {
          // Update streamer with new achievements
          updateStreamer(userStreamer.id, {
            streamerAchievements: [...currentAchievements, ...newAchievements],
          });

          // Notify admin about each achievement
          const adminUser = streamers.find((s) => s.email === "Vyoung86@gmail.com");
          if (adminUser) {
            newAchievements.forEach((achievementId) => {
              const achievement = require("../data/streamerAchievements").streamerAchievements.find(
                (a: any) => a.id === achievementId
              );
              if (achievement) {
                addNotification({
                  id: `notif_${Date.now()}_${achievementId}`,
                  userId: adminUser.id,
                  type: "achievement",
                  title: "Streamer Achievement Unlocked!",
                  message: `${userStreamer.name} (@${userStreamer.gamertag}) just unlocked: ${achievement.name} - ${achievement.description}`,
                  read: false,
                  createdAt: new Date().toISOString(),
                  data: { achievementId, streamerId: userStreamer.id },
                });
              }
            });
          }

          // Add achievement to ticker for each new achievement
          newAchievements.forEach((achievementId) => {
            const achievement = require("../data/streamerAchievements").streamerAchievements.find(
              (a: any) => a.id === achievementId
            );
            if (achievement && user) {
              const expiresAt = new Date();
              expiresAt.setHours(expiresAt.getHours() + 24);

              addAnnouncement({
                id: `announce_${Date.now()}_${achievementId}`,
                message: `🏆 ${userStreamer.gamertag} just unlocked "${achievement.name}"! ${achievement.description}`,
                createdBy: user.id,
                createdByName: user.username,
                duration: 24,
                expiresAt: expiresAt.toISOString(),
                createdAt: new Date().toISOString(),
                isActive: true,
              });
            }
          });
        }
      }

      // Go offline
      updateStreamer(userStreamer.id, {
        isLive: false,
        liveStreamUrl: undefined,
        liveTitle: undefined,
      });
    } else {
      // Show modal to go live
      setShowGoLiveModal(true);
    }
  };

  const handleGoLive = () => {
    if (!liveTitle.trim()) return;

    // Start analytics tracking
    const stream = startStream(userStreamer.id, liveTitle, "DDNS");
    activeStreamId.current = stream.id;

    // Update streamer to live status
    updateStreamer(userStreamer.id, {
      isLive: true,
      liveTitle: liveTitle,
      lastLiveDate: new Date().toISOString(),
    });

    // Notify all followers
    notifyFollowersGoLive(userStreamer.id, userStreamer.name, liveTitle);

    setShowGoLiveModal(false);
    setLiveTitle("");
  };

  return (
    <>
      <View className="px-6 py-4 bg-[#151520] border-b border-gray-800">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white font-bold text-lg">Streamer Controls</Text>
            <Text className="text-gray-400 text-sm">
              {userStreamer.isLive ? "You are live!" : "Ready to stream?"}
            </Text>
          </View>
          <Pressable
            onPress={handleToggleLive}
            className={`px-6 py-3 rounded-xl flex-row items-center ${
              userStreamer.isLive ? "bg-red-600" : "bg-purple-600"
            }`}
          >
            <Ionicons
              name={userStreamer.isLive ? "stop-circle" : "radio"}
              size={20}
              color="white"
            />
            <Text className="text-white font-bold ml-2">
              {userStreamer.isLive ? "End Stream" : "Go Live"}
            </Text>
          </Pressable>
        </View>
        {userStreamer.isLive && userStreamer.liveTitle && (
          <View className="mt-3 bg-pink-600/20 border border-pink-600/30 rounded-lg px-3 py-2">
            <Text className="text-pink-400 text-sm font-bold">
              {userStreamer.liveTitle}
            </Text>
          </View>
        )}
      </View>

      {/* Go Live Modal */}
      <Modal visible={showGoLiveModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-[#151520] rounded-t-3xl p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white text-xl font-bold">Go Live</Text>
                  <Pressable onPress={() => setShowGoLiveModal(false)}>
                    <Ionicons name="close" size={28} color="white" />
                  </Pressable>
                </View>

                <TextInput
                  placeholder="Stream title (e.g., 'Playing Valorant - Ranked Grind')"
                  placeholderTextColor="#6B7280"
                  value={liveTitle}
                  onChangeText={setLiveTitle}
                  className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                />

                <Text className="text-gray-400 text-sm mb-4">
                  Your followers will be notified when you go live!
                </Text>

                <Pressable
                  onPress={handleGoLive}
                  className="bg-purple-600 py-4 rounded-xl"
                >
                  <Text className="text-white text-center font-bold">Start Streaming</Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};
