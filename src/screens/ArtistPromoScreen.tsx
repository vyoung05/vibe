import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useMusicStore } from "../state/musicStore";
import { useAppStore } from "../state/appStore";
import { FlipCard } from "../components/FlipCard";
import { PageContainer } from "../components/PageContainer";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Sample featured artists for Valentine's collection
const FEATURED_ARTISTS = [
  {
    id: "jv-danny",
    name: "JV Danny",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    bio: "R&B sensation bringing smooth vibes and heartfelt lyrics to the Valentine's collection.",
    tracks: 6,
    playlistName: "Valentines Vol 1 - Vinci Films",
    socialLinks: {
      instagram: "jvdanny",
      spotify: "jvdanny",
    },
  },
  {
    id: "c-los",
    name: "C-LoS",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    bio: "Hip-hop artist with a unique sound that blends classic beats with modern production.",
    tracks: 8,
    playlistName: "Valentines Vol 1 - Vinci Films",
    socialLinks: {
      instagram: "clos_music",
      youtube: "closofficial",
    },
  },
  {
    id: "pop-vinci",
    name: "Pop Vinci",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    bio: "Miami-based independent artist pushing boundaries with innovative sounds and authentic storytelling.",
    tracks: 10,
    playlistName: "Valentines Vol 1 - Vinci Films",
    socialLinks: {
      instagram: "popvinci",
      spotify: "popvinci",
      youtube: "popvinci",
    },
  },
];

// Hero cover image
const HERO_COVER = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=600&fit=crop";

