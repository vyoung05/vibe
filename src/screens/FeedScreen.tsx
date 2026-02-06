import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Dimensions, Modal, TextInput, Alert, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { VideoView, useVideoPlayer } from "expo-video";
import YoutubePlayer from "react-native-youtube-iframe";
import { useAppStore } from "../state/appStore";
import { useAuthStore } from "../state/authStore";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import type { VideoContent } from "../types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Helper functions for YouTube
const getYouTubeVideoId = (url: string): string | null => {
  const cleanUrl = url.replace(/\s+/g, "");
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/i,
    /youtube\.com\/shorts\/([^&\n?#]+)/i,
    /youtube\.com\/live\/([^&\n?#]+)/i,
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

const isYouTubeUrl = (url: string): boolean => {
  return url.includes("youtube.com") || url.includes("youtu.be");
};

// VideoPost component for inline video playback
interface VideoPostProps {
  post: VideoContent;
  creator: any;
  creatorAvatar: string;
  isLiked: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onLike: () => void;
  onNavigateToProfile: () => void;
}

const VideoPost: React.FC<VideoPostProps> = ({
  post,
  creator,
  creatorAvatar,
  isLiked,
  isPlaying,
  onTogglePlay,
  onLike,
  onNavigateToProfile,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const isYouTube = isYouTubeUrl(post.videoUrl);
  const youtubeVideoId = isYouTube ? getYouTubeVideoId(post.videoUrl) : null;

  // Always call the hook, but only use it for non-YouTube videos
  const player = useVideoPlayer(post.videoUrl, (player) => {
    player.loop = false;
  });

  useEffect(() => {
    if (!isYouTube && player && isPlaying) {
      player.play();
    } else if (!isYouTube && player && !isPlaying) {
      player.pause();
    }
  }, [isPlaying, player, isYouTube]);

  return (
    <View key={post.id} className="mb-1" style={{ width: SCREEN_WIDTH }}>
      <View style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.25, backgroundColor: "#000" }}>
        {/* Video Player or Thumbnail */}
        {isPlaying ? (
          <>
            {isYouTube && youtubeVideoId ? (
              <YoutubePlayer
                height={SCREEN_WIDTH * 1.25}
                width={SCREEN_WIDTH}
                videoId={youtubeVideoId}
                play={isPlaying}
                onReady={() => setIsLoading(false)}
                onError={(error: string) => console.log("[VideoPost] YouTube error:", error)}
              />
            ) : (
              <VideoView
                player={player}
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.25 }}
                contentFit="contain"
                nativeControls={false}
              />
            )}

            {/* Loading indicator */}
            {isLoading && (
              <View className="absolute inset-0 items-center justify-center bg-black">
                <ActivityIndicator size="large" color="#8B5CF6" />
              </View>
            )}
          </>
        ) : (
          <>
            {/* Thumbnail */}
            <Image
              source={{ uri: post.thumbnailUrl || post.videoUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />

            {/* Play Button Overlay */}
            <Pressable
              className="absolute inset-0 items-center justify-center"
              onPress={onTogglePlay}
            >
              <View className="bg-black/50 rounded-full p-4">
                <Ionicons name="play" size={48} color="white" />
              </View>
            </Pressable>
          </>
        )}

        {/* Gradient Overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "40%",
          }}
        />

        {/* Pause overlay when playing */}
        {isPlaying && (
          <Pressable
            className="absolute inset-0"
            onPress={onTogglePlay}
          />
        )}

        {/* Action Buttons (Right Side) */}
        <View className="absolute right-3 bottom-20 items-center" style={{ zIndex: 10 }}>
          {/* Like Button */}
          <Pressable
            onPress={onLike}
            className="items-center mb-6"
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={32}
              color={isLiked ? "#EF4444" : "white"}
            />
            <Text className="text-white text-xs font-bold mt-1">
              {post.likes.length}
            </Text>
          </Pressable>

          {/* Comment Button */}
          <Pressable
            onPress={onNavigateToProfile}
            className="items-center mb-6"
          >
            <Ionicons name="chatbubble-outline" size={30} color="white" />
            <Text className="text-white text-xs font-bold mt-1">
              {post.comments.length}
            </Text>
          </Pressable>

          {/* Share Button */}
          <Pressable className="items-center">
            <Ionicons name="paper-plane-outline" size={30} color="white" />
            <Text className="text-white text-xs font-bold mt-1">Share</Text>
          </Pressable>
        </View>

        {/* Post Info (Bottom Left) */}
        <View className="absolute left-3 right-16 bottom-3" style={{ zIndex: 10 }}>
          {/* Creator Info */}
          <Pressable
            onPress={onNavigateToProfile}
            className="flex-row items-center mb-2"
          >
            <Image
              source={{ uri: creatorAvatar }}
              style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: "white" }}
              contentFit="cover"
            />
            <Text className="text-white font-bold text-sm ml-2">{post.streamerName}</Text>
          </Pressable>

          {/* Title and Description */}
          <Text className="text-white font-bold text-base mb-1" numberOfLines={2}>
            {post.title}
          </Text>
          {post.description && (
            <Text className="text-white text-sm" numberOfLines={2}>
              {post.description}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export const FeedScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const streamers = useAppStore((s) => s.streamers);
  const videoContent = useAppStore((s) => s.videoContent);
  const addVideoContent = useAppStore((s) => s.addVideoContent);
  const likeVideoContent = useAppStore((s) => s.likeVideoContent);
  const user = useAuthStore((s) => s.user);

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postType, setPostType] = useState<"video" | "photo">("video");
  const [postTitle, setPostTitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [postThumbnail, setPostThumbnail] = useState("");
  const [postVisibility, setPostVisibility] = useState<"public" | "free" | "superfan">("public");
  const [refreshing, setRefreshing] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Check if user is streamer or admin
  // Check both s.id (legacy) and s.userId (linked accounts)
  const isStreamer = streamers.some((s) => s.id === user?.id || s.userId === user?.id) || user?.role === "admin";
  const userStreamer = streamers.find((s) => s.id === user?.id || s.userId === user?.id);

  // All authenticated users can create posts
  const canCreatePost = !!user;

  // Get recent videos - filtered and sorted
  const recentVideos = videoContent
    .filter((v) => {
      if (v.visibility === "superfan" && user?.tier !== "superfan") return false;
      if (v.visibility === "free" && !user) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh - in real app, this would fetch new data from server
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPostThumbnail(result.assets[0].uri);
      if (!postUrl && postType === "photo") {
        setPostUrl(result.assets[0].uri);
      }
    }
  };

  const handleCreatePost = () => {
    if (!user) {
      Alert.alert("Error", "Please sign in to create posts");
      return;
    }

    if (!postTitle.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    if (!postUrl.trim()) {
      Alert.alert("Error", postType === "video" ? "Please enter a video URL" : "Please select a photo");
      return;
    }

    const creatorName = userStreamer?.name || user.username;
    const creatorId = user.id;
    const creatorAvatar = userStreamer?.avatar || user.avatar || "https://i.pravatar.cc/300?img=50";

    const newPost: VideoContent = {
      id: "post-" + Date.now(),
      streamerId: creatorId,
      streamerName: creatorName,
      streamerAvatar: creatorAvatar,
      title: postTitle.trim(),
      description: postDescription.trim(),
      videoUrl: postUrl.trim(),
      thumbnailUrl: postThumbnail.trim() || undefined,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
      visibility: postVisibility,
    };

    addVideoContent(newPost);

    // Reset form
    setPostTitle("");
    setPostDescription("");
    setPostUrl("");
    setPostThumbnail("");
    setPostVisibility("public");
    setShowCreatePost(false);

    Alert.alert("Success", `${postType === "video" ? "Video" : "Photo"} posted successfully!`);
  };

  const handleLike = (postId: string) => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to like posts");
      return;
    }
    likeVideoContent(postId, user.id);
  };

  const renderPost = (post: typeof videoContent[0]) => {
    // Use stored avatar from post, or fallback to streamer/user avatar
    const creator = streamers.find((s) => s.id === post.streamerId);

    let creatorAvatar = post.streamerAvatar || "https://i.pravatar.cc/300?img=50";
    if (!post.streamerAvatar) {
      // Fallback for old posts without stored avatar
      if (creator) {
        creatorAvatar = creator.avatar;
      } else if (user?.id === post.streamerId) {
        creatorAvatar = user.avatar || "https://i.pravatar.cc/300?img=50";
      }
    }

    const isLiked = post.likes.includes(user?.id || "");
    const isPlaying = playingVideoId === post.id;

    return (
      <VideoPost
        key={post.id}
        post={post}
        creator={creator}
        creatorAvatar={creatorAvatar}
        isLiked={isLiked}
        isPlaying={isPlaying}
        onTogglePlay={() => setPlayingVideoId(isPlaying ? null : post.id)}
        onLike={() => handleLike(post.id)}
        onNavigateToProfile={() => {
          if (creator) {
            navigation.navigate("StreamerProfile", { streamerId: creator.id });
          }
        }}
      />
    );
  };

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View
        className="absolute top-0 left-0 right-0 z-10 flex-row items-center justify-between px-4"
        style={{ paddingTop: insets.top + 12, paddingBottom: 12, backgroundColor: "rgba(0,0,0,0.3)" }}
      >
        <Text className="text-white text-xl font-bold">Feed</Text>
        <Pressable onPress={() => setShowCreatePost(true)} className="bg-purple-600 rounded-full p-2">
          <Ionicons name="add" size={24} color="white" />
        </Pressable>
      </View>

      {/* Posts */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_WIDTH * 1.25 + 4}
        decelerationRate="fast"
        style={{ marginTop: insets.top + 56 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B5CF6"
            colors={["#8B5CF6"]}
          />
        }
      >
        {recentVideos.length > 0 ? (
          recentVideos.map(renderPost)
        ) : (
          <View className="items-center justify-center py-20 px-6" style={{ height: SCREEN_HEIGHT - 200 }}>
            <Ionicons name="images-outline" size={64} color="#6B7280" />
            <Text className="text-white text-xl font-bold mt-4">No Posts Yet</Text>
            <Text className="text-gray-400 text-center mt-2">
              Be the first to share something! Tap the + button to create a post.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Create Post Modal */}
      <Modal
        visible={showCreatePost}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreatePost(false)}
      >
        <View className="flex-1 bg-black/80">
          <View className="flex-1 justify-end">
            <View
              className="bg-[#151520] rounded-t-3xl"
              style={{
                paddingTop: 24,
                paddingBottom: insets.bottom + 24,
                maxHeight: "90%"
              }}
            >
              {/* Header */}
              <View className="px-6 pb-4 border-b border-gray-800 flex-row items-center justify-between">
                <Text className="text-white text-2xl font-bold">Create Post</Text>
                <Pressable
                  onPress={() => setShowCreatePost(false)}
                  className="bg-gray-800 rounded-full p-2"
                >
                  <Ionicons name="close" size={24} color="white" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="px-6 py-6">
                  {/* Post Type Toggle */}
                  <Text className="text-gray-400 text-sm font-medium mb-3">Post Type</Text>
                  <View className="flex-row mb-6">
                    <Pressable
                      onPress={() => setPostType("video")}
                      className={`flex-1 mr-2 py-3 rounded-xl border ${
                        postType === "video"
                          ? "bg-purple-600 border-purple-600"
                          : "bg-gray-800 border-gray-700"
                      }`}
                    >
                      <View className="items-center flex-row justify-center">
                        <Ionicons
                          name="videocam"
                          size={20}
                          color={postType === "video" ? "white" : "#9CA3AF"}
                        />
                        <Text
                          className={`ml-2 font-medium ${
                            postType === "video" ? "text-white" : "text-gray-400"
                          }`}
                        >
                          Video
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => setPostType("photo")}
                      className={`flex-1 ml-2 py-3 rounded-xl border ${
                        postType === "photo"
                          ? "bg-purple-600 border-purple-600"
                          : "bg-gray-800 border-gray-700"
                      }`}
                    >
                      <View className="items-center flex-row justify-center">
                        <Ionicons
                          name="image"
                          size={20}
                          color={postType === "photo" ? "white" : "#9CA3AF"}
                        />
                        <Text
                          className={`ml-2 font-medium ${
                            postType === "photo" ? "text-white" : "text-gray-400"
                          }`}
                        >
                          Photo
                        </Text>
                      </View>
                    </Pressable>
                  </View>

                  {/* Title Input */}
                  <Text className="text-gray-400 text-sm font-medium mb-3">Title</Text>
                  <TextInput
                    value={postTitle}
                    onChangeText={setPostTitle}
                    placeholder="Give your post a catchy title"
                    placeholderTextColor="#6B7280"
                    className="bg-gray-800 text-white px-4 py-3 rounded-xl mb-6"
                  />

                  {/* Description Input */}
                  <Text className="text-gray-400 text-sm font-medium mb-3">Description</Text>
                  <TextInput
                    value={postDescription}
                    onChangeText={setPostDescription}
                    placeholder="Tell your audience what this is about..."
                    placeholderTextColor="#6B7280"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    className="bg-gray-800 text-white px-4 py-3 rounded-xl mb-6"
                    style={{ minHeight: 100 }}
                  />

                  {/* Video URL or Photo Picker */}
                  {postType === "video" ? (
                    <>
                      <Text className="text-gray-400 text-sm font-medium mb-3">Video URL</Text>
                      <TextInput
                        value={postUrl}
                        onChangeText={setPostUrl}
                        placeholder="Enter YouTube or video URL"
                        placeholderTextColor="#6B7280"
                        className="bg-gray-800 text-white px-4 py-3 rounded-xl mb-6"
                        autoCapitalize="none"
                        keyboardType="url"
                      />
                    </>
                  ) : (
                    <>
                      <Text className="text-gray-400 text-sm font-medium mb-3">Photo</Text>
                      <Pressable
                        onPress={pickImage}
                        className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl py-8 mb-6"
                      >
                        {postUrl ? (
                          <View className="items-center">
                            <Image
                              source={{ uri: postUrl }}
                              style={{ width: "90%", height: 200, borderRadius: 12 }}
                              contentFit="cover"
                            />
                            <Text className="text-purple-400 font-medium mt-4">Tap to change photo</Text>
                          </View>
                        ) : (
                          <View className="items-center">
                            <Ionicons name="image-outline" size={48} color="#6B7280" />
                            <Text className="text-gray-400 mt-3">Tap to select a photo</Text>
                          </View>
                        )}
                      </Pressable>
                    </>
                  )}

                  {/* Thumbnail Picker (for videos) */}
                  {postType === "video" && (
                    <>
                      <Text className="text-gray-400 text-sm font-medium mb-3">
                        Thumbnail (Optional)
                      </Text>
                      <Pressable
                        onPress={pickImage}
                        className="bg-gray-800 border border-gray-700 rounded-xl py-6 mb-6"
                      >
                        {postThumbnail ? (
                          <View className="items-center">
                            <Image
                              source={{ uri: postThumbnail }}
                              style={{ width: "90%", height: 150, borderRadius: 12 }}
                              contentFit="cover"
                            />
                            <Text className="text-purple-400 font-medium mt-4">
                              Tap to change thumbnail
                            </Text>
                          </View>
                        ) : (
                          <View className="items-center">
                            <Ionicons name="image-outline" size={40} color="#6B7280" />
                            <Text className="text-gray-400 mt-2">Add custom thumbnail</Text>
                          </View>
                        )}
                      </Pressable>
                    </>
                  )}

                  {/* Visibility Selector */}
                  <Text className="text-gray-400 text-sm font-medium mb-3">Who can see this?</Text>
                  <View className="mb-6">
                    <Pressable
                      onPress={() => setPostVisibility("public")}
                      className={`p-4 rounded-xl border mb-3 ${
                        postVisibility === "public"
                          ? "bg-purple-600/20 border-purple-600"
                          : "bg-gray-800 border-gray-700"
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Ionicons
                            name="globe-outline"
                            size={20}
                            color={postVisibility === "public" ? "#8B5CF6" : "#9CA3AF"}
                          />
                          <View className="ml-3">
                            <Text
                              className={`font-medium ${
                                postVisibility === "public" ? "text-purple-400" : "text-white"
                              }`}
                            >
                              Public
                            </Text>
                            <Text className="text-gray-400 text-xs">Everyone can see this</Text>
                          </View>
                        </View>
                        {postVisibility === "public" && (
                          <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
                        )}
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={() => setPostVisibility("free")}
                      className={`p-4 rounded-xl border mb-3 ${
                        postVisibility === "free"
                          ? "bg-blue-600/20 border-blue-600"
                          : "bg-gray-800 border-gray-700"
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Ionicons
                            name="people-outline"
                            size={20}
                            color={postVisibility === "free" ? "#3B82F6" : "#9CA3AF"}
                          />
                          <View className="ml-3">
                            <Text
                              className={`font-medium ${
                                postVisibility === "free" ? "text-blue-400" : "text-white"
                              }`}
                            >
                              Free Users
                            </Text>
                            <Text className="text-gray-400 text-xs">Only signed-in users</Text>
                          </View>
                        </View>
                        {postVisibility === "free" && (
                          <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                        )}
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={() => setPostVisibility("superfan")}
                      className={`p-4 rounded-xl border ${
                        postVisibility === "superfan"
                          ? "bg-pink-600/20 border-pink-600"
                          : "bg-gray-800 border-gray-700"
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Ionicons
                            name="star-outline"
                            size={20}
                            color={postVisibility === "superfan" ? "#EC4899" : "#9CA3AF"}
                          />
                          <View className="ml-3">
                            <Text
                              className={`font-medium ${
                                postVisibility === "superfan" ? "text-pink-400" : "text-white"
                              }`}
                            >
                              Super Fans Only
                            </Text>
                            <Text className="text-gray-400 text-xs">Exclusive for Super Fans</Text>
                          </View>
                        </View>
                        {postVisibility === "superfan" && (
                          <Ionicons name="checkmark-circle" size={24} color="#EC4899" />
                        )}
                      </View>
                    </Pressable>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row mt-4">
                    <Pressable
                      onPress={() => {
                        setShowCreatePost(false);
                        setPostTitle("");
                        setPostDescription("");
                        setPostUrl("");
                        setPostThumbnail("");
                        setPostVisibility("public");
                      }}
                      className="flex-1 bg-gray-800 py-4 rounded-xl mr-3"
                    >
                      <Text className="text-white font-bold text-center">Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleCreatePost}
                      className="flex-1 bg-purple-600 py-4 rounded-xl"
                    >
                      <Text className="text-white font-bold text-center">Create Post</Text>
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
