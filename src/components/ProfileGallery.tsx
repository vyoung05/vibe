import React, { useState } from "react";
import { View, Text, Pressable, FlatList, Dimensions, Modal } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import type { Post } from "../types/post";
import { useAppStore } from "../state/appStore";
import { useAuthStore } from "../state/authStore";
import { getPostThumbnail, isYouTubeUrl } from "../utils/videoUtils";

interface ProfileGalleryProps {
  posts: Post[];
  onPostPress: (postId: string) => void;
  isOwnProfile?: boolean;
}

export function ProfileGallery({ posts, onPostPress, isOwnProfile = true }: ProfileGalleryProps) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const itemSize = (screenWidth - 8) / 3; // 3 columns with 2px gaps

  const user = useAuthStore((s) => s.user);
  const deletePost = useAppStore((s) => s.deletePost);

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLongPress = (post: Post) => {
    if (isOwnProfile) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedPost(post);
      setShowOptions(true);
    }
  };

  const handleDelete = () => {
    if (selectedPost && user) {
      const success = deletePost(selectedPost.id, user.id);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }
    setShowDeleteConfirm(false);
    setShowOptions(false);
    setSelectedPost(null);
  };

  const renderGridItem = ({ item }: { item: Post }) => {
    const isVideo = item.mediaType === "video";
    const isYouTube = item.videoUrl ? isYouTubeUrl(item.videoUrl) : false;

    // Get the best thumbnail using our utility
    const thumbnailUrl = getPostThumbnail(item);

    return (
      <Pressable
        onPress={() => onPostPress(item.id)}
        onLongPress={() => handleLongPress(item)}
        delayLongPress={300}
        style={{
          width: itemSize,
          height: itemSize,
          margin: 1,
        }}
      >
        <View className="relative w-full h-full bg-gray-900">
          {thumbnailUrl ? (
            <Image
              source={{ uri: thumbnailUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View className="w-full h-full bg-gray-800 items-center justify-center">
              {isVideo ? (
                <Ionicons name="videocam" size={32} color="#6B7280" />
              ) : (
                <Ionicons name="image-outline" size={32} color="#6B7280" />
              )}
            </View>
          )}

          {/* Video indicator overlay */}
          {isVideo && (
            <View className="absolute top-2 right-2">
              {isYouTube ? (
                <View className="bg-red-600/90 rounded-md px-1.5 py-0.5 flex-row items-center">
                  <Ionicons name="logo-youtube" size={12} color="#FFFFFF" />
                </View>
              ) : (
                <View className="bg-black/70 rounded-full p-1.5 flex-row items-center">
                  <Ionicons name="play" size={14} color="#FFFFFF" />
                </View>
              )}
            </View>
          )}

          {/* Engagement stats overlay */}
          <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-1.5">
            <View className="flex-row items-center justify-center gap-3">
              <View className="flex-row items-center">
                <Ionicons name="heart" size={12} color="#FFFFFF" />
                <Text className="text-white text-xs ml-1 font-medium">
                  {item.likeCount >= 1000
                    ? `${(item.likeCount / 1000).toFixed(1)}K`
                    : item.likeCount}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="chatbubble" size={12} color="#FFFFFF" />
                <Text className="text-white text-xs ml-1 font-medium">
                  {item.commentCount >= 1000
                    ? `${(item.commentCount / 1000).toFixed(1)}K`
                    : item.commentCount}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  if (posts.length === 0) {
    return (
      <View className="items-center justify-center py-16 px-6">
        <View className="bg-purple-500/20 rounded-full p-6 mb-4">
          <Ionicons name="images-outline" size={48} color="#8B5CF6" />
        </View>
        <Text className="text-white text-xl font-bold mb-2">No Posts Yet</Text>
        <Text className="text-gray-400 text-center text-sm">
          Start sharing your moments with the community
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Hint for long press */}
      {isOwnProfile && posts.length > 0 && (
        <View className="px-4 py-2 flex-row items-center justify-center">
          <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
          <Text className="text-gray-500 text-xs ml-1">
            Long press on a post for options
          </Text>
        </View>
      )}

      <FlatList
        data={posts}
        renderItem={renderGridItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        scrollEnabled={false}
        contentContainerStyle={{
          paddingHorizontal: 1,
          paddingTop: 1,
        }}
      />

      {/* Options Modal */}
      <Modal visible={showOptions} animationType="fade" transparent>
        <Pressable
          className="flex-1 bg-black/60 justify-end"
          onPress={() => {
            setShowOptions(false);
            setSelectedPost(null);
          }}
        >
          <View
            className="bg-[#1A1A2E] rounded-t-3xl"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="w-10 h-1 bg-gray-600 rounded-full self-center my-3" />

            {/* Preview */}
            {selectedPost && (
              <View className="mx-4 mb-4 flex-row items-center bg-[#2A2A3E] rounded-xl p-3">
                {(() => {
                  const thumb = getPostThumbnail(selectedPost);
                  return thumb ? (
                    <Image
                      source={{ uri: thumb }}
                      style={{ width: 50, height: 50, borderRadius: 8 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="w-12 h-12 rounded-lg bg-gray-700 items-center justify-center">
                      <Ionicons
                        name={selectedPost.mediaType === "video" ? "videocam" : "image"}
                        size={20}
                        color="#6B7280"
                      />
                    </View>
                  );
                })()}
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center">
                    <Text className="text-white font-medium flex-1" numberOfLines={1}>
                      {selectedPost.caption || "No caption"}
                    </Text>
                    {selectedPost.mediaType === "video" && selectedPost.videoUrl && isYouTubeUrl(selectedPost.videoUrl) && (
                      <View className="bg-red-600 rounded px-1.5 py-0.5 ml-2">
                        <Text className="text-white text-xs font-bold">YT</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-gray-500 text-xs mt-0.5">
                    {selectedPost.likeCount} likes • {selectedPost.commentCount} comments
                  </Text>
                </View>
              </View>
            )}

            <Pressable
              onPress={() => {
                setShowOptions(false);
                if (selectedPost) {
                  onPostPress(selectedPost.id);
                }
              }}
              className="flex-row items-center px-6 py-4 border-b border-gray-800"
            >
              <Ionicons name="eye-outline" size={24} color="#8B5CF6" />
              <Text className="text-white text-lg ml-4">View Post</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setShowOptions(false);
                if (selectedPost) {
                  onPostPress(selectedPost.id);
                }
              }}
              className="flex-row items-center px-6 py-4 border-b border-gray-800"
            >
              <Ionicons name="create-outline" size={24} color="#22C55E" />
              <Text className="text-white text-lg ml-4">Edit Post</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setShowOptions(false);
                setShowDeleteConfirm(true);
              }}
              className="flex-row items-center px-6 py-4"
            >
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
              <Text className="text-red-400 text-lg ml-4">Delete Post</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setShowOptions(false);
                setSelectedPost(null);
              }}
              className="mx-4 mt-2 py-4 bg-[#2A2A3E] rounded-xl"
            >
              <Text className="text-white text-center font-semibold">Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirm} animationType="fade" transparent>
        <View className="flex-1 bg-black/70 items-center justify-center px-6">
          <View className="bg-[#1A1A2E] rounded-2xl p-6 w-full">
            <View className="items-center mb-4">
              <View className="bg-red-500/20 rounded-full p-4 mb-3">
                <Ionicons name="trash" size={32} color="#EF4444" />
              </View>
              <Text className="text-white text-xl font-bold text-center">
                Delete Post?
              </Text>
              <Text className="text-gray-400 text-center mt-2">
                This action cannot be undone. Your post will be permanently deleted.
              </Text>
            </View>

            <Pressable
              onPress={handleDelete}
              className="bg-red-500 rounded-xl py-4 mb-3"
            >
              <Text className="text-white font-semibold text-center">Delete</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setShowDeleteConfirm(false);
                setSelectedPost(null);
              }}
              className="bg-[#2A2A3E] rounded-xl py-4"
            >
              <Text className="text-white font-semibold text-center">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
