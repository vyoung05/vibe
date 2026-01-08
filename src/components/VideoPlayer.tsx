import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Modal, ActivityIndicator, Dimensions } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import YoutubePlayer from "react-native-youtube-iframe";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface VideoPlayerProps {
  visible: boolean;
  videoUrl: string;
  title: string;
  onClose: () => void;
}

// Extract YouTube video ID from various YouTube URL formats
const getYouTubeVideoId = (url: string): string | null => {
  // Clean the URL - remove any spaces that might have been added
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

// Check if URL is a YouTube URL
const isYouTubeUrl = (url: string): boolean => {
  return url.includes("youtube.com") || url.includes("youtu.be");
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  visible,
  videoUrl,
  title,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const { width, height } = Dimensions.get("window");

  const isYouTube = isYouTubeUrl(videoUrl);
  const youtubeVideoId = isYouTube ? getYouTubeVideoId(videoUrl) : null;

  console.log("[VideoPlayer] Video URL:", videoUrl);
  console.log("[VideoPlayer] Is YouTube:", isYouTube);
  console.log("[VideoPlayer] YouTube ID:", youtubeVideoId);

  // For YouTube videos, use the YouTube iframe player
  if (isYouTube && youtubeVideoId) {
    return (
      <Modal visible={visible} animationType="fade" transparent={false}>
        <View className="flex-1 bg-black">
          {/* Header */}
          <View
            className="absolute top-0 left-0 right-0 z-10 px-4"
            style={{ paddingTop: insets.top + 8, backgroundColor: "rgba(0,0,0,0.8)" }}
          >
            <View className="flex-row items-center justify-between pb-4">
              <Text className="text-white text-lg font-bold flex-1 mr-4" numberOfLines={1}>
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                className="bg-black/50 rounded-full p-2"
              >
                <Ionicons name="close" size={24} color="white" />
              </Pressable>
            </View>
          </View>

          {/* YouTube Player - Centered */}
          <View className="flex-1" style={{ paddingTop: insets.top + 60 }}>
            <View className="flex-1 items-center justify-center">
              <YoutubePlayer
                height={Math.min(height * 0.6, 400)}
                width={width}
                videoId={youtubeVideoId}
                play={visible}
                onReady={() => setIsLoading(false)}
                onError={(error: string) => console.log("[VideoPlayer] YouTube error:", error)}
              />

              {/* Loading Indicator */}
              {isLoading && (
                <View className="absolute inset-0 items-center justify-center">
                  <ActivityIndicator size="large" color="#8B5CF6" />
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Direct video player component for non-YouTube URLs
  return <DirectVideoPlayer
    visible={visible}
    videoUrl={videoUrl}
    title={title}
    onClose={onClose}
  />;
};

// Separate component for direct video playback to avoid hooks issues
const DirectVideoPlayer: React.FC<VideoPlayerProps> = ({
  visible,
  videoUrl,
  title,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const { width, height } = Dimensions.get("window");

  const player = useVideoPlayer(videoUrl, (player) => {
    player.loop = false;
    player.play();
  });

  useEffect(() => {
    if (visible && player) {
      player.play();
      setIsLoading(false);
    }
  }, [visible, player]);

  useEffect(() => {
    const subscription = player.addListener("statusChange", ({ status }) => {
      if (status === "readyToPlay") {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  const handleClose = () => {
    player.pause();
    setIsLoading(true);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View className="flex-1 bg-black">
        {/* Header */}
        <View
          className="absolute top-0 left-0 right-0 z-10 px-4"
          style={{ paddingTop: insets.top + 8, backgroundColor: "rgba(0,0,0,0.8)" }}
        >
          <View className="flex-row items-center justify-between pb-4">
            <Text className="text-white text-lg font-bold flex-1 mr-4" numberOfLines={1}>
              {title}
            </Text>
            <Pressable
              onPress={handleClose}
              className="bg-black/50 rounded-full p-2"
            >
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Video Player */}
        <View className="flex-1 items-center justify-center">
          <VideoView
            player={player}
            style={{ width, height }}
            contentFit="contain"
            allowsFullscreen
            nativeControls
          />

          {/* Loading Indicator */}
          {isLoading && (
            <View className="absolute inset-0 items-center justify-center">
              <ActivityIndicator size="large" color="#8B5CF6" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