export const ArtistPromoScreen: React.FC = () => {
  const [isHeroPlaying, setIsHeroPlaying] = useState(false);
  const [playingArtistId, setPlayingArtistId] = useState<string | null>(null);
  
  // Get music store functions
  const playTrack = useMusicStore((s) => s.playTrack);
  const pauseTrack = useMusicStore((s) => s.pauseTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const artists = useAppStore((s) => s.artists);

  // Play the entire Valentine's playlist
  const handleHeroPlay = () => {
    if (isHeroPlaying) {
      pauseTrack();
      setIsHeroPlaying(false);
    } else {
      // Get all tracks from featured artists and play
      const allTracks = artists.flatMap((artist) => artist.tracks);
      if (allTracks.length > 0) {
        playTrack(allTracks[0]);
      }
      setIsHeroPlaying(true);
    }
  };

  // Play individual artist
  const handleArtistPlay = (artistId: string) => {
    if (playingArtistId === artistId) {
      pauseTrack();
      setPlayingArtistId(null);
    } else {
      // Find and play artist's tracks
      const artist = artists.find((a) => a.id === artistId);
      if (artist && artist.tracks.length > 0) {
        playTrack(artist.tracks[0]);
      }
      setPlayingArtistId(artistId);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#0A0A0F]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <PageContainer>
          {/* Hearts decoration */}
          <View className="absolute top-4 left-4 z-10">
            <Text style={{ fontSize: 24 }}>💕</Text>
          </View>

          {/* Header */}
          <View className="px-6 py-6">
            <Text className="text-pink-500 text-xs font-black uppercase tracking-[4px] mb-2">
              Vinci Film Artist Promo
            </Text>
            <Text className="text-white text-3xl font-black tracking-tight">
              Official 2026 Selections
            </Text>
            <Text className="text-gray-400 text-sm mt-2">
              Independent Artists Defining This Valentine's Sound
            </Text>
          </View>

          {/* Hero Cover - Clickable to play playlist */}
          <Pressable 
            onPress={handleHeroPlay}
            className="mx-6 mb-8"
          >
            <View className="relative rounded-3xl overflow-hidden border border-white/10">
              <Image
                source={{ uri: HERO_COVER }}
                style={{ width: "100%", height: 220 }}
                contentFit="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: "70%",
                }}
              />
              
              {/* Play button overlay */}
              <View className="absolute inset-0 items-center justify-center">
                <View 
                  className={`w-20 h-20 rounded-full items-center justify-center ${
                    isHeroPlaying ? "bg-pink-500" : "bg-white/20"
                  } border-2 border-white/40`}
                >
                  <Ionicons 
                    name={isHeroPlaying ? "pause" : "play"} 
                    size={40} 
                    color="white" 
                    style={{ marginLeft: isHeroPlaying ? 0 : 4 }}
                  />
                </View>
              </View>

              {/* Playlist info */}
              <View className="absolute bottom-0 left-0 right-0 p-6">
                <Text className="text-white text-xl font-bold mb-1">
                  Valentines Vol 1
                </Text>
                <Text className="text-gray-300 text-sm">
                  Tap to {isHeroPlaying ? "pause" : "play"} the full playlist
                </Text>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="musical-notes" size={14} color="#ec4899" />
                  <Text className="text-pink-400 text-xs ml-2">
                    {FEATURED_ARTISTS.reduce((sum, a) => sum + a.tracks, 0)} tracks • Vinci Films
                  </Text>
                </View>
              </View>

              {/* Animated playing indicator */}
              {isHeroPlaying && (
                <View className="absolute top-4 right-4 flex-row items-center bg-pink-500/80 px-3 py-1.5 rounded-full">
                  <View className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse" />
                  <Text className="text-white text-xs font-bold">NOW PLAYING</Text>
                </View>
              )}
            </View>
          </Pressable>

          {/* Featured Artists - Flip Cards */}
          <View className="mb-8">
            <View className="px-6 mb-4">
              <Text className="text-white text-xl font-bold">Featured Artists</Text>
              <Text className="text-gray-500 text-xs mt-1">Tap cards to flip • Press play to stream</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ 
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              {FEATURED_ARTISTS.map((artist) => (
                <FlipCard
                  key={artist.id}
                  artist={artist}
                  onPlay={() => handleArtistPlay(artist.id)}
                  isPlaying={playingArtistId === artist.id}
                />
              ))}
            </ScrollView>
          </View>

          {/* Collection Info */}
          <View className="mx-6 p-6 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-3xl border border-pink-500/20">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 rounded-full bg-pink-500/20 items-center justify-center mr-4">
                <Ionicons name="heart" size={24} color="#ec4899" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg font-bold">Valentine's Collection</Text>
                <Text className="text-gray-400 text-sm">Curated by Vinci Films</Text>
              </View>
            </View>
            
            <Text className="text-gray-300 text-sm leading-relaxed mb-4">
              Experience the sounds of love with our handpicked selection of independent artists. 
              Each track tells a story of passion, heartbreak, and everything in between.
            </Text>

            <View className="flex-row gap-4">
              <Pressable 
                onPress={handleHeroPlay}
                className="flex-1 bg-pink-500 py-3 rounded-xl flex-row items-center justify-center"
              >
                <Ionicons name={isHeroPlaying ? "pause" : "play"} size={20} color="white" />
                <Text className="text-white font-bold ml-2">
                  {isHeroPlaying ? "Pause" : "Play All"}
                </Text>
              </Pressable>
              
              <Pressable className="bg-white/10 px-4 py-3 rounded-xl flex-row items-center">
                <Ionicons name="share-social" size={20} color="white" />
              </Pressable>
            </View>
          </View>

          {/* Stream Links */}
          <View className="mx-6 mt-8">
            <Text className="text-gray-500 text-xs text-center uppercase tracking-widest mb-4">
              Available on all platforms
            </Text>
            <View className="flex-row justify-center gap-6">
              <Pressable className="items-center">
                <View className="w-12 h-12 rounded-full bg-green-500/20 items-center justify-center mb-2">
                  <Ionicons name="musical-note" size={24} color="#1DB954" />
                </View>
                <Text className="text-gray-400 text-xs">Spotify</Text>
              </Pressable>
              
              <Pressable className="items-center">
                <View className="w-12 h-12 rounded-full bg-pink-500/20 items-center justify-center mb-2">
                  <Ionicons name="musical-notes" size={24} color="#FA233B" />
                </View>
                <Text className="text-gray-400 text-xs">Apple Music</Text>
              </Pressable>
              
              <Pressable className="items-center">
                <View className="w-12 h-12 rounded-full bg-red-500/20 items-center justify-center mb-2">
                  <Ionicons name="logo-youtube" size={24} color="#FF0000" />
                </View>
                <Text className="text-gray-400 text-xs">YouTube</Text>
              </Pressable>
              
              <Pressable className="items-center">
                <View className="w-12 h-12 rounded-full bg-orange-500/20 items-center justify-center mb-2">
                  <Ionicons name="cloud" size={24} color="#FF5500" />
                </View>
                <Text className="text-gray-400 text-xs">SoundCloud</Text>
              </Pressable>
            </View>
          </View>
        </PageContainer>
      </ScrollView>
    </SafeAreaView>
  );
};
