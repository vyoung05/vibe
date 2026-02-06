import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../state/authStore";
import { useMusicStore } from "../state/musicStore";
import { useAppStore } from "../state/appStore";
import {
  fetchTracksForSale,
  hasUserPurchasedTrack,
} from "../services/musicService";
import type { Track } from "../types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface TrackForSale extends Track {
  artistName: string;
  artistAvatar: string;
}

export const MusicStoreSection: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);
  const localArtists = useAppStore((s) => s.artists);

  const playTrack = useMusicStore((s) => s.playTrack);
  const pauseTrack = useMusicStore((s) => s.pauseTrack);
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);

  const [tracks, setTracks] = useState<TrackForSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());

  // Load tracks for sale
  const loadTracks = useCallback(async () => {
    try {
      // Fetch from Supabase
      const supabaseTracks = await fetchTracksForSale();

      // Also get local tracks with prices
      const localTracks: TrackForSale[] = localArtists.flatMap((artist) =>
        (artist.tracks || [])
          .filter((t) => t.price && t.price > 0)
          .map((t) => ({
            ...t,
            artistName: artist.stageName || artist.name,
            artistAvatar: artist.avatar,
          }))
      );

      // Merge (Supabase first, then local-only)
      const supabaseIds = new Set(supabaseTracks.map((t) => t.id));
      const localOnly = localTracks.filter((t) => !supabaseIds.has(t.id));
      const allTracks = [...supabaseTracks, ...localOnly];

      setTracks(allTracks);

      // Check which tracks user has purchased
      if (user?.id && allTracks.length > 0) {
        const purchased = new Set<string>();
        for (const track of allTracks) {
          const hasPurchased = await hasUserPurchasedTrack(user.id, track.id);
          if (hasPurchased) {
            purchased.add(track.id);
          }
        }
        setPurchasedIds(purchased);
      }
    } catch (error) {
      console.error("[MusicStoreSection] Error loading tracks:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, localArtists]);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const handlePlayPreview = (track: Track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      pauseTrack();
    } else {
      playTrack(track);
    }
  };

  const handleBuyTrack = (track: TrackForSale) => {
    navigation.navigate("TrackPurchase", { trackId: track.id });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <View className="py-8 items-center">
        <ActivityIndicator size="small" color="#8B5CF6" />
      </View>
    );
  }

  if (tracks.length === 0) {
    return null; // Don't show section if no tracks for sale
  }

  const renderTrackCard = ({ item }: { item: TrackForSale }) => {
    const isPurchased = purchasedIds.has(item.id);
    const isCurrentlyPlaying = currentTrack?.id === item.id && isPlaying;

    return (
      <Pressable
        onPress={() => handleBuyTrack(item)}
        className="bg-[#1C1C26] rounded-2xl border border-white/5 overflow-hidden mr-4"
        style={{ width: Platform.OS === "web" ? 200 : 160 }}
      >
        {/* Cover Art */}
        <View className="relative">
          <Image
            source={{ uri: item.coverArt }}
            style={{ width: "100%", height: Platform.OS === "web" ? 200 : 160 }}
            contentFit="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)"]}
            className="absolute inset-0"
          />

          {/* Play Preview Button */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              handlePlayPreview(item);
            }}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full items-center justify-center overflow-hidden"
          >
            <LinearGradient
              colors={isCurrentlyPlaying ? ["#D946EF", "#8B5CF6"] : ["#8B5CF6", "#6D28D9"]}
              className="w-full h-full items-center justify-center"
            >
              <Ionicons
                name={isCurrentlyPlaying ? "pause" : "play"}
                size={20}
                color="white"
                style={{ marginLeft: isCurrentlyPlaying ? 0 : 2 }}
              />
            </LinearGradient>
          </Pressable>

          {/* Hot Badge */}
          {item.isHot && (
            <View className="absolute top-3 left-3 bg-red-500 px-2 py-1 rounded-md flex-row items-center">
              <Ionicons name="flame" size={10} color="white" />
              <Text className="text-white text-[9px] font-black ml-1">HOT</Text>
            </View>
          )}

          {/* Purchased Badge */}
          {isPurchased && (
            <View className="absolute top-3 right-3 bg-green-500 px-2 py-1 rounded-md flex-row items-center">
              <Ionicons name="checkmark-circle" size={10} color="white" />
              <Text className="text-white text-[9px] font-black ml-1">OWNED</Text>
            </View>
          )}
        </View>

        {/* Track Info */}
        <View className="p-3">
          {/* Artist */}
          <View className="flex-row items-center mb-1.5">
            <Image
              source={{ uri: item.artistAvatar }}
              style={{ width: 16, height: 16, borderRadius: 8 }}
              contentFit="cover"
            />
            <Text className="text-gray-400 text-[10px] font-bold ml-1.5 uppercase tracking-wider" numberOfLines={1}>
              {item.artistName}
            </Text>
          </View>

          {/* Title */}
          <Text className="text-white font-bold text-sm mb-1" numberOfLines={1}>
            {item.title}
          </Text>

          {/* Duration & Plays */}
          <View className="flex-row items-center mb-2">
            <Text className="text-gray-500 text-[10px]">{formatDuration(item.duration)}</Text>
            <Text className="text-gray-600 mx-1">•</Text>
            <Ionicons name="play" size={8} color="#6B7280" />
            <Text className="text-gray-500 text-[10px] ml-0.5">{item.playCount.toLocaleString()}</Text>
          </View>

          {/* Price / Buy Button */}
          <View className="flex-row items-center justify-between">
            <Text className="text-purple-400 font-black text-base">
              ${item.price?.toFixed(2)}
            </Text>
            {isPurchased ? (
              <View className="bg-green-500/20 px-2 py-1 rounded-lg">
                <Text className="text-green-400 text-[10px] font-bold">OWNED</Text>
              </View>
            ) : (
              <View className="bg-purple-600 px-3 py-1.5 rounded-lg">
                <Text className="text-white text-[10px] font-bold">BUY</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="py-4">
      {/* Section Header */}
      <View className="px-6 mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-purple-600/20 rounded-lg items-center justify-center mr-3">
            <Ionicons name="musical-notes" size={16} color="#A78BFA" />
          </View>
          <View>
            <Text className="text-white font-bold text-lg">Music Store</Text>
            <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
              {tracks.length} {tracks.length === 1 ? "TRACK" : "TRACKS"} AVAILABLE
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => navigation.navigate("MusicStore")}
          className="flex-row items-center"
        >
          <Text className="text-purple-400 text-xs font-bold mr-1">See All</Text>
          <Ionicons name="chevron-forward" size={14} color="#A78BFA" />
        </Pressable>
      </View>

      {/* Tracks List */}
      <FlatList
        data={tracks.slice(0, 10)}
        renderItem={renderTrackCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24 }}
      />
    </View>
  );
};
