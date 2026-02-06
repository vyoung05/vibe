import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { PageContainer } from "../components/PageContainer";
import { useAuthStore } from "../state/authStore";
import { useMusicStore } from "../state/musicStore";
import { useAppStore } from "../state/appStore";
import {
  fetchTracksForSale,
  fetchHotTracks,
  hasUserPurchasedTrack,
  fetchUserPurchasedTracks,
} from "../services/musicService";
import type { Track } from "../types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface TrackForSale extends Track {
  artistName: string;
  artistAvatar: string;
}

type SortOption = "trending" | "newest" | "price_low" | "price_high" | "most_played";

export const MusicStoreScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);
  const localArtists = useAppStore((s) => s.artists);

  const playTrack = useMusicStore((s) => s.playTrack);
  const pauseTrack = useMusicStore((s) => s.pauseTrack);
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);

  const [tracks, setTracks] = useState<TrackForSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("trending");
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [showMyMusic, setShowMyMusic] = useState(false);
  const [myTracks, setMyTracks] = useState<Track[]>([]);

  // Load tracks
  const loadTracks = useCallback(async () => {
    try {
      setLoading(true);

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

      // Merge
      const supabaseIds = new Set(supabaseTracks.map((t) => t.id));
      const localOnly = localTracks.filter((t) => !supabaseIds.has(t.id));
      const allTracks = [...supabaseTracks, ...localOnly];

      setTracks(allTracks);

      // Check purchases & load user's library
      if (user?.id) {
        const purchased = new Set<string>();
        for (const track of allTracks) {
          const hasPurchased = await hasUserPurchasedTrack(user.id, track.id);
          if (hasPurchased) {
            purchased.add(track.id);
          }
        }
        setPurchasedIds(purchased);

        // Load user's purchased tracks
        const userTracks = await fetchUserPurchasedTracks(user.id);
        setMyTracks(userTracks);
      }
    } catch (error) {
      console.error("[MusicStoreScreen] Error loading:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, localArtists]);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  // Filter and sort tracks
  const filteredTracks = tracks
    .filter((t) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.artistName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "trending":
          return (b.hotVotes || 0) - (a.hotVotes || 0);
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "price_low":
          return (a.price || 0) - (b.price || 0);
        case "price_high":
          return (b.price || 0) - (a.price || 0);
        case "most_played":
          return (b.playCount || 0) - (a.playCount || 0);
        default:
          return 0;
      }
    });

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

  const renderTrackCard = ({ item }: { item: TrackForSale }) => {
    const isPurchased = purchasedIds.has(item.id);
    const isCurrentlyPlaying = currentTrack?.id === item.id && isPlaying;

    return (
      <Pressable
        onPress={() => handleBuyTrack(item)}
        className="bg-[#1C1C26] rounded-2xl border border-white/5 overflow-hidden mb-4"
        style={Platform.OS === "web" ? { width: 220 } : { width: (SCREEN_WIDTH - 48) / 2 - 8 }}
      >
        <View className="relative">
          <Image
            source={{ uri: item.coverArt }}
            style={{ width: "100%", height: Platform.OS === "web" ? 220 : 150 }}
            contentFit="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            className="absolute inset-0"
          />

          {/* Play Preview */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              handlePlayPreview(item);
            }}
            className="absolute bottom-3 right-3 w-11 h-11 rounded-full items-center justify-center overflow-hidden shadow-lg"
          >
            <LinearGradient
              colors={isCurrentlyPlaying ? ["#D946EF", "#8B5CF6"] : ["#8B5CF6", "#6D28D9"]}
              className="w-full h-full items-center justify-center"
            >
              <Ionicons
                name={isCurrentlyPlaying ? "pause" : "play"}
                size={22}
                color="white"
                style={{ marginLeft: isCurrentlyPlaying ? 0 : 2 }}
              />
            </LinearGradient>
          </Pressable>

          {/* Badges */}
          <View className="absolute top-3 left-3 flex-row gap-2">
            {item.isHot && (
              <View className="bg-red-500 px-2 py-1 rounded-md flex-row items-center">
                <Ionicons name="flame" size={10} color="white" />
                <Text className="text-white text-[9px] font-black ml-1">HOT</Text>
              </View>
            )}
            {isPurchased && (
              <View className="bg-green-500 px-2 py-1 rounded-md flex-row items-center">
                <Ionicons name="checkmark-circle" size={10} color="white" />
                <Text className="text-white text-[9px] font-black ml-1">OWNED</Text>
              </View>
            )}
          </View>
        </View>

        <View className="p-4">
          <View className="flex-row items-center mb-2">
            <Image
              source={{ uri: item.artistAvatar }}
              style={{ width: 18, height: 18, borderRadius: 9 }}
              contentFit="cover"
            />
            <Text className="text-gray-400 text-[10px] font-bold ml-1.5 uppercase tracking-wider" numberOfLines={1}>
              {item.artistName}
            </Text>
          </View>

          <Text className="text-white font-bold text-base mb-2" numberOfLines={1}>
            {item.title}
          </Text>

          <View className="flex-row items-center mb-3">
            <Text className="text-gray-500 text-[10px]">{formatDuration(item.duration)}</Text>
            <Text className="text-gray-600 mx-1.5">•</Text>
            <Ionicons name="play" size={8} color="#6B7280" />
            <Text className="text-gray-500 text-[10px] ml-0.5">{item.playCount.toLocaleString()}</Text>
            {item.purchaseCount > 0 && (
              <>
                <Text className="text-gray-600 mx-1.5">•</Text>
                <Text className="text-gray-500 text-[10px]">{item.purchaseCount} sold</Text>
              </>
            )}
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-purple-400 font-black text-lg">
              ${item.price?.toFixed(2)}
            </Text>
            {isPurchased ? (
              <View className="bg-green-500/20 px-3 py-1.5 rounded-lg">
                <Text className="text-green-400 text-[10px] font-bold">OWNED</Text>
              </View>
            ) : (
              <View className="bg-purple-600 px-4 py-1.5 rounded-lg">
                <Text className="text-white text-[10px] font-bold">BUY</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderMyTrack = ({ item }: { item: Track }) => {
    const isCurrentlyPlaying = currentTrack?.id === item.id && isPlaying;
    const artist = localArtists.find((a) => a.id === item.artistId);

    return (
      <Pressable
        onPress={() => handlePlayPreview(item)}
        className="flex-row items-center bg-[#1C1C26] rounded-xl p-3 mb-3 border border-white/5"
      >
        <Image
          source={{ uri: item.coverArt }}
          style={{ width: 56, height: 56, borderRadius: 12 }}
          contentFit="cover"
        />
        <View className="flex-1 ml-3">
          <Text className="text-white font-bold" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-gray-500 text-xs" numberOfLines={1}>
            {artist?.stageName || artist?.name || "Unknown Artist"}
          </Text>
        </View>
        <View className="w-10 h-10 rounded-full items-center justify-center overflow-hidden">
          <LinearGradient
            colors={isCurrentlyPlaying ? ["#D946EF", "#8B5CF6"] : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
            className="w-full h-full items-center justify-center"
          >
            <Ionicons
              name={isCurrentlyPlaying ? "pause" : "play"}
              size={18}
              color={isCurrentlyPlaying ? "white" : "#9CA3AF"}
            />
          </LinearGradient>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={["top"]}>
      {/* Header */}
      <LinearGradient
        colors={["#0A0A0F", "#151520"]}
        className="px-6 py-4 border-b border-white/5"
      >
        <View className="flex-row items-center mb-4">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 bg-white/5 rounded-full items-center justify-center mr-4"
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-white text-2xl font-black italic tracking-tighter">MUSIC STORE</Text>
            <Text className="text-purple-500 text-[10px] font-bold tracking-widest uppercase">
              Buy & Own Your Favorites
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row mb-4">
          <Pressable
            onPress={() => setShowMyMusic(false)}
            className={`flex-1 py-2.5 rounded-xl mr-2 ${!showMyMusic ? "bg-purple-600" : "bg-white/5"}`}
          >
            <Text className={`text-center font-bold text-sm ${!showMyMusic ? "text-white" : "text-gray-400"}`}>
              Browse
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowMyMusic(true)}
            className={`flex-1 py-2.5 rounded-xl ${showMyMusic ? "bg-purple-600" : "bg-white/5"}`}
          >
            <Text className={`text-center font-bold text-sm ${showMyMusic ? "text-white" : "text-gray-400"}`}>
              My Library ({myTracks.length})
            </Text>
          </Pressable>
        </View>

        {/* Search (only in browse) */}
        {!showMyMusic && (
          <View className="flex-row items-center bg-black/40 rounded-2xl px-4 py-3 border border-white/5">
            <Ionicons name="search" size={18} color="#6B7280" />
            <TextInput
              placeholder="Search tracks or artists..."
              placeholderTextColor="#4B5563"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-white ml-3 font-medium"
            />
            {searchQuery && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#6B7280" />
              </Pressable>
            )}
          </View>
        )}
      </LinearGradient>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text className="text-gray-500 mt-4">Loading music...</Text>
        </View>
      ) : showMyMusic ? (
        /* My Library */
        <PageContainer>
          {myTracks.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <View className="w-20 h-20 bg-white/5 rounded-full items-center justify-center mb-4">
                <Ionicons name="musical-notes-outline" size={32} color="#374151" />
              </View>
              <Text className="text-white text-lg font-bold mb-2">No Purchases Yet</Text>
              <Text className="text-gray-500 text-center px-8 text-sm">
                Tracks you buy will appear here. Browse the store to find music you love!
              </Text>
              <Pressable
                onPress={() => setShowMyMusic(false)}
                className="mt-6 bg-purple-600 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-bold">Browse Music</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={myTracks}
              renderItem={renderMyTrack}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 24 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </PageContainer>
      ) : (
        /* Browse Store */
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <PageContainer>
            {/* Sort Options */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="border-b border-white/5"
              contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12 }}
            >
              {[
                { label: "Trending", value: "trending" as SortOption },
                { label: "Newest", value: "newest" as SortOption },
                { label: "Price: Low", value: "price_low" as SortOption },
                { label: "Price: High", value: "price_high" as SortOption },
                { label: "Most Played", value: "most_played" as SortOption },
              ].map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setSortBy(option.value)}
                  className={`px-4 py-2 rounded-xl mr-2 ${
                    sortBy === option.value ? "bg-purple-600" : "bg-white/5"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      sortBy === option.value ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Tracks Grid */}
            {filteredTracks.length === 0 ? (
              <View className="items-center justify-center py-20">
                <View className="w-20 h-20 bg-white/5 rounded-full items-center justify-center mb-4">
                  <Ionicons name="musical-notes-outline" size={32} color="#374151" />
                </View>
                <Text className="text-white text-lg font-bold mb-2">No Music Available</Text>
                <Text className="text-gray-500 text-center px-8 text-sm">
                  Check back soon for new releases from your favorite artists!
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredTracks}
                renderItem={renderTrackCard}
                keyExtractor={(item) => item.id}
                numColumns={Platform.OS === "web" ? 3 : 2}
                columnWrapperStyle={{
                  justifyContent: Platform.OS === "web" ? "flex-start" : "space-between",
                  gap: Platform.OS === "web" ? 16 : 0,
                }}
                contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            )}
          </PageContainer>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
