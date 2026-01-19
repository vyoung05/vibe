import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useMusicStore } from "../state/musicStore";
import { useAppStore } from "../state/appStore";
import type { Track, Artist } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const MusicScreen: React.FC = () => {
  const artists = useAppStore((s) => s.artists);
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const position = useMusicStore((s) => s.position);
  const duration = useMusicStore((s) => s.duration);
  const playTrack = useMusicStore((s) => s.playTrack);
  const pauseTrack = useMusicStore((s) => s.pauseTrack);
  const resumeTrack = useMusicStore((s) => s.resumeTrack);
  const setQueue = useMusicStore((s) => s.setQueue);

  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);

  // Get all tracks from all artists
  const allTracks = artists.flatMap((artist) =>
    artist.tracks.map((track) => ({ ...track, artist }))
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

  const handlePlayTrack = (track: Track, index: number) => {
    // Set the entire filtered list as queue
    setQueue(filteredTracks, index);
    playTrack(track);
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
        className={`bg-[#151520] border ${isCurrentTrack ? "border-purple-500" : "border-gray-800"
          } rounded-xl p-4 mb-3`}
      >
        <View className="flex-row items-center">
          {/* Track Number / Playing Indicator */}
          <View className="w-8 items-center justify-center">
            {isCurrentTrack && isPlaying ? (
              <Ionicons name="musical-notes" size={20} color="#8B5CF6" />
            ) : (
              <Text className="text-gray-500 text-sm font-bold">{index + 1}</Text>
            )}
          </View>

          {/* Album Art */}
          <Image
            source={{ uri: item.coverArt }}
            style={{ width: 50, height: 50, borderRadius: 8, marginLeft: 12 }}
            contentFit="cover"
          />

          {/* Track Info */}
          <View className="flex-1 ml-3">
            <Text
              className={`font-bold text-sm ${isCurrentTrack ? "text-purple-400" : "text-white"
                }`}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text className="text-gray-400 text-xs mt-1" numberOfLines={1}>
              {artist.name}
            </Text>
            <View className="flex-row items-center mt-1">
              <Ionicons name="play" size={10} color="#6B7280" />
              <Text className="text-gray-500 text-[10px] ml-1">
                {item.playCount.toLocaleString()} plays
              </Text>
              {item.isHot && (
                <>
                  <View className="w-1 h-1 rounded-full bg-gray-600 mx-2" />
                  <Ionicons name="flame" size={10} color="#EF4444" />
                  <Text className="text-red-400 text-[10px] ml-1">HOT</Text>
                </>
              )}
            </View>
          </View>

          {/* Duration */}
          <Text className="text-gray-500 text-xs">
            {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, "0")}
          </Text>
        </View>

        {/* Progress Bar for Current Track */}
        {isCurrentTrack && duration > 0 && (
          <View className="mt-3">
            <View className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <View
                className="h-full bg-purple-500"
                style={{ width: `${(position / duration) * 100}%` }}
              />
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-gray-500 text-[10px]">{formatTime(position)}</Text>
              <Text className="text-gray-500 text-[10px]">{formatTime(duration)}</Text>
            </View>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#0A0A0F]">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-800">
        <Text className="text-white text-2xl font-bold">Music</Text>
        <Text className="text-gray-400 text-sm mt-1">
          {filteredTracks.length} tracks available
        </Text>
      </View>

      {/* Artist Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="border-b border-gray-800"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
      >
        <Pressable
          onPress={() => setSelectedArtist(null)}
          className={`px-4 py-2 rounded-full mr-2 ${selectedArtist === null ? "bg-purple-600" : "bg-[#151520]"
            }`}
        >
          <Text
            className={`font-semibold text-sm ${selectedArtist === null ? "text-white" : "text-gray-400"
              }`}
          >
            All Artists
          </Text>
        </Pressable>

        {artists.map((artist) => (
          <Pressable
            key={artist.id}
            onPress={() => setSelectedArtist(artist.id)}
            className={`px-4 py-2 rounded-full mr-2 ${selectedArtist === artist.id ? "bg-purple-600" : "bg-[#151520]"
              }`}
          >
            <Text
              className={`font-semibold text-sm ${selectedArtist === artist.id ? "text-white" : "text-gray-400"
                }`}
            >
              {artist.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Track List */}
      <FlatList
        data={filteredTracks}
        renderItem={renderTrackItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          { padding: 16, paddingBottom: currentTrack ? 160 : 100 },
          Platform.OS === 'web' ? { maxWidth: 800, width: '100%', alignSelf: 'center' } : {}
        ]}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="musical-notes-outline" size={64} color="#374151" />
            <Text className="text-gray-400 text-center mt-4 text-lg">
              No tracks available
            </Text>
            <Text className="text-gray-500 text-center mt-2 text-sm">
              Artists need to upload their music first
            </Text>
          </View>
        }
      />

      {/* Now Playing Bar (if track is playing) */}
      {currentTrack && (
        <View className="absolute bottom-0 left-0 right-0 bg-[#1C1C24] border-t border-gray-800 p-4 items-center">
          <View className="flex-row items-center w-full max-w-[800px]">
            <Image
              source={{ uri: currentTrack.coverArt }}
              style={{ width: 60, height: 60, borderRadius: 8 }}
              contentFit="cover"
            />
            <View className="flex-1 ml-3">
              <Text className="text-white font-bold" numberOfLines={1}>
                {currentTrack.title}
              </Text>
              <Text className="text-gray-400 text-sm mt-1">
                {artists.find((a) => a.id === currentTrack.artistId)?.name || "Unknown"}
              </Text>
            </View>
            <Pressable
              onPress={togglePlayPause}
              className="w-14 h-14 bg-purple-600 rounded-full items-center justify-center"
            >
              <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="white" />
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};
