import React, { useState, useRef } from "react";
import { View, Text, Pressable, Animated, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.min((SCREEN_WIDTH - 64) / 3, 280);

interface Artist {
  id: string;
  name: string;
  image: string;
  bio?: string;
  tracks?: number;
  playlistName?: string;
  socialLinks?: {
    instagram?: string;
    spotify?: string;
    youtube?: string;
  };
}

interface FlipCardProps {
  artist: Artist;
  onPlay?: () => void;
  isPlaying?: boolean;
}

export const FlipCard: React.FC<FlipCardProps> = ({ artist, onPlay, isPlaying }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  const flipToBack = () => {
    Animated.spring(flipAnimation, {
      toValue: 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(true);
  };

  const flipToFront = () => {
    Animated.spring(flipAnimation, {
      toValue: 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(false);
  };

  const toggleFlip = () => {
    if (isFlipped) {
      flipToFront();
    } else {
      flipToBack();
    }
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  return (
    <View style={styles.container}>
      {/* Front of Card */}
      <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
        <Pressable onPress={toggleFlip} style={styles.cardContent}>
          {/* Artist Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: artist.image }}
              style={styles.artistImage}
              contentFit="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.8)"]}
              style={styles.imageGradient}
            />
            
            {/* Flip indicator */}
            <View style={styles.flipIndicator}>
              <Ionicons name="sync-outline" size={16} color="rgba(255,255,255,0.6)" />
            </View>
          </View>

          {/* Player Interface */}
          <View style={styles.playerSection}>
            <Text style={styles.playlistName}>{artist.playlistName || "DDNS Vol 1"}</Text>
            
            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: isPlaying ? "45%" : "0%" }]} />
              </View>
            </View>

            {/* Player controls */}
            <View style={styles.controls}>
              <Pressable style={styles.controlButton}>
                <Ionicons name="play-skip-back" size={18} color="#fff" />
              </Pressable>
              <Pressable 
                style={styles.playButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onPlay?.();
                }}
              >
                <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#fff" />
              </Pressable>
              <Pressable style={styles.controlButton}>
                <Ionicons name="play-skip-forward" size={18} color="#fff" />
              </Pressable>
            </View>

            {/* Artist name */}
            <Text style={styles.artistName}>{artist.name}</Text>
          </View>
        </Pressable>
      </Animated.View>

      {/* Back of Card */}
      <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
        <Pressable onPress={toggleFlip} style={styles.cardContent}>
          <LinearGradient
            colors={["#1a1a2e", "#16213e", "#0f3460"]}
            style={styles.backGradient}
          >
            {/* Artist Info */}
            <View style={styles.backHeader}>
              <Image
                source={{ uri: artist.image }}
                style={styles.backAvatar}
                contentFit="cover"
              />
              <Text style={styles.backName}>{artist.name}</Text>
            </View>

            {/* Bio */}
            <Text style={styles.backBio} numberOfLines={4}>
              {artist.bio || "Independent artist bringing heat to the Valentine's collection. Stream now on all platforms."}
            </Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Ionicons name="musical-notes" size={16} color="#ec4899" />
                <Text style={styles.statText}>{artist.tracks || 8} Tracks</Text>
              </View>
            </View>

            {/* Social Links */}
            <View style={styles.socialLinks}>
              {artist.socialLinks?.instagram && (
                <Pressable style={styles.socialButton}>
                  <Ionicons name="logo-instagram" size={20} color="#fff" />
                </Pressable>
              )}
              {artist.socialLinks?.spotify && (
                <Pressable style={styles.socialButton}>
                  <Ionicons name="musical-note" size={20} color="#1DB954" />
                </Pressable>
              )}
              {artist.socialLinks?.youtube && (
                <Pressable style={styles.socialButton}>
                  <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                </Pressable>
              )}
            </View>

            {/* Flip back indicator */}
            <View style={styles.flipBackIndicator}>
              <Ionicons name="sync-outline" size={14} color="rgba(255,255,255,0.4)" />
              <Text style={styles.flipBackText}>Tap to flip</Text>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
    marginHorizontal: 8,
  },
  card: {
    width: "100%",
    height: "100%",
    position: "absolute",
    backfaceVisibility: "hidden",
    borderRadius: 20,
    overflow: "hidden",
  },
  cardFront: {
    backgroundColor: "#1a1a2e",
  },
  cardBack: {
    backgroundColor: "#1a1a2e",
  },
  cardContent: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    position: "relative",
  },
  artistImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },
  flipIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    padding: 6,
  },
  playerSection: {
    backgroundColor: "#1a1a2e",
    padding: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  playlistName: {
    color: "#9ca3af",
    fontSize: 10,
    textAlign: "center",
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ec4899",
    borderRadius: 2,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 8,
  },
  controlButton: {
    padding: 4,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ec4899",
    alignItems: "center",
    justifyContent: "center",
  },
  artistName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  backGradient: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  backHeader: {
    alignItems: "center",
  },
  backAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#ec4899",
    marginBottom: 8,
  },
  backName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  backBio: {
    color: "#9ca3af",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: "#fff",
    fontSize: 12,
  },
  socialLinks: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  socialButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  flipBackIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  flipBackText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
  },
});
