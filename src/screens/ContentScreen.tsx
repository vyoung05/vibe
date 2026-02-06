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
import { PageContainer } from "../components/PageContainer";
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
  // Check both s.id (legacy) and s.userId (linked accounts)
  const userStreamer = streamers.find((s) => s.id === user?.id || s.userId === user?.id);
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
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <PageContainer>
            <View className="px-6 py-8 border-b border-white/5 relative overflow-hidden">
              <LinearGradient
                colors={["rgba(139, 92, 246, 0.1)", "transparent"]}
                className="absolute top-0 left-0 right-0 h-40"
              />
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-white text-4xl font-black italic tracking-tighter uppercase">Content</Text>
                  <Text className="text-purple-500 text-[10px] font-black uppercase tracking-[4px] mt-1.5 px-0.5">
                    Clips, highlights, and more
                  </Text>
                </View>
                {canUpload && (
                  <Pressable
                    onPress={() => setShowUploadModal(true)}
                    className="overflow-hidden rounded-2xl shadow-xl shadow-purple-500/20"
                  >
                    <LinearGradient
                      colors={["#8B5CF6", "#D946EF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="px-5 py-3 flex-row items-center border border-white/10"
                    >
                      <Ionicons name="add" size={20} color="white" />
                      <Text className="text-white font-black uppercase tracking-widest text-[10px] ml-1.5">
                        Upload
                      </Text>
                    </LinearGradient>
                  </Pressable>
                )}
              </View>
            </View>
          </PageContainer>

          {filteredContent.length === 0 ? (
            <PageContainer>
              <View className="items-center justify-center py-32">
                <View className="w-20 h-20 bg-white/5 rounded-full items-center justify-center mb-6">
                  <Ionicons name="play-circle-outline" size={32} color="#374151" />
                </View>
                <Text className="text-white text-xl font-black italic tracking-tight mb-2">EMPTY PLAYLIST</Text>
                <Text className="text-gray-500 text-center font-bold text-xs uppercase tracking-widest px-12">
                  Check back soon for clips, highlights, and exclusive content
                </Text>
              </View>
            </PageContainer>
          ) : (
            <PageContainer>
              <View className="px-6 py-4">
                {filteredContent.map((video) => (
                  <View
                    key={video.id}
                    className="bg-white/5 rounded-[32px] mb-8 border border-white/10 overflow-hidden shadow-2xl shadow-black/40"
                  >
                    {/* Thumbnail */}
                    <Pressable onPress={() => handlePlayVideo(video)}>
                      <View className="relative">
                        <RNImage
                          source={{ uri: video.thumbnailUrl }}
                          style={{ width: "100%", height: 220 }}
                          resizeMode="cover"
                        />
                        <View className="absolute inset-0 items-center justify-center bg-black/20">
                          <View className="bg-white/10 rounded-full p-5 border border-white/20 shadow-2xl overflow-hidden">
                            <LinearGradient
                              colors={["rgba(255,255,255,0.15)", "transparent"]}
                              className="absolute inset-0"
                            />
                            <Ionicons name="play" size={32} color="white" />
                          </View>
                        </View>
                        {/* Visibility Badge */}
                        {video.visibility !== "public" && (
                          <View className="absolute top-4 right-4 overflow-hidden rounded-lg shadow-lg">
                            <LinearGradient
                              colors={video.visibility === "superfan" ? ["#EC4899", "#D946EF"] : ["#8B5CF6", "#7C3AED"]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              className="px-3 py-1.5 border border-white/20"
                            >
                              <Text className="text-white text-[9px] font-black uppercase tracking-widest">
                                {video.visibility}
                              </Text>
                            </LinearGradient>
                          </View>
                        )}
                      </View>
                    </Pressable>

                    {/* Content Info */}
                    <View className="p-6">
                      <View className="flex-row items-start justify-between mb-2">
                        <Text className="text-white text-xl font-black italic tracking-tight flex-1" numberOfLines={2}>
                          {video.title}
                        </Text>
                        {canDeleteVideo(video) && (
                          <Pressable
                            onPress={() => handleDeleteVideo(video.id)}
                            className="bg-red-500/10 p-2.5 rounded-2xl border border-red-500/20 ml-4"
                          >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                          </Pressable>
                        )}
                      </View>

                      <View className="flex-row items-center mb-4">
                        <Text className="text-purple-500 text-[10px] font-black uppercase tracking-widest">
                          {video.streamerName}
                        </Text>
                        <View className="w-1 h-1 rounded-full bg-gray-800 mx-3" />
                        <Text className="text-gray-500 text-[10px] font-black tracking-widest">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </Text>
                      </View>

                      {video.description && (
                        <Text className="text-gray-400 text-sm leading-5 mb-6" numberOfLines={2}>
                          {video.description}
                        </Text>
                      )}

                      {/* Actions */}
                      <View className="flex-row items-center pt-5 border-t border-white/5">
                        <Pressable
                          onPress={() => handleLike(video.id)}
                          className="flex-row items-center bg-white/5 px-4 py-2 rounded-xl border border-white/5 mr-3"
                        >
                          <Ionicons
                            name={video.likes.includes(user?.id || "") ? "heart" : "heart-outline"}
                            size={18}
                            color={video.likes.includes(user?.id || "") ? "#EC4899" : "#9CA3AF"}
                          />
                          <Text className={`text-[11px] font-black ml-2 ${video.likes.includes(user?.id || "") ? "text-pink-500" : "text-gray-500"}`}>
                            {video.likes.length}
                          </Text>
                        </Pressable>

                        <View className="flex-row items-center bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                          <Ionicons name="chatbubble-outline" size={16} color="#9CA3AF" />
                          <Text className="text-gray-500 text-[11px] font-black ml-2">
                            {video.comments.length}
                          </Text>
                        </View>

                        <View className="flex-1" />

                        <View className="flex-row items-center opacity-60">
                          <Ionicons name="eye-outline" size={16} color="#9CA3AF" />
                          <Text className="text-gray-600 text-[10px] font-black ml-1.5 uppercase tracking-widest">
                            {Math.floor(Math.random() * 5000 + 100).toLocaleString()} Views
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </PageContainer>
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
            <View className="flex-1 bg-black/80 justify-end">
              <View className="bg-[#151520] rounded-t-[40px] p-8 border-t border-white/10" style={{ maxHeight: "90%" }}>
                <View className="flex-row items-center justify-between mb-8">
                  <View>
                    <Text className="text-white text-3xl font-black italic tracking-tighter uppercase">Upload</Text>
                    <Text className="text-purple-500 text-[10px] font-black uppercase tracking-[4px] mt-1 px-0.5">SHARE YOUR VISION</Text>
                  </View>
                  <Pressable
                    onPress={() => setShowUploadModal(false)}
                    className="w-12 h-12 bg-white/5 rounded-full items-center justify-center border border-white/10"
                  >
                    <Ionicons name="close" size={24} color="white" />
                  </Pressable>
                </View>

                <ScrollView
                  className="mb-4"
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View className="bg-[#0A0A0F] rounded-2xl p-4 border border-white/5 mb-6">
                    <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">VIDEO TITLE *</Text>
                    <TextInput
                      placeholder="Enter a descriptive title"
                      placeholderTextColor="#374151"
                      value={uploadForm.title}
                      onChangeText={(text) => setUploadForm({ ...uploadForm, title: text })}
                      className="text-white text-base font-bold italic tracking-tight"
                    />
                  </View>

                  <View className="bg-[#0A0A0F] rounded-2xl p-4 border border-white/5 mb-6">
                    <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">DESCRIPTION</Text>
                    <TextInput
                      placeholder="What is this video about?"
                      placeholderTextColor="#374151"
                      value={uploadForm.description}
                      onChangeText={(text) => setUploadForm({ ...uploadForm, description: text })}
                      multiline
                      numberOfLines={3}
                      className="text-white text-sm font-bold leading-5"
                      style={{ minHeight: 80, textAlignVertical: "top" }}
                    />
                  </View>

                  <View className="bg-[#0A0A0F] rounded-2xl p-4 border border-white/5 mb-6">
                    <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">VIDEO URL *</Text>
                    <TextInput
                      placeholder="YouTube, Twitch, or Direct Link"
                      placeholderTextColor="#374151"
                      value={uploadForm.videoUrl}
                      onChangeText={(text) => setUploadForm({ ...uploadForm, videoUrl: text })}
                      className="text-white text-sm font-bold"
                    />
                  </View>

                  <View className="bg-[#0A0A0F] rounded-2xl p-4 border border-white/5 mb-6">
                    <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">THUMBNAIL URL (OPTIONAL)</Text>
                    <TextInput
                      placeholder="Custom preview image link"
                      placeholderTextColor="#374151"
                      value={uploadForm.thumbnailUrl}
                      onChangeText={(text) => setUploadForm({ ...uploadForm, thumbnailUrl: text })}
                      className="text-white text-sm font-bold"
                    />
                  </View>

                  {/* Visibility Options */}
                  <Text className="text-white font-black text-[10px] uppercase tracking-widest mb-4 ml-1">VISIBILITY LEVEL</Text>
                  <View className="flex-row mb-8">
                    {(["public", "free", "superfan"] as const).map((level) => (
                      <Pressable
                        key={level}
                        onPress={() => setUploadForm({ ...uploadForm, visibility: level })}
                        className="flex-1 mr-2"
                      >
                        <LinearGradient
                          colors={uploadForm.visibility === level ? (level === "superfan" ? ["#EC4899", "#D946EF"] : ["#8B5CF6", "#7C3AED"]) : ["#0A0A0F", "#0A0A0F"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          className={`py-3.5 rounded-2xl items-center border ${uploadForm.visibility === level ? "border-white/20" : "border-white/5"}`}
                        >
                          <Text className={`text-[9px] font-black uppercase tracking-widest ${uploadForm.visibility === level ? "text-white" : "text-gray-500"}`}>
                            {level}
                          </Text>
                        </LinearGradient>
                      </Pressable>
                    ))}
                  </View>

                  <Pressable
                    onPress={handleUploadVideo}
                    className="overflow-hidden rounded-2xl shadow-xl shadow-purple-500/20 mb-8"
                  >
                    <LinearGradient
                      colors={["#8B5CF6", "#D946EF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="py-5 items-center border border-white/10"
                    >
                      <Text className="text-white font-black uppercase tracking-widest text-sm">
                        Confirm Upload
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirm} animationType="fade" transparent>
        <View className="flex-1 bg-black/80 items-center justify-center px-6">
          <View className="bg-[#151520] rounded-[32px] p-8 w-full max-w-sm border border-white/10 shadow-2xl">
            <View className="items-center mb-6">
              <View className="bg-red-500/10 p-5 rounded-full mb-6 border border-red-500/20">
                <Ionicons name="trash" size={32} color="#EF4444" />
              </View>
              <Text className="text-white text-2xl font-black italic tracking-tighter uppercase mb-2">Delete Video?</Text>
              <Text className="text-gray-500 text-center font-bold text-xs uppercase tracking-widest leading-4">
                This action is permanent and cannot be reversed.
              </Text>
            </View>

            <View className="flex-row">
              <Pressable
                onPress={cancelDelete}
                className="flex-1 mr-2 bg-white/5 py-4 rounded-2xl border border-white/10"
              >
                <Text className="text-gray-400 text-center font-black uppercase tracking-widest text-[10px]">Back</Text>
              </Pressable>
              <Pressable
                onPress={confirmDelete}
                className="flex-1 ml-2 bg-red-600 py-4 rounded-2xl shadow-xl shadow-red-600/20"
              >
                <Text className="text-white text-center font-black uppercase tracking-widest text-[10px]">Delete Content</Text>
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
