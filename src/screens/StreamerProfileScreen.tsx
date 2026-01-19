import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Dimensions, Share, Linking, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedScrollHandler } from "react-native-reanimated";
import * as WebBrowser from "expo-web-browser";
import { useAppStore } from "../state/appStore";
import { useAuthStore } from "../state/authStore";
import { useChatStore } from "../state/chatStore";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { LiveChat } from "../components/LiveChat";
import { PageContainer } from "../components/PageContainer";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "StreamerProfile">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_HEIGHT = 280;

export const StreamerProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { streamerId } = route.params;
  const insets = useSafeAreaInsets();
  const streamers = useAppStore((s) => s.streamers);
  const followStreamer = useAppStore((s) => s.followStreamer);
  const unfollowStreamer = useAppStore((s) => s.unfollowStreamer);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const toggleBookmark = useAuthStore((s) => s.toggleBookmark);
  const getConversation = useChatStore((s) => s.getConversation);
  const sendDirectMessage = useChatStore((s) => s.sendDirectMessage);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const streamer = streamers.find((s) => s.id === streamerId);
  const [activeTab, setActiveTab] = useState<"profile" | "live" | "chat">(streamer?.isLive ? "live" : "profile");

  if (!streamer) {
    return (
      <View className="flex-1 bg-[#0A0A0F] items-center justify-center">
        <Text className="text-white text-lg">Streamer not found</Text>
      </View>
    );
  }

  const isFollowing = user?.followedStreamers.includes(streamerId) || false;
  const isBookmarked = user?.bookmarkedStreamers?.includes(streamerId) || false;

  // Check if current user owns this profile
  const isOwner = user?.id === streamerId;

  const toggleFollow = () => {
    if (!user) return;

    if (isFollowing) {
      unfollowStreamer(user.id, streamerId);
      // Sync to authStore for real-time profile updates
      const updatedFollowedStreamers = (user.followedStreamers || []).filter(id => id !== streamerId);
      updateUser({ followedStreamers: updatedFollowedStreamers });
    } else {
      followStreamer(user.id, streamerId);
      // Sync to authStore for real-time profile updates
      const currentFollowedStreamers = user.followedStreamers || [];
      updateUser({ followedStreamers: [...currentFollowedStreamers, streamerId] });
    }
  };

  const openURL = async (url: string) => {
    // Check if URL is already a full URL
    if (url.startsWith("http://") || url.startsWith("https://")) {
      await WebBrowser.openBrowserAsync(url);
      return;
    }

    // If it's just a username, construct the appropriate URL based on the platform
    // For now, just prepend https:// if missing
    const fullUrl = url.includes("://") ? url : `https://${url}`;
    await WebBrowser.openBrowserAsync(fullUrl);
  };

  const openSocialLink = async (platform: string, username: string) => {
    let url = "";

    // If already a full URL, use it
    if (username.startsWith("http://") || username.startsWith("https://")) {
      url = username;
    } else {
      // Construct URL based on platform
      switch (platform) {
        case "twitch":
          url = `https://twitch.tv/${username}`;
          break;
        case "youtube":
          url = username.includes("youtube.com") ? `https://${username}` : `https://youtube.com/@${username}`;
          break;
        case "instagram":
          url = `https://instagram.com/${username}`;
          break;
        case "twitter":
          url = `https://twitter.com/${username}`;
          break;
        case "tiktok":
          url = username.startsWith("@") ? `https://tiktok.com/${username}` : `https://tiktok.com/@${username}`;
          break;
        case "kick":
          url = `https://kick.com/${username}`;
          break;
        default:
          url = username;
      }
    }

    await WebBrowser.openBrowserAsync(url);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${streamer.name} (@${streamer.gamertag}) on DDNS! ${streamer.bio}`,
        title: `${streamer.name} - DDNS Streamer`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleBookmark = () => {
    if (!user) return;
    toggleBookmark(streamerId);
  };

  const handleMessage = () => {
    if (!user) return;

    // Check if conversation already exists
    const conversation = getConversation(user.id, streamerId);

    if (conversation) {
      // Navigate to existing conversation
      navigation.navigate("Chat", {
        userId: streamerId,
        username: streamer.name,
      });
    } else {
      // Create initial message and navigate
      sendDirectMessage(
        user.id,
        streamerId,
        user.username,
        user.avatar,
        `Hi ${streamer.name}! I'm a fan of your content.`
      );
      navigation.navigate("Chat", {
        userId: streamerId,
        username: streamer.name,
      });
    }
  };

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      {/* Tabs - Only show when streamer is live */}
      {streamer.isLive && (
        <View className="bg-[#151520] border-b border-gray-800" style={{ paddingTop: insets.top }}>
          <PageContainer>
            <View className="flex-row">
              <Pressable
                onPress={() => setActiveTab("live")}
                className={`flex-1 py-4 items-center border-b-2 ${activeTab === "live" ? "border-red-600" : "border-transparent"
                  }`}
              >
                <View className="flex-row items-center">
                  {activeTab === "live" && <View className="w-2 h-2 rounded-full bg-red-600 mr-2" />}
                  <Text className={`font-medium ${activeTab === "live" ? "text-white" : "text-gray-400"}`}>
                    Live
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab("profile")}
                className={`flex-1 py-4 items-center border-b-2 ${activeTab === "profile" ? "border-purple-600" : "border-transparent"
                  }`}
              >
                <Text className={`font-medium ${activeTab === "profile" ? "text-white" : "text-gray-400"}`}>
                  Profile
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab("chat")}
                className={`flex-1 py-4 items-center border-b-2 ${activeTab === "chat" ? "border-purple-600" : "border-transparent"
                  }`}
              >
                <Text className={`font-medium ${activeTab === "chat" ? "text-white" : "text-gray-400"}`}>
                  Chat
                </Text>
              </Pressable>
            </View>
          </PageContainer>
        </View>
      )}

      {/* Show Live Video when live tab is active and streamer is live */}
      {streamer.isLive && activeTab === "live" ? (
        <View className="flex-1 bg-black">
          <View className="flex-1 items-center justify-center px-6">
            <View className="w-full bg-[#151520] rounded-3xl p-8 items-center">
              {/* Live indicator */}
              <View className="flex-row items-center mb-4">
                <View className="w-3 h-3 rounded-full bg-red-600 mr-2" />
                <Text className="text-red-500 font-bold text-lg">LIVE NOW</Text>
              </View>

              {/* Streamer info */}
              <Image
                source={{ uri: streamer.avatar }}
                style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: "#EC4899" }}
              />
              <Text className="text-white text-xl font-bold mt-4">{streamer.name}</Text>
              <Text className="text-gray-400 text-center mt-2 px-4">
                {streamer.liveTitle || "Streaming now"}
              </Text>

              {/* Watch button */}
              {streamer.liveStreamUrl ? (
                <Pressable
                  onPress={async () => {
                    try {
                      await WebBrowser.openBrowserAsync(streamer.liveStreamUrl!);
                    } catch (error) {
                      Alert.alert("Error", "Could not open the stream URL");
                    }
                  }}
                  className="bg-red-600 px-8 py-4 rounded-full mt-6 flex-row items-center"
                >
                  <Ionicons name="play" size={24} color="white" />
                  <Text className="text-white text-lg font-bold ml-2">Watch Live Stream</Text>
                </Pressable>
              ) : (
                <View className="mt-6 items-center">
                  <Ionicons name="videocam-off" size={48} color="#6B7280" />
                  <Text className="text-gray-400 text-center mt-2">
                    Stream URL not available
                  </Text>
                </View>
              )}

              {/* Platform info */}
              {streamer.liveStreamUrl && (
                <Text className="text-gray-500 text-xs mt-4 text-center">
                  Opens in your browser
                </Text>
              )}
            </View>
          </View>
        </View>
      ) : streamer.isLive && activeTab === "chat" ? (
        <LiveChat streamerId={streamerId} streamerName={streamer.name} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header Carousel */}
          <View style={{ height: CAROUSEL_HEIGHT + insets.top }}>
            <Animated.ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setCurrentImageIndex(index);
              }}
            >
              {streamer.headerImages.map((image, index) => (
                <View key={index} style={{ width: SCREEN_WIDTH, height: CAROUSEL_HEIGHT + insets.top }}>
                  <Image
                    source={{ uri: image }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={["rgba(10, 10, 15, 0.3)", "rgba(10, 10, 15, 0.9)"]}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: "60%",
                    }}
                  />
                </View>
              ))}
            </Animated.ScrollView>

            {/* Back Button */}
            <Pressable
              onPress={() => navigation.goBack()}
              className="absolute left-4 bg-black/40 rounded-full p-2"
              style={{ top: insets.top + 8 }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>

            {/* Live Badge */}
            {streamer.isLive && (
              <View className="absolute top-4 right-4" style={{ top: insets.top + 16 }}>
                <Badge variant="live">
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-white mr-2" />
                    <Text className="text-white text-xs font-bold uppercase">Live</Text>
                  </View>
                </Badge>
              </View>
            )}

            {/* Carousel Indicators */}
            {streamer.headerImages.length > 1 && (
              <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
                {streamer.headerImages.map((_, index) => (
                  <View
                    key={index}
                    className="h-2 rounded-full bg-white"
                    style={{
                      width: currentImageIndex === index ? 24 : 8,
                      opacity: currentImageIndex === index ? 1 : 0.5,
                    }}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Profile Info */}
          <PageContainer>
            <View className="px-6 pt-4 pb-6">
              <View className="flex-row items-center mb-4">
                <Image
                  source={{ uri: streamer.avatar }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    borderWidth: 4,
                    borderColor: streamer.isLive ? "#EC4899" : "#8B5CF6",
                  }}
                />
                <View className="flex-1 ml-4">
                  <Text className="text-white text-2xl font-bold">{streamer.name}</Text>
                  <Text className="text-purple-400 text-lg">@{streamer.gamertag}</Text>
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="people" size={14} color="#9CA3AF" />
                    <Text className="text-gray-400 text-sm ml-1">
                      {streamer.followerCount.toLocaleString()} followers
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3 mb-6">
                {isOwner ? (
                  <Button
                    onPress={() => navigation.navigate("EditStreamerProfile", { streamerId })}
                    variant="primary"
                    className="flex-1"
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                      <Text className="text-white font-semibold ml-2">Edit Profile</Text>
                    </View>
                  </Button>
                ) : (
                  <Button
                    onPress={toggleFollow}
                    variant={isFollowing ? "secondary" : "primary"}
                    className="flex-1"
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                )}
                <Button variant="secondary" onPress={handleMessage} className="px-6">
                  <Ionicons name="chatbubble-outline" size={20} color="#8B5CF6" />
                </Button>
                <Button variant="secondary" onPress={handleBookmark} className="px-6">
                  <Ionicons
                    name={isBookmarked ? "bookmark" : "bookmark-outline"}
                    size={20}
                    color={isBookmarked ? "#F59E0B" : "#8B5CF6"}
                  />
                </Button>
                <Button variant="secondary" onPress={handleShare} className="px-6">
                  <Ionicons name="share-social-outline" size={20} color="#8B5CF6" />
                </Button>
              </View>

              {/* Bio */}
              <View className="mb-6">
                <Text className="text-gray-300 text-base leading-6">{streamer.bio}</Text>
              </View>

              {/* Streaming Platforms */}
              {streamer.streamPlatforms && (
                Object.values(streamer.streamPlatforms).some((url) => url) && (
                  <View className="mb-6">
                    <Text className="text-white text-lg font-bold mb-3">Watch Live</Text>
                    <View className="flex-row flex-wrap gap-3">
                      {streamer.streamPlatforms.twitch && (
                        <Pressable
                          onPress={() => openURL(streamer.streamPlatforms!.twitch!)}
                          className="bg-[#9146FF] rounded-xl px-4 py-3 flex-row items-center"
                        >
                          <Ionicons name="logo-twitch" size={20} color="white" />
                          <Text className="text-white ml-2 font-medium">Twitch</Text>
                        </Pressable>
                      )}
                      {streamer.streamPlatforms.youtube && (
                        <Pressable
                          onPress={() => openURL(streamer.streamPlatforms!.youtube!)}
                          className="bg-[#FF0000] rounded-xl px-4 py-3 flex-row items-center"
                        >
                          <Ionicons name="logo-youtube" size={20} color="white" />
                          <Text className="text-white ml-2 font-medium">YouTube Live</Text>
                        </Pressable>
                      )}
                      {streamer.streamPlatforms.tiktok && (
                        <Pressable
                          onPress={() => openURL(streamer.streamPlatforms!.tiktok!)}
                          className="bg-black rounded-xl px-4 py-3 flex-row items-center border border-white"
                        >
                          <Ionicons name="logo-tiktok" size={20} color="white" />
                          <Text className="text-white ml-2 font-medium">TikTok Live</Text>
                        </Pressable>
                      )}
                      {streamer.streamPlatforms.instagram && (
                        <Pressable
                          onPress={() => openURL(streamer.streamPlatforms!.instagram!)}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl px-4 py-3 flex-row items-center"
                          style={{ backgroundColor: "#E1306C" }}
                        >
                          <Ionicons name="logo-instagram" size={20} color="white" />
                          <Text className="text-white ml-2 font-medium">Instagram Live</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )
              )}

              {/* Social Links */}
              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-3">Connect</Text>
                <View className="flex-row flex-wrap gap-3">
                  {streamer.socialLinks.twitch && (
                    <Pressable
                      onPress={() => openSocialLink("twitch", streamer.socialLinks.twitch!)}
                      className="bg-[#151520] border border-purple-500/30 rounded-xl px-4 py-3 flex-row items-center"
                    >
                      <Ionicons name="logo-twitch" size={20} color="#8B5CF6" />
                      <Text className="text-white ml-2 font-medium">Twitch</Text>
                    </Pressable>
                  )}
                  {streamer.socialLinks.youtube && (
                    <Pressable
                      onPress={() => openSocialLink("youtube", streamer.socialLinks.youtube!)}
                      className="bg-[#151520] border border-red-500/30 rounded-xl px-4 py-3 flex-row items-center"
                    >
                      <Ionicons name="logo-youtube" size={20} color="#EF4444" />
                      <Text className="text-white ml-2 font-medium">YouTube</Text>
                    </Pressable>
                  )}
                  {streamer.socialLinks.instagram && (
                    <Pressable
                      onPress={() => openSocialLink("instagram", streamer.socialLinks.instagram!)}
                      className="bg-[#151520] border border-pink-500/30 rounded-xl px-4 py-3 flex-row items-center"
                    >
                      <Ionicons name="logo-instagram" size={20} color="#EC4899" />
                      <Text className="text-white ml-2 font-medium">Instagram</Text>
                    </Pressable>
                  )}
                  {streamer.socialLinks.twitter && (
                    <Pressable
                      onPress={() => openSocialLink("twitter", streamer.socialLinks.twitter!)}
                      className="bg-[#151520] border border-cyan-500/30 rounded-xl px-4 py-3 flex-row items-center"
                    >
                      <Ionicons name="logo-twitter" size={20} color="#06B6D4" />
                      <Text className="text-white ml-2 font-medium">Twitter</Text>
                    </Pressable>
                  )}
                  {streamer.socialLinks.tiktok && (
                    <Pressable
                      onPress={() => openSocialLink("tiktok", streamer.socialLinks.tiktok!)}
                      className="bg-[#151520] border border-gray-500/30 rounded-xl px-4 py-3 flex-row items-center"
                    >
                      <Ionicons name="logo-tiktok" size={20} color="#FFFFFF" />
                      <Text className="text-white ml-2 font-medium">TikTok</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Schedule */}
              {streamer.schedule.length > 0 && (
                <View className="mb-6">
                  <Text className="text-white text-lg font-bold mb-3">Streaming Schedule</Text>
                  <View className="bg-[#151520] rounded-xl p-4 border border-gray-800">
                    {streamer.schedule.map((schedule, index) => (
                      <View
                        key={index}
                        className={`flex-row justify-between py-2 ${index !== streamer.schedule.length - 1 ? "border-b border-gray-800" : ""
                          }`}
                      >
                        <Text className="text-gray-300 font-medium">{schedule.day}</Text>
                        <Text className="text-purple-400">
                          {schedule.startTime} - {schedule.endTime} {schedule.timezone}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Placeholder Sections */}
              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-3">Recent Content</Text>
                <View className="bg-[#151520] rounded-xl p-8 border border-gray-800 items-center">
                  <Ionicons name="play-circle-outline" size={48} color="#374151" />
                  <Text className="text-gray-400 mt-3">No content yet</Text>
                </View>
              </View>

              {/* Book Button */}
              <Button onPress={() => navigation.goBack()} size="lg">
                Book {streamer.name}
              </Button>
            </View>
          </PageContainer>
        </ScrollView>
      )}
    </View>
  );
};
