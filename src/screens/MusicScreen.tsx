import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useMusicStore } from "../state/musicStore";
import { useAppStore } from "../state/appStore";
import { PageContainer } from "../components/PageContainer";
import { fetchArtists, incrementPlayCount } from "../services/musicService";
import type { Track, Artist } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const MusicScreen: React.FC = () => {
  const localArtists = useAppStore((s) => s.artists);
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const position = useMusicStore((s) => s.position);
  const duration = useMusicStore((s) => s.duration);
  const playTrack = useMusicStore((s) => s.playTrack);
  const pauseTrack = useMusicStore((s) => s.pauseTrack);
  const resumeTrack = useMusicStore((s) => s.resumeTrack);
  const setQueue = useMusicStore((s) => s.setQueue);

  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);

  // Load artists from Supabase + local
  const loadArtists = useCallback(async () => {
    try {
      console.log("[MusicScreen] Loading artists...");
      const supabaseArtists = await fetchArtists();
      
      // Merge with local artists (local takes priority for same IDs)
      const supabaseIds = new Set(supabaseArtists.map((a) => a.id));
      const localOnly = localArtists.filter((a) => !supabaseIds.has(a.id));
      
      const allArtists = [...supabaseArtists, ...localOnly];
      console.log(`[MusicScreen] Loaded ${supabaseArtists.length} from Supabase, ${localOnly.length} local-only`);
      
      setArtists(allArtists);
    } catch (error) {
      console.error("[MusicScreen] Error loading artists:", error);
      setArtists(localArtists);
    } finally {
      setLoading(false);
    }
  }, [localArtists]);

  // Load on focus
  useFocusEffect(
    useCallback(() => {
      loadArtists();
    }, [loadArtists])
  );

  // Get all tracks from all artists
  const allTracks = artists.flatMap((artist) =>
    (artist.tracks || []).map((track) => ({ ...track, artist }))
  );

  const filteredTracks = selectedArtist
    ? allTracks.filter((t) => t.artistId === selectedArtist)
    : allTracks;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayTrack = async (track: Track, index: number) => {
    // Set the entire filtered list as queue
    setQueue(filteredTracks, index);
    playTrack(track);
    
    // Increment play count in Supabase
    try {
      await incrementPlayCount(track.id);
    } catch (e) {
      // Ignore errors, not critical
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      resumeTrack();
    }
  };

  const renderTrackItem = ({ item, index }: { item: Track & { artist: Artist }; index: number }) => {
    const isCurrentTrack = currentTrack?.id === item.id;
    const artist = item.artist;

    return (
      <Pressable
        onPress={() => handlePlayTrack(item, index)}
        className={`bg-white/5 border ${isCurrentTrack ? "border-purple-500 shadow-lg shadow-purple-500/20" : "border-white/10"
          } rounded-3xl p-5 mb-4 shadow-2xl shadow-black/40`}
      >
        <View className="flex-row items-center">
          {/* Track Number / Playing Indicator */}
          <View className="w-10 items-center justify-center">
            {isCurrentTrack && isPlaying ? (
              <Ionicons name="musical-notes" size={24} color="#A78BFA" />
            ) : (
              <Text className="text-gray-600 text-xs font-black italic">{index + 1}</Text>
            )}
          </View>

          {/* Album Art */}
          <View className="relative">
            <Image
              source={{ uri: item.coverArt }}
              style={{ width: 56, height: 56, borderRadius: 16 }}
              contentFit="cover"
              placeholder={{ uri: "https://via.placeholder.com/56" }}
            />
            {isCurrentTrack && isPlaying && (
              <View className="absolute inset-0 bg-purple-500/20 rounded-2xl items-center justify-center">
                <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center border border-white/40">
                  <Ionicons name="pause" size={16} color="white" />
                </View>
              </View>
            )}
          </View>

          {/* Track Info */}
          <View className="flex-1 ml-4">
            <Text
              className={`font-black text-base italic tracking-tight ${isCurrentTrack ? "text-purple-400" : "text-white"
                }`}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-1" numberOfLines={1}>
              {artist.name}
            </Text>
            <View className="flex-row items-center mt-2">
              <View className="bg-white/5 px-2 py-0.5 rounded-md flex-row items-center border border-white/5">
                <Ionicons name="play" size={8} color="#9CA3AF" />
                <Text className="text-gray-500 text-[9px] font-bold ml-1">
                  {(item.playCount || 0).toLocaleString()}
                </Text>
              </View>
              {item.isHot && (
                <View className="bg-red-500/10 px-2 py-0.5 rounded-md flex-row items-center border border-red-500/20 ml-2">
                  <Ionicons name="flame" size={8} color="#EF4444" />
                  <Text className="text-red-400 text-[9px] font-black uppercase tracking-widest ml-1">HOT</Text>
                </View>
              )}
            </View>
          </View>

          {/* Duration */}
          <View className="items-end">
            <Text className="text-gray-500 text-[10px] font-black">
              {Math.floor((item.duration || 0) / 60)}:{((item.duration || 0) % 60).toString().padStart(2, "0")}
            </Text>
            {isCurrentTrack && (
              <Ionicons name="stats-chart" size={14} color="#A78BFA" className="mt-2" />
            )}
          </View>
        </View>

        {/* Progress Bar for Current Track */}
        {isCurrentTrack && duration > 0 && (
          <View className="mt-5">
            <View className="h-[2px] bg-white/5 rounded-full overflow-hidden">
              <LinearGradient
                colors={["#8B5CF6", "#D946EF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: "100%", width: `${(position / duration) * 100}%` }}
              />
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-gray-600 text-[9px] font-black tracking-widest">{formatTime(position)}</Text>
              <Text className="text-gray-600 text-[9px] font-black tracking-widest">{formatTime(duration)}</Text>
            </View>
          </View>
        )}
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View className="items-center justify-center py-32">
      <View className="w-20 h-20 bg-white/5 rounded-full items-center justify-center mb-6">
        <Ionicons name="musical-notes-outline" size={32} color="#374151" />
      </View>
      <Text className="text-white text-xl font-black italic tracking-tight mb-2">NO MUSIC YET</Text>
      <Text className="text-gray-500 text-center font-bold text-xs uppercase tracking-widest px-8">
        Artists can upload tracks from their profile. Check back soon for new releases!
      </Text>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#0A0A0F]">
      {/* Header */}
      <PageContainer>
        <View className="px-6 py-8 border-b border-white/5 relative overflow-hidden">
          <LinearGradient
            colors={["rgba(139, 92, 246, 0.1)", "transparent"]}
            className="absolute top-0 left-0 right-0 h-40"
          />
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white text-4xl font-black italic tracking-tighter uppercase">Music</Text>
              <Text className="text-purple-500 text-[10px] font-black uppercase tracking-[4px] mt-1.5 px-0.5">
                {filteredTracks.length} {filteredTracks.length === 1 ? "TRACK" : "TRACKS"}
              </Text>
            </View>
            <View className="w-12 h-12 bg-white/5 rounded-full items-center justify-center border border-white/10 shadow-2xl">
              <Ionicons name="search" size={20} color="white" />
            </View>
          </View>
        </View>
      </PageContainer>

      {/* Loading State */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text className="text-gray-500 mt-4 text-sm">Loading music...</Text>
        </View>
      ) : (
        <>
          {/* Artist Filter */}
          {artists.length > 0 && (
            <PageContainer>
              <View className="border-white/5">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}
                >
                  <Pressable
                    onPress={() => setSelectedArtist(null)}
                    className="mr-3"
                  >
                    <LinearGradient
                      colors={selectedArtist === null ? ["#8B5CF6", "#D946EF"] : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.05)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className={`px-6 py-2.5 rounded-2xl border ${selectedArtist === null ? "border-transparent" : "border-white/10"}`}
                    >
                      <Text
                        className={`text-[10px] font-black uppercase tracking-widest ${selectedArtist === null ? "text-white" : "text-gray-500"}`}
                      >
                        All Artists
                      </Text>
                    </LinearGradient>
                  </Pressable>

                  {artists.map((artist) => (
                    <Pressable
                      key={artist.id}
                      onPress={() => setSelectedArtist(artist.id)}
                      className="mr-3"
                    >
                      <LinearGradient
                        colors={selectedArtist === artist.id ? ["#8B5CF6", "#D946EF"] : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.05)"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className={`px-6 py-2.5 rounded-2xl border ${selectedArtist === artist.id ? "border-transparent" : "border-white/10"}`}
                      >
                        <Text
                          className={`text-[10px] font-black uppercase tracking-widest ${selectedArtist === artist.id ? "text-white" : "text-gray-500"}`}
                        >
                          {artist.name}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </PageContainer>
          )}

          {/* Track List */}
          <PageContainer>
            <FlatList
              data={filteredTracks}
              renderItem={renderTrackItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                { paddingHorizontal: 24, paddingBottom: currentTrack ? 180 : 120 },
                Platform.OS === 'web' ? { width: '100%', alignSelf: 'center' } : {}
              ]}
              ListEmptyComponent={renderEmptyState}
            />
          </PageContainer>
        </>
      )}

      {/* Now Playing Bar (if track is playing) */}
      {currentTrack && (
        <View className="absolute bottom-0 left-0 right-0 bg-black/90 border-t border-white/10 items-center">
          <PageContainer>
            <View className="px-6 py-5 w-full flex-row items-center border border-white/5 bg-white/5 m-4 rounded-3xl shadow-2xl">
              <View className="relative">
                <Image
                  source={{ uri: currentTrack.coverArt }}
                  style={{ width: 64, height: 64, borderRadius: 16 }}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.4)"]}
                  className="absolute inset-0 rounded-2xl"
                />
              </View>
              <View className="flex-1 ml-4 justify-center">
                <Text className="text-white font-black text-lg italic tracking-tight" numberOfLines={1}>
                  {currentTrack.title}
                </Text>
                <Text className="text-purple-500 text-[10px] font-black uppercase tracking-widest mt-1">
                  {artists.find((a) => a.id === currentTrack.artistId)?.name || "Unknown Artist"}
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mr-3 border border-white/10">
                  <Ionicons name="heart-outline" size={20} color="white" />
                </View>
                <Pressable
                  onPress={togglePlayPause}
                  className="w-14 h-14 rounded-full overflow-hidden shadow-xl shadow-purple-500/40"
                >
                  <LinearGradient
                    colors={["#8B5CF6", "#D946EF"]}
                    className="w-full h-full items-center justify-center"
                  >
                    <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="white" />
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </PageContainer>
        </View>
      )}
    </SafeAreaView>
  );
};
