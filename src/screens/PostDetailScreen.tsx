import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
  Dimensions,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { WebView } from "react-native-webview";
import * as Haptics from "expo-haptics";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { Comment } from "../types/post";
import { useAppStore } from "../state/appStore";
import { useAuthStore } from "../state/authStore";
import {
  isYouTubeUrl,
  getYouTubeThumbnail,
  getYouTubeEmbedUrl,
  getPostThumbnail,
} from "../utils/videoUtils";

type Props = NativeStackScreenProps<any, "PostDetail">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function PostDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { postId } = route.params as { postId: string };

  const user = useAuthStore((s) => s.user);
  const getPost = useAppStore((s) => s.getPost);
  const likePost = useAppStore((s) => s.likePost);
  const savePost = useAppStore((s) => s.savePost);
  const addPostComment = useAppStore((s) => s.addPostComment);
  const updatePost = useAppStore((s) => s.updatePost);
  const deletePost = useAppStore((s) => s.deletePost);

  const post = getPost(postId, user?.id);

  const [commentText, setCommentText] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editCaption, setEditCaption] = useState(post?.caption || "");
  const [isPlayingYouTube, setIsPlayingYouTube] = useState(false);

  // Determine video type
  const isVideo = post?.mediaType === "video" && post?.videoUrl;
  const isYouTube = post?.videoUrl ? isYouTubeUrl(post.videoUrl) : false;
  const shouldShowNativePlayer = isVideo && !isYouTube;

  // Video player for non-YouTube videos
  const player = useVideoPlayer(shouldShowNativePlayer ? post.videoUrl! : null, (p) => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    if (post) {
      setEditCaption(post.caption);
    }
  }, [post?.caption]);

  if (!post) {
    return (
      <View className="flex-1 bg-[#0A0A0F] items-center justify-center">
        <Ionicons name="alert-circle-outline" size={48} color="#6B7280" />
        <Text className="text-gray-400 mt-4">Post not found</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          className="mt-4 bg-purple-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isOwner = user?.id === post.user.id;
  const thumbnailUrl = getPostThumbnail(post);
  const youtubeEmbedUrl = isYouTube ? getYouTubeEmbedUrl(post.videoUrl!) : null;

  const handleAddComment = () => {
    if (commentText.trim() && user) {
      const newComment: Comment = {
        id: `c${Date.now()}`,
        username: user.username,
        avatarUrl: user.avatar,
        text: commentText.trim(),
        createdAt: new Date().toISOString(),
      };

      addPostComment(postId, newComment);
      setCommentText("");
      Keyboard.dismiss();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleLike = () => {
    if (user) {
      likePost(postId, user.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSave = () => {
    if (user) {
      savePost(postId, user.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleEditSave = () => {
    if (user && editCaption.trim() !== post.caption) {
      const success = updatePost(postId, user.id, { caption: editCaption.trim() });
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    setShowEditModal(false);
  };

  const handleDelete = () => {
    if (user) {
      const success = deletePost(postId, user.id);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        navigation.goBack();
      }
    }
    setShowDeleteConfirm(false);
  };

  const handleOpenYouTubeExternal = () => {
    if (post.videoUrl) {
      Linking.openURL(post.videoUrl);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return `${Math.floor(seconds / 604800)}w`;
  };

  // Re-fetch post data to get updated state
  const currentPost = getPost(postId, user?.id);
  const displayPost = currentPost || post;

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800"
          style={{ paddingTop: insets.top + 8 }}
        >
          <View className="flex-row items-center">
            <Pressable onPress={() => navigation.goBack()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <Text className="text-white text-lg font-semibold">Post</Text>
          </View>
          {isOwner && (
            <Pressable onPress={() => setShowOptions(true)} className="p-2">
              <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
            </Pressable>
          )}
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Media Content */}
          <View className="w-full aspect-square bg-black">
            {isYouTube && youtubeEmbedUrl ? (
              // YouTube Video Player
              isPlayingYouTube ? (
                <WebView
                  source={{ uri: youtubeEmbedUrl }}
                  style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                  allowsInlineMediaPlayback
                  mediaPlaybackRequiresUserAction={false}
                  javaScriptEnabled
                  domStorageEnabled
                />
              ) : (
                // YouTube Thumbnail with Play Button
                <Pressable
                  onPress={() => setIsPlayingYouTube(true)}
                  className="w-full h-full"
                >
                  {thumbnailUrl && (
                    <Image
                      source={{ uri: thumbnailUrl }}
                      style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                      contentFit="cover"
                    />
                  )}
                  <View className="absolute inset-0 items-center justify-center bg-black/40">
                    <View className="bg-red-600 rounded-2xl px-6 py-4 flex-row items-center">
                      <Ionicons name="logo-youtube" size={32} color="#FFFFFF" />
                      <Text className="text-white font-bold text-lg ml-2">Play Video</Text>
                    </View>
                  </View>
                  {/* YouTube badge */}
                  <View className="absolute top-3 left-3 bg-red-600 rounded-lg px-3 py-1.5 flex-row items-center">
                    <Ionicons name="logo-youtube" size={18} color="#FFFFFF" />
                    <Text className="text-white text-sm font-bold ml-1.5">YouTube</Text>
                  </View>
                  {/* Open external option */}
                  <Pressable
                    onPress={handleOpenYouTubeExternal}
                    className="absolute top-3 right-3 bg-black/60 rounded-full p-2"
                  >
                    <Ionicons name="open-outline" size={20} color="#FFFFFF" />
                  </Pressable>
                </Pressable>
              )
            ) : shouldShowNativePlayer && player ? (
              // Native Video Player
              <VideoView
                player={player}
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                contentFit="cover"
                nativeControls={true}
              />
            ) : displayPost.imageUrl ? (
              // Image
              <Image
                source={{ uri: displayPost.imageUrl }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                contentFit="cover"
              />
            ) : (
              // Placeholder
              <View className="flex-1 items-center justify-center bg-gray-900">
                <Ionicons name="image-outline" size={64} color="#4B5563" />
              </View>
            )}
          </View>

          {/* Actions */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <View className="flex-row items-center gap-4">
              <Pressable onPress={handleLike} className="flex-row items-center">
                <Ionicons
                  name={displayPost.isLiked ? "heart" : "heart-outline"}
                  size={28}
                  color={displayPost.isLiked ? "#EF4444" : "#FFFFFF"}
                />
                <Text className="text-white ml-2 font-semibold">
                  {displayPost.likeCount}
                </Text>
              </Pressable>
              <View className="flex-row items-center">
                <Ionicons name="chatbubble-outline" size={26} color="#FFFFFF" />
                <Text className="text-white ml-2 font-semibold">
                  {displayPost.commentCount}
                </Text>
              </View>
            </View>
            <Pressable onPress={handleSave}>
              <Ionicons
                name={displayPost.isSaved ? "bookmark" : "bookmark-outline"}
                size={26}
                color={displayPost.isSaved ? "#8B5CF6" : "#FFFFFF"}
              />
            </Pressable>
          </View>

          {/* Post Header with Caption */}
          <View className="px-4 pb-4">
            <View className="flex-row items-center mb-2">
              {displayPost.user.avatarUrl ? (
                <Image
                  source={{ uri: displayPost.user.avatarUrl }}
                  style={{ width: 36, height: 36, borderRadius: 18 }}
                  contentFit="cover"
                />
              ) : (
                <View className="w-9 h-9 rounded-full bg-purple-500/30 items-center justify-center">
                  <Text className="text-purple-400 font-bold">
                    {displayPost.user.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View className="ml-3 flex-1">
                <Text className="text-white font-semibold">
                  {displayPost.user.username}
                </Text>
                <Text className="text-gray-500 text-xs">
                  {formatTimeAgo(displayPost.createdAt)}
                </Text>
              </View>
              {isYouTube && (
                <View className="bg-red-600/20 rounded-lg px-2 py-1">
                  <Text className="text-red-400 text-xs font-medium">YouTube Video</Text>
                </View>
              )}
            </View>
            {displayPost.caption && (
              <Text className="text-white text-base leading-5">
                {displayPost.caption}
              </Text>
            )}
          </View>

          {/* Comments Header */}
          <View className="px-4 py-3 border-t border-gray-800">
            <Text className="text-white font-semibold text-base">
              Comments ({displayPost.commentCount})
            </Text>
          </View>

          {/* Comments List */}
          <View className="px-4">
            {displayPost.comments.length === 0 ? (
              <View className="py-8 items-center">
                <Ionicons name="chatbubble-outline" size={32} color="#4B5563" />
                <Text className="text-gray-500 mt-2">No comments yet</Text>
                <Text className="text-gray-600 text-sm">Be the first to comment</Text>
              </View>
            ) : (
              displayPost.comments.map((comment) => (
                <View key={comment.id} className="flex-row items-start py-3">
                  {comment.avatarUrl ? (
                    <Image
                      source={{ uri: comment.avatarUrl }}
                      style={{ width: 32, height: 32, borderRadius: 16 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="w-8 h-8 rounded-full bg-gray-700 items-center justify-center">
                      <Text className="text-gray-400 font-bold text-xs">
                        {comment.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1 ml-3">
                    <Text className="text-white">
                      <Text className="font-semibold">{comment.username}</Text>
                      <Text className="text-gray-200"> {comment.text}</Text>
                    </Text>
                    <Text className="text-gray-500 text-xs mt-1">
                      {formatTimeAgo(comment.createdAt)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Add Comment Input */}
        <View
          className="flex-row items-center px-4 py-3 border-t border-gray-800 bg-[#0A0A0F]"
          style={{ paddingBottom: insets.bottom || 12 }}
        >
          {user?.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={{ width: 36, height: 36, borderRadius: 18 }}
              contentFit="cover"
            />
          ) : (
            <View className="w-9 h-9 rounded-full bg-purple-500/30 items-center justify-center">
              <Text className="text-purple-400 font-bold">
                {user?.username?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
          )}
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
            placeholderTextColor="#6B7280"
            className="flex-1 mx-3 text-white py-2"
            multiline
            maxLength={500}
          />
          <Pressable onPress={handleAddComment} disabled={!commentText.trim()}>
            <Text
              className={
                commentText.trim()
                  ? "text-[#8B5CF6] font-semibold"
                  : "text-gray-600 font-semibold"
              }
            >
              Post
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Options Modal */}
      <Modal visible={showOptions} animationType="fade" transparent>
        <Pressable
          className="flex-1 bg-black/60 justify-end"
          onPress={() => setShowOptions(false)}
        >
          <View
            className="bg-[#1A1A2E] rounded-t-3xl"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="w-10 h-1 bg-gray-600 rounded-full self-center my-3" />

            <Pressable
              onPress={() => {
                setShowOptions(false);
                setShowEditModal(true);
              }}
              className="flex-row items-center px-6 py-4 border-b border-gray-800"
            >
              <Ionicons name="create-outline" size={24} color="#8B5CF6" />
              <Text className="text-white text-lg ml-4">Edit Caption</Text>
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
              onPress={() => setShowOptions(false)}
              className="mx-4 mt-2 py-4 bg-[#2A2A3E] rounded-xl"
            >
              <Text className="text-white text-center font-semibold">Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Edit Caption Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View
              className="bg-[#1A1A2E] rounded-t-3xl p-6"
              style={{ paddingBottom: insets.bottom + 16 }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-xl font-bold">Edit Caption</Text>
                <Pressable onPress={() => setShowEditModal(false)}>
                  <Ionicons name="close" size={28} color="#9CA3AF" />
                </Pressable>
              </View>

              <TextInput
                value={editCaption}
                onChangeText={setEditCaption}
                placeholder="Write a caption..."
                placeholderTextColor="#6B7280"
                className="bg-[#2A2A3E] text-white px-4 py-4 rounded-xl mb-4"
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
                style={{ minHeight: 120 }}
              />

              <Text className="text-gray-500 text-xs text-right mb-4">
                {editCaption.length}/500
              </Text>

              <Pressable
                onPress={handleEditSave}
                className="bg-purple-600 py-4 rounded-xl"
              >
                <Text className="text-white text-center font-bold text-base">
                  Save Changes
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
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
              onPress={() => setShowDeleteConfirm(false)}
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
