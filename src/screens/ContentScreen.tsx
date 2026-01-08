import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Image as RNImage,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../state/authStore";
import { useAppStore } from "../state/appStore";
import { VideoPlayer } from "../components/VideoPlayer";
import type { VideoContent, ContentVisibility } from "../types";

export const ContentScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const videoContent = useAppStore((s) => s.videoContent);
  const addVideoContent = useAppStore((s) => s.addVideoContent);
  const deleteVideoContent = useAppStore((s) => s.deleteVideoContent);
  const likeVideoContent = useAppStore((s) => s.likeVideoContent);
  const addVideoComment = useAppStore((s) => s.addVideoComment);
  const streamers = useAppStore((s) => s.streamers);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    visibility: "public" as ContentVisibility,
  });

  // Check if user is admin or streamer
  const isAdmin = user?.role === "admin";
  const userStreamer = streamers.find((s) => s.id === user?.id);
  const canUpload = isAdmin || !!userStreamer;

  const handleUploadVideo = () => {
    if (!uploadForm.title || !uploadForm.videoUrl || !user) return;

    // Extract YouTube video ID if it's a YouTube URL
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

    // Generate YouTube thumbnail URL if no custom thumbnail provided
    let thumbnailUrl = uploadForm.thumbnailUrl;
    if (!thumbnailUrl) {
      const isYouTube = uploadForm.videoUrl.includes("youtube.com") || uploadForm.videoUrl.includes("youtu.be");
      if (isYouTube) {
        const videoId = getYouTubeVideoId(uploadForm.videoUrl);
        if (videoId) {
          // Use maxresdefault for highest quality, fallback to hqdefault if not available
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
      }

      // Fallback to default image if still no thumbnail
      if (!thumbnailUrl) {
        thumbnailUrl = "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop";
      }
    }

    const newVideo: VideoContent = {
      id: "video-" + Date.now(),
      streamerId: userStreamer?.id || user.id,
      streamerName: userStreamer?.name || user.username,
      title: uploadForm.title,
      description: uploadForm.description,
      videoUrl: uploadForm.videoUrl,
      thumbnailUrl: thumbnailUrl,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
      visibility: uploadForm.visibility,
    };

    addVideoContent(newVideo);
    setShowUploadModal(false);
    setUploadForm({
      title: "",
      description: "",
      videoUrl: "",
      thumbnailUrl: "",
      visibility: "public",
    });
  };

  const handleLike = (videoId: string) => {
    if (!user) return;
    likeVideoContent(videoId, user.id);
  };

  const handlePlayVideo = (video: VideoContent) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
  };

  const handleCloseVideo = () => {
    setShowVideoPlayer(false);
    setSelectedVideo(null);
  };

  const canDeleteVideo = (video: VideoContent) => {
    if (isAdmin) return true;
    if (userStreamer && video.streamerId === userStreamer.id) return true;
    return false;
  };

  const handleDeleteVideo = (videoId: string) => {
    setVideoToDelete(videoId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (videoToDelete) {
      deleteVideoContent(videoToDelete);
      setVideoToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setVideoToDelete(null);
    setShowDeleteConfirm(false);
  };

  // Filter content based on user tier
  const filteredContent = videoContent.filter((video) => {
    if (video.visibility === "public") return true;
    if (video.visibility === "free" && user) return true;
    if (video.visibility === "superfan" && user?.tier === "superfan") return true;
    return false;
  });

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <LinearGradient colors={["#0A0A0F", "#151520"]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 100 }}>
          <View className="px-6 py-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-3xl font-bold mb-2">Content</Text>
                <Text className="text-gray-400 text-sm">Clips, highlights, and more</Text>
              </View>
              {canUpload && (
                <Pressable
                  onPress={() => setShowUploadModal(true)}
                  className="bg-purple-600 px-4 py-2 rounded-xl flex-row items-center"
                >
                  <Ionicons name="add" size={20} color="white" />
                  <Text className="text-white font-bold ml-1">Upload</Text>
                </Pressable>
              )}
            </View>
          </View>

          {filteredContent.length === 0 ? (
            <View className="px-6 py-12 items-center">
              <Ionicons name="play-circle-outline" size={80} color="#374151" />
              <Text className="text-gray-400 text-lg mt-4">No content available yet</Text>
              <Text className="text-gray-500 text-center mt-2">
                Check back soon for clips, highlights, and exclusive content
              </Text>
            </View>
          ) : (
            <View className="px-6">
              {filteredContent.map((video) => (
                <View
                  key={video.id}
                  className="bg-[#151520] rounded-xl mb-4 border border-gray-800 overflow-hidden"
                >
                  {/* Thumbnail */}
                  <Pressable onPress={() => handlePlayVideo(video)}>
                    <View className="relative">
                      <RNImage
                        source={{ uri: video.thumbnailUrl }}
                        style={{ width: "100%", height: 200 }}
                        resizeMode="cover"
                      />
                      <View className="absolute inset-0 items-center justify-center bg-black/30">
                        <View className="bg-purple-600 rounded-full p-4">
                          <Ionicons name="play" size={32} color="white" />
                        </View>
                      </View>
                      {/* Visibility Badge */}
                      {video.visibility !== "public" && (
                        <View className="absolute top-2 right-2 bg-pink-600 px-2 py-1 rounded">
                          <Text className="text-white text-xs font-bold uppercase">
                            {video.visibility}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>

                  {/* Content Info */}
                  <View className="p-4">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-white text-lg font-bold flex-1">{video.title}</Text>
                      {canDeleteVideo(video) && (
                        <Pressable
                          onPress={() => handleDeleteVideo(video.id)}
                          className="bg-red-600/20 p-2 rounded-lg ml-2"
                        >
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </Pressable>
                      )}
                    </View>
                    <Text className="text-gray-400 text-sm mb-2">{video.streamerName}</Text>
                    {video.description && (
                      <Text className="text-gray-300 text-sm mb-3" numberOfLines={2}>
                        {video.description}
                      </Text>
                    )}

                    {/* Actions */}
                    <View className="flex-row items-center space-x-4 pt-3 border-t border-gray-800">
                      <Pressable
                        onPress={() => handleLike(video.id)}
                        className="flex-row items-center"
                      >
                        <Ionicons
                          name={video.likes.includes(user?.id || "") ? "heart" : "heart-outline"}
                          size={20}
                          color={video.likes.includes(user?.id || "") ? "#EC4899" : "#9CA3AF"}
                        />
                        <Text className="text-gray-400 text-sm ml-1">
                          {video.likes.length}
                        </Text>
                      </Pressable>
                      <View className="flex-row items-center">
                        <Ionicons name="chatbubble-outline" size={18} color="#9CA3AF" />
                        <Text className="text-gray-400 text-sm ml-1">
                          {video.comments.length}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="eye-outline" size={20} color="#9CA3AF" />
                        <Text className="text-gray-400 text-sm ml-1">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      {/* Upload Modal */}
      <Modal visible={showUploadModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-[#151520] rounded-t-3xl p-6" style={{ maxHeight: "80%" }}>
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white text-xl font-bold">Upload Video</Text>
                  <Pressable onPress={() => setShowUploadModal(false)}>
                    <Ionicons name="close" size={28} color="white" />
                  </Pressable>
                </View>

                <ScrollView
                  className="mb-4"
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <TextInput
                    placeholder="Video Title *"
                    placeholderTextColor="#6B7280"
                    value={uploadForm.title}
                    onChangeText={(text) => setUploadForm({ ...uploadForm, title: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />
                  <TextInput
                    placeholder="Description"
                    placeholderTextColor="#6B7280"
                    value={uploadForm.description}
                    onChangeText={(text) => setUploadForm({ ...uploadForm, description: text })}
                    multiline
                    numberOfLines={3}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                    style={{ minHeight: 80, textAlignVertical: "top" }}
                  />
                  <TextInput
                    placeholder="Video URL * (YouTube, Twitch, etc.)"
                    placeholderTextColor="#6B7280"
                    value={uploadForm.videoUrl}
                    onChangeText={(text) => setUploadForm({ ...uploadForm, videoUrl: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />
                  <TextInput
                    placeholder="Thumbnail URL (optional)"
                    placeholderTextColor="#6B7280"
                    value={uploadForm.thumbnailUrl}
                    onChangeText={(text) => setUploadForm({ ...uploadForm, thumbnailUrl: text })}
                    className="bg-[#0A0A0F] text-white px-4 py-3 rounded-xl mb-4"
                  />

                  {/* Visibility Options */}
                  <Text className="text-white font-bold mb-2">Visibility</Text>
                  <View className="flex-row space-x-2 mb-4">
                    <Pressable
                      onPress={() => setUploadForm({ ...uploadForm, visibility: "public" })}
                      className={`flex-1 py-3 rounded-xl border ${
                        uploadForm.visibility === "public"
                          ? "bg-purple-600 border-purple-600"
                          : "bg-[#0A0A0F] border-gray-700"
                      }`}
                    >
                      <Text className="text-white text-center font-bold">Public</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setUploadForm({ ...uploadForm, visibility: "free" })}
                      className={`flex-1 py-3 rounded-xl border ${
                        uploadForm.visibility === "free"
                          ? "bg-purple-600 border-purple-600"
                          : "bg-[#0A0A0F] border-gray-700"
                      }`}
                    >
                      <Text className="text-white text-center font-bold">Free Users</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setUploadForm({ ...uploadForm, visibility: "superfan" })}
                      className={`flex-1 py-3 rounded-xl border ${
                        uploadForm.visibility === "superfan"
                          ? "bg-pink-600 border-pink-600"
                          : "bg-[#0A0A0F] border-gray-700"
                      }`}
                    >
                      <Text className="text-white text-center font-bold">Super Fans</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={handleUploadVideo}
                    className="bg-purple-600 py-4 rounded-xl mb-4"
                  >
                    <Text className="text-white text-center font-bold">Upload Video</Text>
                  </Pressable>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirm} animationType="fade" transparent>
        <View className="flex-1 bg-black/70 items-center justify-center px-6">
          <View className="bg-[#151520] rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center mb-4">
              <View className="bg-red-600/20 p-4 rounded-full mb-4">
                <Ionicons name="trash" size={32} color="#EF4444" />
              </View>
              <Text className="text-white text-xl font-bold mb-2">Delete Video?</Text>
              <Text className="text-gray-400 text-center">
                Are you sure you want to delete this video? This action cannot be undone.
              </Text>
            </View>

            <View className="flex-row space-x-3">
              <Pressable
                onPress={cancelDelete}
                className="flex-1 bg-gray-700 py-3 rounded-xl"
              >
                <Text className="text-white text-center font-bold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmDelete}
                className="flex-1 bg-red-600 py-3 rounded-xl"
              >
                <Text className="text-white text-center font-bold">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Video Player */}
      {selectedVideo && (
        <VideoPlayer
          visible={showVideoPlayer}
          videoUrl={selectedVideo.videoUrl}
          title={selectedVideo.title}
          onClose={handleCloseVideo}
        />
      )}
    </View>
  );
};
