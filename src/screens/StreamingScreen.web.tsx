import React, { useState } from "react";
import { View, Text, Pressable, Alert, ScrollView, TextInput, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../state/authStore";
import { useAppStore } from "../state/appStore";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { Announcement } from "../types";

type StreamPlatformType = "twitch" | "youtube" | "tiktok" | "instagram" | "kick";

const PLATFORMS: { id: StreamPlatformType; name: string; icon: string; color: string; placeholder: string }[] = [
  { id: "twitch", name: "Twitch", icon: "logo-twitch", color: "#9146FF", placeholder: "https://twitch.tv/yourhandle" },
  { id: "youtube", name: "YouTube", icon: "logo-youtube", color: "#FF0000", placeholder: "https://youtube.com/live/..." },
  { id: "tiktok", name: "TikTok", icon: "logo-tiktok", color: "#000000", placeholder: "https://tiktok.com/@yourhandle/live" },
  { id: "instagram", name: "Instagram", icon: "logo-instagram", color: "#E4405F", placeholder: "https://instagram.com/yourhandle/live" },
  { id: "kick", name: "Kick", icon: "game-controller", color: "#53FC18", placeholder: "https://kick.com/yourhandle" },
];

type Props = NativeStackScreenProps<RootStackParamList, "Streaming">;

export const StreamingScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const streamers = useAppStore((s) => s.streamers);
  const updateStreamer = useAppStore((s) => s.updateStreamer);
  const addAnnouncement = useAppStore((s) => s.addAnnouncement);
  const notifyFollowersGoLive = useAppStore((s) => s.notifyFollowersGoLive);

  const [streamTitle, setStreamTitle] = useState("");
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<StreamPlatformType | null>(null);
  const [liveStreamUrl, setLiveStreamUrl] = useState("");

  const foundStreamer = streamers.find((s) => s.id === user?.id);
  const isAdmin = user?.role === "admin";

  const streamer = foundStreamer || (isAdmin && user ? {
    id: user.id,
    name: user.username,
    gamertag: user.username,
    email: user.email,
    avatar: user.avatar || "",
    headerImages: [],
    bio: "Admin",
    isLive: false,
    socialLinks: {},
    schedule: [],
    followerCount: 0,
    referralCode: user.referralCode,
  } : null);

  if (!streamer) {
    return (
      <View className="flex-1 bg-[#0A0A0F] items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-white text-xl font-bold mt-4">Not a Streamer</Text>
        <Text className="text-gray-400 text-center mt-2">
          Only registered streamers can access the streaming feature
        </Text>
      </View>
    );
  }

  const handleConfirmGoLive = () => {
    if (!user || !streamer) return;

    if (!selectedPlatform) {
      Alert.alert("Select Platform", "Please select which platform you are streaming on.");
      return;
    }

    if (!liveStreamUrl.trim()) {
      Alert.alert("Enter Stream URL", "Please enter your live stream URL so viewers can watch.");
      return;
    }

    const title = streamTitle || `${streamer.name} is Live!`;

    if (isAdmin && !foundStreamer) {
      const addStreamer = useAppStore.getState().addStreamer;
      addStreamer(streamer);
    }

    updateStreamer(streamer.id, {
      isLive: true,
      liveTitle: title,
      liveStreamUrl: liveStreamUrl.trim(),
      streamPlatforms: {
        ...streamer.streamPlatforms,
        [selectedPlatform]: liveStreamUrl.trim(),
      },
    });

    notifyFollowersGoLive(streamer.id, streamer.name, title);

    const platformName = PLATFORMS.find((p) => p.id === selectedPlatform)?.name || selectedPlatform;
    const announcement: Announcement = {
      id: "live-announce-" + Date.now(),
      message: `🔴 ${streamer.name} is now LIVE on ${platformName}! Check out the stream!`,
      createdBy: user.id,
      createdByName: "System",
      duration: 24,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    addAnnouncement(announcement);
    setShowGoLiveModal(false);
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <View
        className="px-6"
        style={{ paddingTop: insets.top + 20 }}
      >
        <View className="flex-row items-center mb-6">
          <Pressable
            onPress={() => navigation.goBack()}
            className="mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Text className="text-white text-2xl font-bold">Go Live</Text>
        </View>

        <View className="bg-[#151520] rounded-3xl p-6 mb-6">
          <Ionicons name="information-circle" size={48} color="#8B5CF6" />
          <Text className="text-white text-lg font-bold mt-4 mb-2">
            Camera Streaming Not Available on Web
          </Text>
          <Text className="text-gray-400 mb-4">
            To stream with your camera, please use the mobile app. On web, you can still go live by providing a link to your stream on other platforms.
          </Text>
        </View>

        <Pressable
          onPress={() => setShowGoLiveModal(true)}
          className="bg-purple-600 px-12 py-4 rounded-full items-center"
        >
          <Text className="text-white text-lg font-bold">Set Up Live Stream</Text>
        </Pressable>
      </View>

      {/* Go Live Modal */}
      <Modal
        visible={showGoLiveModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGoLiveModal(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-[#151520] rounded-t-3xl" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-800">
              <Pressable onPress={() => setShowGoLiveModal(false)}>
                <Text className="text-gray-400">Cancel</Text>
              </Pressable>
              <Text className="text-white text-lg font-bold">Go Live</Text>
              <Pressable onPress={handleConfirmGoLive}>
                <Text className="text-purple-500 font-bold">Start</Text>
              </Pressable>
            </View>

            <ScrollView className="px-6 pt-4" showsVerticalScrollIndicator={false}>
              <View className="mb-6">
                <Text className="text-white text-sm font-semibold mb-2">Stream Title</Text>
                <TextInput
                  value={streamTitle}
                  onChangeText={setStreamTitle}
                  placeholder={`${streamer.name} is Live!`}
                  placeholderTextColor="#6B7280"
                  className="bg-[#1A1A1F] text-white px-4 py-3 rounded-xl"
                />
              </View>

              <View className="mb-6">
                <Text className="text-white text-sm font-semibold mb-2">Where are you streaming?</Text>
                <Text className="text-gray-400 text-xs mb-3">
                  Select the platform where your live stream is running
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {PLATFORMS.map((platform) => (
                    <Pressable
                      key={platform.id}
                      onPress={() => setSelectedPlatform(platform.id)}
                      className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${
                        selectedPlatform === platform.id
                          ? "border-purple-500 bg-purple-500/20"
                          : "border-gray-700 bg-[#1A1A1F]"
                      }`}
                    >
                      <Ionicons
                        name={platform.icon as any}
                        size={20}
                        color={selectedPlatform === platform.id ? "#8B5CF6" : platform.color}
                      />
                      <Text
                        className={`ml-2 font-medium ${
                          selectedPlatform === platform.id ? "text-purple-400" : "text-white"
                        }`}
                      >
                        {platform.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {selectedPlatform && (
                <View className="mb-6">
                  <Text className="text-white text-sm font-semibold mb-2">Your Live Stream URL</Text>
                  <Text className="text-gray-400 text-xs mb-3">
                    Paste the link to your live stream so viewers can watch
                  </Text>
                  <TextInput
                    value={liveStreamUrl}
                    onChangeText={setLiveStreamUrl}
                    placeholder={PLATFORMS.find((p) => p.id === selectedPlatform)?.placeholder}
                    placeholderTextColor="#6B7280"
                    className="bg-[#1A1A1F] text-white px-4 py-3 rounded-xl"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}

              <View className="bg-[#1A1A1F] rounded-xl p-4 mb-6">
                <View className="flex-row items-start mb-3">
                  <Ionicons name="information-circle" size={20} color="#8B5CF6" />
                  <Text className="text-gray-300 text-sm ml-2 flex-1">
                    Start your stream on {selectedPlatform ? PLATFORMS.find((p) => p.id === selectedPlatform)?.name : "your chosen platform"} first, then paste the link here. Your followers will be directed to watch your stream there.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

