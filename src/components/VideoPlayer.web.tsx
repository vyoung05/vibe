import React, { useState } from "react";
import { View, Text, Pressable, Modal, ActivityIndicator, StyleSheet } from "react-native";
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

  const isYouTube = isYouTubeUrl(videoUrl);
  const youtubeVideoId = isYouTube ? getYouTubeVideoId(videoUrl) : null;

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.headerContent}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Video Player */}
        <View style={styles.videoContainer}>
          {isYouTube && youtubeVideoId ? (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setIsLoading(false)}
              style={{ border: 'none' }}
            />
          ) : (
            <video
              src={videoUrl}
              controls
              autoPlay
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onLoadedData={() => setIsLoading(false)}
            />
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  videoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

