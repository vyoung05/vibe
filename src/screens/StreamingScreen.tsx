import React, { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, Alert, StyleSheet, ScrollView, TextInput, Animated, Dimensions, Modal, Linking } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../state/authStore";
import { useAppStore } from "../state/appStore";
import { useChatStore } from "../state/chatStore";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { Announcement } from "../types";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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

  // Chat store
  const getChatRoom = useChatStore((s) => s.getChatRoom);
  const createChatRoom = useChatStore((s) => s.createChatRoom);
  const sendChatMessage = useChatStore((s) => s.sendChatMessage);
  const getChatMessages = useChatStore((s) => s.getChatMessages);

  const [facing, setFacing] = useState<CameraType>("front");
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [streamTitle, setStreamTitle] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [hearts, setHearts] = useState<{ id: number; anim: Animated.Value }[]>([]);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const chatScrollRef = useRef<ScrollView>(null);
  const heartIdCounter = useRef(0);

  // Platform selection state
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<StreamPlatformType | null>(null);
  const [liveStreamUrl, setLiveStreamUrl] = useState("");

  // Check both s.id (legacy) and s.userId (linked accounts)
  const foundStreamer = streamers.find((s) => s.id === user?.id || s.userId === user?.id);
  const isAdmin = user?.role === "admin";

  // Create a fallback streamer object for admin users who aren't in the streamers list
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

  // Pre-fill URL from saved platform if available
  useEffect(() => {
    if (streamer && selectedPlatform && streamer.streamPlatforms) {
      const platforms = streamer.streamPlatforms as Record<string, string | undefined>;
      const savedUrl = platforms[selectedPlatform];
      if (savedUrl) {
        setLiveStreamUrl(savedUrl);
      }
    }
  }, [selectedPlatform, streamer]);

  useEffect(() => {
    // Simulate viewer count changes
    if (isStreaming) {
      const interval = setInterval(() => {
        setViewerCount((prev) => {
          const change = Math.floor(Math.random() * 5) - 2;
          return Math.max(0, prev + change);
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isStreaming]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-[#0A0A0F] items-center justify-center px-6">
        <Ionicons name="camera-outline" size={64} color="#8B5CF6" />
        <Text className="text-white text-xl font-bold mt-4 text-center">
          Camera Permission Required
        </Text>
        <Text className="text-gray-400 text-center mt-2 mb-6">
          We need camera access to let you stream
        </Text>
        <Pressable
          onPress={requestPermission}
          className="bg-purple-600 px-8 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

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

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const openGoLiveModal = () => {
    setShowGoLiveModal(true);
  };

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

    // If this is an admin who is not in the streamers list, add them temporarily
    if (isAdmin && !foundStreamer) {
      const addStreamer = useAppStore.getState().addStreamer;
      addStreamer(streamer);
    }

    // Update streamer status with platform and URL
    updateStreamer(streamer.id, {
      isLive: true,
      liveTitle: title,
      liveStreamUrl: liveStreamUrl.trim(),
      streamPlatforms: {
        ...streamer.streamPlatforms,
        [selectedPlatform]: liveStreamUrl.trim(),
      },
    });

    // Notify followers
    notifyFollowersGoLive(streamer.id, streamer.name, title);

    // Create announcement
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
    setIsStreaming(true);
    setViewerCount(Math.floor(Math.random() * 10) + 5);
    setShowGoLiveModal(false);
  };

  const handleGoLive = () => {
    openGoLiveModal();
  };

  const handleEndStream = () => {
    Alert.alert(
      "End Stream",
      "Are you sure you want to end your stream?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Stream",
          style: "destructive",
          onPress: () => {
            if (!user || !streamer) return;

            // Update streamer status
            updateStreamer(streamer.id, {
              isLive: false,
              liveTitle: undefined,
            });

            // Create end stream announcement
            const announcement: Announcement = {
              id: "live-announce-" + Date.now(),
              message: `${streamer.name} has ended their stream. Thanks for watching!`,
              createdBy: user.id,
              createdByName: "System",
              duration: 0.5,
              expiresAt: new Date(Date.now() + 0.5 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date().toISOString(),
              isActive: true,
            };

            addAnnouncement(announcement);
            setIsStreaming(false);
            setViewerCount(0);
            setLikeCount(0);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleTapToLike = () => {
    if (!isStreaming) return;

    setLikeCount((prev) => prev + 1);

    // Create animated heart
    const heartId = heartIdCounter.current++;
    const anim = new Animated.Value(0);

    setHearts((prev) => [...prev, { id: heartId, anim }]);

    // Animate heart floating up
    Animated.timing(anim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      // Remove heart after animation
      setHearts((prev) => prev.filter((h) => h.id !== heartId));
    });
  };

  const handleSendChat = () => {
    if (!chatMessage.trim() || !user || !streamer) return;

    const chatRoomId = `live-${streamer.id}`;
    let chatRoom = getChatRoom(streamer.id);

    if (!chatRoom) {
      createChatRoom(streamer.id, streamer.name);
      chatRoom = getChatRoom(streamer.id);
    }

    if (chatRoom) {
      sendChatMessage(
        chatRoom.id,
        user.id,
        user.username,
        user.avatar || "",
        user.tier,
        chatMessage.trim()
      );
      setChatMessage("");

      // Auto-scroll to bottom
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Get chat room messages
  const chatRoom = streamer ? getChatRoom(streamer.id) : undefined;
  const messages = chatRoom ? getChatMessages(chatRoom.id) : [];

  return (
    <View className="flex-1 bg-black">
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
      />

      {/* Tap to Like Overlay */}
      <Pressable
        onPress={handleTapToLike}
        style={StyleSheet.absoluteFill}
        disabled={!isStreaming}
      >
        {/* Animated Hearts */}
        {hearts.map((heart) => {
          const translateY = heart.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -SCREEN_HEIGHT * 0.8],
          });
          const opacity = heart.anim.interpolate({
            inputRange: [0, 0.8, 1],
            outputRange: [1, 1, 0],
          });
          const randomX = Math.random() * 100 - 50;

          return (
            <Animated.View
              key={heart.id}
              style={{
                position: "absolute",
                bottom: SCREEN_HEIGHT * 0.4,
                left: "50%",
                transform: [
                  { translateX: randomX },
                  { translateY },
                ],
                opacity,
              }}
            >
              <Ionicons name="heart" size={40} color="#EF4444" />
            </Animated.View>
          );
        })}
      </Pressable>

      {/* Top Bar */}
      <View
        className="absolute top-0 left-0 right-0 z-10 px-4"
        style={{ paddingTop: insets.top + 8, backgroundColor: "rgba(0,0,0,0.6)" }}
        pointerEvents="box-none"
      >
        <View className="flex-row items-center justify-between pb-4">
          <Pressable
            onPress={() => navigation.goBack()}
            className="bg-black/50 rounded-full p-2"
          >
            <Ionicons name="close" size={24} color="white" />
          </Pressable>

          {isStreaming && (
            <View className="flex-row items-center bg-red-600 px-3 py-2 rounded-full">
              <View className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
              <Text className="text-white font-bold text-sm">LIVE</Text>
            </View>
          )}

          <Pressable
            onPress={toggleCameraFacing}
            className="bg-black/50 rounded-full p-2"
          >
            <Ionicons name="camera-reverse" size={24} color="white" />
          </Pressable>
        </View>

        {isStreaming && (
          <View className="pb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="eye" size={16} color="white" />
                <Text className="text-white font-bold ml-2">
                  {viewerCount} {viewerCount === 1 ? "viewer" : "viewers"}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="heart" size={16} color="#EF4444" />
                <Text className="text-white font-bold ml-1">
                  {likeCount}
                </Text>
              </View>
            </View>
            <Text className="text-white text-sm mt-1" numberOfLines={1}>
              {streamTitle || `${streamer.name} is Live!`}
            </Text>
          </View>
        )}
      </View>

      {/* Live Chat (Right Side) */}
      {isStreaming && showChat && (
        <View className="absolute right-4 bottom-40 w-64 z-20" style={{ height: SCREEN_HEIGHT * 0.35 }}>
          <View className="bg-black/70 rounded-2xl overflow-hidden flex-1">
            <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-700">
              <Text className="text-white font-bold">Live Chat</Text>
              <Pressable onPress={() => setShowChat(false)}>
                <Ionicons name="close" size={20} color="white" />
              </Pressable>
            </View>

            <ScrollView
              ref={chatScrollRef}
              className="flex-1 px-3 py-2"
              showsVerticalScrollIndicator={false}
            >
              {messages.map((msg) => (
                <View key={msg.id} className="mb-2">
                  <Text className={`text-xs font-bold ${msg.userTier === "superfan" ? "text-pink-400" : "text-purple-400"}`}>
                    {msg.username}
                  </Text>
                  <Text className="text-white text-sm">{msg.message}</Text>
                </View>
              ))}
            </ScrollView>

            <View className="flex-row items-center px-3 py-2 border-t border-gray-700">
              <TextInput
                value={chatMessage}
                onChangeText={setChatMessage}
                placeholder="Say something..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 text-white text-sm"
                onSubmitEditing={handleSendChat}
              />
              <Pressable onPress={handleSendChat}>
                <Ionicons name="send" size={20} color="#8B5CF6" />
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Chat Toggle (when hidden) */}
      {isStreaming && !showChat && (
        <Pressable
          onPress={() => setShowChat(true)}
          className="absolute right-4 bottom-40 bg-black/70 rounded-full p-3 z-20"
        >
          <Ionicons name="chatbubble" size={24} color="white" />
        </Pressable>
      )}

      {/* Bottom Controls */}
      <View
        className="absolute bottom-0 left-0 right-0 px-6 z-20"
        style={{ paddingBottom: insets.bottom + 20, backgroundColor: "rgba(0,0,0,0.6)" }}
      >
        {!isStreaming ? (
          <View className="items-center py-6">
            <Text className="text-white text-lg font-bold mb-2">Ready to Go Live?</Text>
            <Text className="text-gray-300 text-center mb-6">
              Your stream will be visible to all your followers
            </Text>

            <Pressable
              onPress={handleGoLive}
              className="bg-red-600 px-12 py-4 rounded-full"
            >
              <Text className="text-white text-lg font-bold">Go Live</Text>
            </Pressable>
          </View>
        ) : (
          <View className="items-center py-4">
            <Text className="text-gray-400 text-xs text-center mb-2">
              Tap anywhere to like • Chat with viewers
            </Text>
            <Pressable
              onPress={handleEndStream}
              className="bg-red-600 px-12 py-3 rounded-full"
            >
              <Text className="text-white font-bold">End Stream</Text>
            </Pressable>
          </View>
        )}
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
            {/* Modal Header */}
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
              {/* Stream Title */}
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

              {/* Platform Selection */}
              <View className="mb-6">
                <Text className="text-white text-sm font-semibold mb-2">Where are you streaming?</Text>
                <Text className="text-gray-400 text-xs mb-3">
                  Select the platform where your live stream is running
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {PLATFORMS.map((platform) => (
                    <Pressable
                      key={platform.id}
                      onPress={() => {
                        setSelectedPlatform(platform.id);
                        // Pre-fill URL if saved
                        if (streamer.streamPlatforms) {
                          const platforms = streamer.streamPlatforms as Record<string, string | undefined>;
                          const savedUrl = platforms[platform.id];
                          if (savedUrl) {
                            setLiveStreamUrl(savedUrl);
                          } else {
                            setLiveStreamUrl("");
                          }
                        }
                      }}
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

              {/* Live Stream URL */}
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
                    keyboardType="url"
                  />
                </View>
              )}

              {/* Instructions */}
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
